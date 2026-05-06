// Email template for the invitation pipeline. Edit copy/layout here without
// touching index.ts (the function plumbing).
//
// DESIGN NOTES:
//   - Pulls the real logo from cruzemaps.com (so updating the file there
//     updates every future email).
//   - Per-role accent color: cyan for cities, orange for fleets, gradient
//     for admin. Matches the website's role tinting.
//   - Charcoal #0B0E14 canvas (matches site).
//   - Table-based layout so Outlook + Gmail + dark mode all render the same.
//   - Inline styles only; <style> blocks are stripped by many clients.
//   - SOLID HEX COLORS for all text. Some clients (Gmail dark mode, Outlook)
//     auto-darken or strip rgba(255,255,255,X) values, leaving low-contrast
//     ghost text. Hex equivalents render reliably everywhere.
//   - Hidden preheader text in <span style="display:none"> at the very top
//     gives the inbox-list preview snippet a useful sentence.
//
// Returns { subject, html, text } for Resend's API.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

const BRAND = {
  // Backgrounds
  charcoal: "#0B0E14",
  charcoalDeep: "#070A10",
  cardBg: "#141821",
  cardBorder: "#1F2530",
  cardBorderStrong: "#2A3140",
  // Text — solid hex equivalents of various opacities, picked so they
  // render with good contrast in BOTH dark mode and light mode email clients.
  white: "#FFFFFF",
  textPrimary: "#F4F6FB",      // body copy, ~95% white
  textSecondary: "#C5CCDB",    // secondary copy, was 0.65 alpha
  textMuted: "#8F98AB",        // tertiary, was 0.42 alpha — now actually readable
  textFooter: "#6F778A",       // footer, was 0.28 alpha — now visible
  // Brand accents
  cyan: "#00F2FF",
  cyanSoft: "#1DD9E5",         // slightly desaturated cyan for some surfaces
  orange: "#FF8C00",
  orangeSoft: "#E07700",
  // System
  fontStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
};

const LOGO_URL = "https://cruzemaps.com/logo.png";

// Per-role copy and accent. Edit these to change what each role sees.
const COPY: Record<
  string,
  { subject: string; preheader: string; eyebrow: string; subhead: string; bullets: string[]; accent: string }
> = {
  admin: {
    subject: "You've been invited as a Cruze Admin",
    preheader: "Accept your admin invitation to manage Cruze pilots, users, and audit trails.",
    eyebrow: "Admin invitation",
    subhead: "You'll have full operational control of the Cruze platform: pilot reviews, user management, and the complete audit trail.",
    bullets: [
      "Review and approve incoming pilot applications",
      "Manage roles and access for the entire team",
      "Inspect every change with the immutable audit log",
      "Issue invitations, suspend accounts, and impersonate users for support",
    ],
    accent: BRAND.cyan,
  },
  city_operator: {
    subject: "Your Cruze city operator invitation",
    preheader: "Accept your invitation to access Mission Control for your city's corridor.",
    eyebrow: "City operator invitation",
    subhead: "Mission Control gives you live corridor telemetry, coordination metrics, and pre/post benchmarking against control segments.",
    bullets: [
      "Real-time flow telemetry across your corridors",
      "Phantom-jam dissolution metrics, updated continuously",
      "Pre/post benchmarks against unmanaged control segments",
      "Equity and emissions reporting for federal program co-funding",
    ],
    accent: BRAND.cyan,
  },
  fleet_owner: {
    subject: "Your Cruze fleet pilot invitation",
    preheader: "Accept your invitation to start your Cruze fleet pilot.",
    eyebrow: "Fleet pilot invitation",
    subhead: "Cruze coordinates speeds across your drivers and the swarm around them. Pilots show 8 to 14% fuel reduction and 1 to 2 hours per week reclaimed per driver.",
    bullets: [
      "Live fuel and stop-and-go reduction per truck",
      "Audit-ready CO₂ ledger for sustainability reports",
      "Direct integration with Samsara, Geotab, Motive, Verizon Connect, and Trimble",
      "Calibrated savings projections after a 30-day pilot",
    ],
    accent: BRAND.orange,
  },
};

const ROLE_LABEL: Record<string, string> = {
  admin: "an Admin",
  city_operator: "a City Operator",
  fleet_owner: "a Fleet Operator",
};

interface InvitationVars {
  email: string;
  role: string;
  inviteUrl: string;
  expiresAt: string; // ISO
  inviterName?: string;
}

export function renderInvitationEmail(vars: InvitationVars): {
  subject: string;
  html: string;
  text: string;
} {
  const copy = COPY[vars.role] ?? COPY.fleet_owner;
  const accent = copy.accent;
  const roleLabel = ROLE_LABEL[vars.role] ?? vars.role;
  const expiresIso = new Date(vars.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const inviter = vars.inviterName ?? "An admin at Cruze";

  // Bullets rendered as a 2-column table per row: dot + text. Solid hex colors
  // throughout so dark-mode email clients don't recolor them.
  const bulletsHtml = copy.bullets
    .map(
      (b) => `
        <tr>
          <td style="padding:6px 0; vertical-align:top; width:18px; line-height:1;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:9999px; background:${accent}; margin-top:9px;">&nbsp;</span>
          </td>
          <td style="padding:6px 0 6px 10px; color:${BRAND.textPrimary}; font-size:15px; line-height:1.5; font-family:${BRAND.fontStack};">${escapeHtml(b)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>${escapeHtml(copy.subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { mso-line-height-rule: exactly; line-height: normal; }
    .button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background:${BRAND.charcoalDeep}; font-family:${BRAND.fontStack}; color:${BRAND.textPrimary}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%;">
  <!-- Preheader (preview snippet in inbox list, hidden in body) -->
  <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px;">
    ${escapeHtml(copy.preheader)}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.charcoalDeep}; min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- Outer card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:${BRAND.charcoal}; border-radius:16px; overflow:hidden;">

          <!-- Top accent bar (gradient) -->
          <tr>
            <td style="height:4px; background:${accent}; line-height:4px; font-size:0; mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <!-- Header / brand -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:16px;">
                    <img src="${LOGO_URL}" width="56" height="56" alt="Cruze" style="display:block; border:0; outline:none; border-radius:12px; max-width:56px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; font-size:22px; letter-spacing:0.10em; color:${BRAND.white}; font-family:${BRAND.fontStack}; line-height:1.1;">CRUZE</div>
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:${accent}; font-family:${BRAND.fontStack}; margin-top:6px; font-weight:600;">${escapeHtml(copy.eyebrow)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px 40px 12px 40px;">
              <h1 style="margin:0; font-size:30px; line-height:1.2; font-weight:700; color:${BRAND.white}; font-family:${BRAND.fontStack}; letter-spacing:-0.02em;">
                You've been invited to <span style="color:${accent};">Cruze</span>.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px 40px;">
              <p style="margin:0 0 14px; font-size:16px; line-height:1.55; color:${BRAND.textSecondary}; font-family:${BRAND.fontStack};">
                ${escapeHtml(inviter)} invited you to join Cruze as <strong style="color:${accent}; font-weight:600;">${escapeHtml(roleLabel)}</strong>.
              </p>
              <p style="margin:0; font-size:16px; line-height:1.55; color:${BRAND.textSecondary}; font-family:${BRAND.fontStack};">
                ${escapeHtml(copy.subhead)}
              </p>
            </td>
          </tr>

          <!-- Bullets card -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cardBg}; border:1px solid ${BRAND.cardBorderStrong}; border-radius:12px; width:100%;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:${accent}; font-family:${BRAND.fontStack}; margin-bottom:14px; font-weight:700;">What you'll get</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${bulletsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA. Bullet-proof button: solid background, dark text, big tap target. -->
          <tr>
            <td align="left" style="padding:0 40px 12px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${accent}; border-radius:10px;" bgcolor="${accent}">
                    <a href="${escapeAttr(vars.inviteUrl)}"
                       class="button"
                       style="display:inline-block; padding:14px 32px; color:${BRAND.charcoal} !important; font-weight:700; font-size:15px; text-decoration:none; border-radius:10px; font-family:${BRAND.fontStack}; letter-spacing:0.02em; mso-padding-alt:0; mso-text-raise:14pt;">
                      Accept invitation →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Plain link fallback -->
          <tr>
            <td style="padding:8px 40px 28px 40px;">
              <p style="margin:0 0 6px; font-size:13px; color:${BRAND.textMuted}; line-height:1.5; font-family:${BRAND.fontStack};">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 16px; font-size:13px; word-break:break-all; line-height:1.55; font-family:${BRAND.fontStack};">
                <a href="${escapeAttr(vars.inviteUrl)}" style="color:${accent}; text-decoration:underline;">${escapeHtml(vars.inviteUrl)}</a>
              </p>
              <p style="margin:0; font-size:13px; color:${BRAND.textMuted}; line-height:1.5; font-family:${BRAND.fontStack};">
                This invitation expires on <strong style="color:${BRAND.textPrimary}; font-weight:600;">${escapeHtml(expiresIso)}</strong>. If you weren't expecting this email you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid ${BRAND.cardBorder}; padding:24px 40px 28px 40px; background:${BRAND.charcoalDeep};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:700; letter-spacing:0.08em; font-size:12px; color:${BRAND.textPrimary}; font-family:${BRAND.fontStack}; text-transform:uppercase;">Cruze Technologies</div>
                    <div style="margin-top:4px; font-size:12px; color:${BRAND.textMuted}; font-family:${BRAND.fontStack};">Dissolve traffic, not just avoid it.</div>
                  </td>
                  <td align="right" style="vertical-align:middle; font-size:12px; font-family:${BRAND.fontStack};">
                    <a href="https://cruzemaps.com" style="color:${BRAND.textSecondary}; text-decoration:none;">cruzemaps.com</a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0; font-size:11px; color:${BRAND.textFooter}; line-height:1.6; font-family:${BRAND.fontStack};">
                Sent to ${escapeHtml(vars.email)} · Questions: <a href="mailto:hello@cruzemaps.com" style="color:${BRAND.textMuted}; text-decoration:underline;">hello@cruzemaps.com</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `You've been invited to Cruze.`,
    ``,
    `${inviter} invited you to join Cruze as ${roleLabel}.`,
    `${copy.subhead}`,
    ``,
    `What you'll get:`,
    ...copy.bullets.map((b) => `  • ${b}`),
    ``,
    `Accept your invitation:`,
    vars.inviteUrl,
    ``,
    `This invitation expires on ${expiresIso}.`,
    `If you weren't expecting this email you can safely ignore it.`,
    ``,
    `—`,
    `Cruze Technologies — Dissolve traffic, not just avoid it.`,
    `cruzemaps.com — hello@cruzemaps.com`,
  ].join("\n");

  return { subject: copy.subject, html, text };
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
