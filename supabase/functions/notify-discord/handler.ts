// Request handling for the notify-discord edge function, kept free of network
// and Supabase imports so it can be unit tested with `deno test` (see
// handler.test.ts). index.ts wires in the real database and Discord calls.
//
// The function is called by database webhook triggers with no auth header, so
// anyone on the internet can POST to it. It therefore trusts only `type`,
// `table` and `record.id` from the payload. Everything that reaches Discord is
// read back from the database by id with the service role, and:
//   - only INSERTs on pilot_applications, loi_signatures and contact_messages
//   - only rows created in the last 10 minutes (and not dated in the future)
//   - each row is posted at most once (public.discord_notifications_sent,
//     migration 020), so a captured payload cannot be replayed
//   - more than 10 contact messages in 10 minutes posts one summary note per
//     10-minute window instead of one embed per message
//   - allowed_mentions is empty, so text like @everyone never pings, and user
//     text is markdown-escaped so it cannot form masked links or headings

export const TABLES = ["pilot_applications", "loi_signatures", "contact_messages"] as const;
export type Table = (typeof TABLES)[number];

// Columns read back for each table. Nothing else from the row is used.
export const COLUMNS: Record<Table, string> = {
  pilot_applications:
    "id, company_name, truck_size, fleet_size, notes, contact_name, contact_email, fms_provider, website, created_at",
  loi_signatures:
    "id, participant_name, participant_company, participant_title, fleet_size, initials, signed_at, created_at",
  contact_messages: "id, name, email, organization, message, created_at",
};

export const FRESH_MS = 10 * 60 * 1000;
export const FUTURE_SKEW_MS = 60 * 1000;
export const CONTACT_FLOOD_WINDOW_MS = 10 * 60 * 1000;
export const CONTACT_FLOOD_LIMIT = 10;
export const CONTACT_PREVIEW_CHARS = 500;

export const SITE_URL = "https://cruzemaps.com";
export const ADMIN_MESSAGES_URL = `${SITE_URL}/admin?tab=messages`;

// Discord embed colors (decimal-encoded hex)
const COLOR_PILOT = 0xff8c00; // brand orange
const COLOR_LOI = 0x00b4c0; // brand cyan-teal
const COLOR_CONTACT = 0xe8590c; // brand-orange from the site palette

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

export type ClaimResult = "claimed" | "duplicate" | "error";

export interface DiscordResult {
  ok: boolean;
  status: number;
  text: string;
}

export interface Deps {
  env(name: string): string | undefined;
  now(): Date;
  // Re-read one row by id with the service role. `error` is set on a query
  // failure; `row` is null when no row has that id.
  loadRow(table: Table, id: string): Promise<{ row: Row | null; error?: string }>;
  // Record that `key` was posted. "duplicate" when it already was.
  claim(key: string): Promise<ClaimResult>;
  // Contact messages created at or after `sinceIso`, or null on a query error.
  countContactsSince(sinceIso: string): Promise<number | null>;
  postDiscord(url: string, body: unknown): Promise<DiscordResult>;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!payload || typeof payload !== "object") return json({ error: "Invalid payload" }, 400);

  if (payload.type !== "INSERT") return json({ skipped: "not an insert" });

  const table = payload.table;
  if (!(TABLES as readonly string[]).includes(table)) {
    return json({ skipped: "unknown table" });
  }

  const id = payload.record?.id;
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return json({ error: "record.id must be a uuid" }, 400);
  }

  const webhookUrl = webhookFor(table as Table, deps.env);
  if (!webhookUrl) {
    // Opting out of Discord is not an error; return 200 so callers do not retry.
    return json({ skipped: `no webhook URL configured for ${table}` });
  }

  const { row, error } = await deps.loadRow(table as Table, id);
  if (error) {
    console.error(`notify-discord: could not read ${table} ${id}: ${error}`);
    return json({ error: "could not read the row" }, 500);
  }
  if (!row) return json({ skipped: "row not found" });

  const now = deps.now();
  if (!isFresh(row.created_at, now)) return json({ skipped: "row is not new" });

  const claim = await deps.claim(`${table}:${row.id}`);
  if (claim === "duplicate") return json({ skipped: "already notified" });
  if (claim === "error") return json({ error: "could not record the notification" }, 500);

  let body: unknown;
  if (table === "contact_messages") {
    const since = new Date(now.getTime() - CONTACT_FLOOD_WINDOW_MS).toISOString();
    const recent = await deps.countContactsSince(since);
    if (recent === null) {
      // The row itself is verified, so a failed count still posts it.
      console.error("notify-discord: contact message count failed, posting the single message");
    }
    if (recent !== null && recent > CONTACT_FLOOD_LIMIT) {
      const bucket = Math.floor(now.getTime() / CONTACT_FLOOD_WINDOW_MS);
      const flood = await deps.claim(`contact_messages:flood:${bucket}`);
      if (flood !== "claimed") return json({ skipped: "flood guard" });
      body = contactFloodNote(recent);
    } else {
      body = contactEmbed(row);
    }
  } else if (table === "pilot_applications") {
    body = pilotEmbed(row);
  } else {
    body = loiEmbed(row);
  }

  const res = await deps.postDiscord(webhookUrl, body);
  if (!res.ok) {
    console.error(`notify-discord: Discord ${res.status}: ${res.text}`);
    return json({ error: `Discord ${res.status}` }, 500);
  }
  return json({ ok: true, table });
}

export function webhookFor(table: Table, env: (name: string) => string | undefined): string | undefined {
  const fallback = env("DISCORD_WEBHOOK_URL") || undefined;
  if (table === "pilot_applications") return env("DISCORD_WEBHOOK_PILOTS") || fallback;
  if (table === "loi_signatures") return env("DISCORD_WEBHOOK_LOIS") || fallback;
  return env("DISCORD_WEBHOOK_CONTACT") || fallback;
}

export function isFresh(createdAt: unknown, now: Date): boolean {
  if (typeof createdAt !== "string" || !createdAt) return false;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age <= FRESH_MS && age >= -FUTURE_SKEW_MS;
}

// Escape Discord markdown so user text shows as typed: no masked links, bold,
// code blocks, headings, quotes or mention syntax. allowed_mentions already
// stops pings; this stops formatting.
export function plain(value: unknown): string {
  const s = value == null ? "" : String(value);
  return s.replace(/[\\`*_~|<>[\]()]/g, "\\$&").replace(/^(\s*)([#-])/gm, "$1\\$2");
}

// One embed field value: escaped, never empty, at most 1024 characters.
function fieldValue(value: unknown, max = 1024): string {
  const s = value == null ? "" : String(value);
  if (!s.trim()) return "(none)";
  const escaped = plain(s);
  return escaped.length > max ? escaped.slice(0, max - 1) + "…" : escaped;
}

function message(embed: Row): Row {
  return {
    username: "Cruzemaps",
    avatar_url: `${SITE_URL}/logo.png`,
    allowed_mentions: { parse: [] },
    embeds: [embed],
  };
}

export function pilotEmbed(row: Row): Row {
  const fields = [
    { name: "Company", value: row.company_name ? fieldValue(row.company_name) : "(unspecified)", inline: true },
    { name: "Fleet size", value: row.fleet_size ? fieldValue(row.fleet_size) : "(unspecified)", inline: true },
    { name: "Truck class", value: row.truck_size ? fieldValue(row.truck_size) : "(unspecified)", inline: true },
  ];

  if (row.contact_name) {
    fields.push({ name: "Contact", value: fieldValue(row.contact_name), inline: true });
  }
  if (row.contact_email) {
    fields.push({ name: "Email", value: fieldValue(row.contact_email), inline: true });
  }
  if (row.fms_provider) {
    fields.push({ name: "FMS", value: fieldValue(row.fms_provider), inline: true });
  }
  if (row.website) {
    fields.push({ name: "Website", value: fieldValue(row.website), inline: false });
  }
  if (row.notes) {
    fields.push({ name: "Admin notes", value: fieldValue(row.notes), inline: false });
  }

  return message({
    title: "🚛 New pilot application",
    description: `A new fleet just submitted a pilot application.`,
    url: `${SITE_URL}/admin`,
    color: COLOR_PILOT,
    fields,
    footer: {
      text: `Application ID ${row.id.slice(0, 8)} · ${new Date(row.created_at).toLocaleString("en-US")}`,
      icon_url: `${SITE_URL}/logo.png`,
    },
    timestamp: row.created_at,
  });
}

export function loiEmbed(row: Row): Row {
  const fields: Row[] = [
    { name: "Participant", value: fieldValue(row.participant_name), inline: true },
    { name: "Initials", value: fieldValue(row.initials), inline: true },
    { name: "Company", value: fieldValue(row.participant_company), inline: false },
    { name: "Fleet size", value: fieldValue(row.fleet_size), inline: true },
  ];

  if (row.participant_title) {
    fields.push({ name: "Title", value: fieldValue(row.participant_title), inline: true });
  }

  return message({
    title: "✍️ LOI signed",
    description: `**${fieldValue(row.participant_name, 200)}** just signed the Letter of Intent.`,
    url: `${SITE_URL}/loi/${row.id}`,
    color: COLOR_LOI,
    fields,
    footer: {
      text: `Signature ID ${row.id.slice(0, 8)} · ${new Date(row.signed_at).toLocaleString("en-US")}`,
      icon_url: `${SITE_URL}/logo.png`,
    },
    timestamp: row.signed_at,
  });
}

export function contactEmbed(row: Row): Row {
  const text = row.message == null ? "" : String(row.message);
  const preview = text.length > CONTACT_PREVIEW_CHARS ? text.slice(0, CONTACT_PREVIEW_CHARS) + "…" : text;
  return message({
    title: "New contact message",
    description: "Someone wrote in through the contact form. Reply by email and mark it handled in the admin tab.",
    url: ADMIN_MESSAGES_URL,
    color: COLOR_CONTACT,
    fields: [
      { name: "Name", value: fieldValue(row.name), inline: true },
      { name: "Organization", value: fieldValue(row.organization), inline: true },
      { name: "Email", value: fieldValue(row.email), inline: false },
      { name: "Message", value: fieldValue(preview), inline: false },
      { name: "Admin tab", value: ADMIN_MESSAGES_URL, inline: false },
    ],
    footer: {
      text: `Message ID ${row.id.slice(0, 8)} · ${new Date(row.created_at).toLocaleString("en-US")}`,
      icon_url: `${SITE_URL}/logo.png`,
    },
    timestamp: row.created_at,
  });
}

export function contactFloodNote(count: number): Row {
  return message({
    title: "Contact form flood guard",
    description:
      `${count} contact messages arrived in the last 10 minutes. ` +
      "New ones are not posted here one by one until the rate drops. Read them in the admin tab.",
    url: ADMIN_MESSAGES_URL,
    color: COLOR_CONTACT,
    fields: [{ name: "Admin tab", value: ADMIN_MESSAGES_URL, inline: false }],
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
