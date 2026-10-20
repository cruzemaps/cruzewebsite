// Contact form inbox (admin Messages tab). Rows come from public.contact_messages
// (migration 015); handled_at / handled_by arrive with migration 020.

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  message: string;
  created_at: string;
  handled_at: string | null;
  handled_by: string | null;
};

export type MessageFilter = "open" | "handled" | "all";

export const INBOX_COLUMNS = "id, name, email, organization, message, created_at, handled_at, handled_by";
// Before migration 020 the handled columns do not exist yet.
export const BASE_COLUMNS = "id, name, email, organization, message, created_at";

export const MESSAGE_LIMIT = 1000;

/** True when PostgREST says a selected or filtered column does not exist. */
export function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .+ does not exist/i.test(error.message ?? "");
}

/** Rows read with BASE_COLUMNS get null handled fields, so they show as open. */
export function toContactMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    organization: row.organization == null ? null : String(row.organization),
    message: String(row.message ?? ""),
    created_at: String(row.created_at ?? ""),
    handled_at: row.handled_at == null ? null : String(row.handled_at),
    handled_by: row.handled_by == null ? null : String(row.handled_by),
  };
}

export function filterMessages(messages: ContactMessage[], filter: MessageFilter, query: string): ContactMessage[] {
  const q = query.trim().toLowerCase();
  return messages.filter((m) => {
    if (filter === "open" && m.handled_at) return false;
    if (filter === "handled" && !m.handled_at) return false;
    if (!q) return true;
    return [m.name, m.email, m.organization].some((v) => (v ?? "").toLowerCase().includes(q));
  });
}

export function countOpen(messages: ContactMessage[]): number {
  return messages.filter((m) => !m.handled_at).length;
}

// Plain addresses only, so a crafted "email" cannot add mailto parameters.
const EMAIL_RE = /^[A-Za-z0-9._+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/** mailto link for a reply, or null when the address does not look like one. */
export function replyHref(email: string): string | null {
  const e = email.trim();
  if (!EMAIL_RE.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent("Re: your message to Cruze")}`;
}
