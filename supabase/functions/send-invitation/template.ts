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
//   - Hidden preheader text in <span style="display:none"> at the very top
//     gives the inbox-list preview snippet a useful sentence.
//
// Returns { subject, html, text } for Resend's API.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

const BRAND = {
  charcoal: "#0B0E14",
  charcoalDeep: "#070A10",
  cardBg: "#0F131C",
  cardBorder: "rgba(255,255,255,0.08)",
  cyan: "#00F2FF",
  orange: "#FF8C00",
  white: "#FFFFFF",
  whiteStrong: "rgba(255,255,255,0.92)",
  whiteMuted: "rgba(255,255,255,0.65)",
  whiteFaint: "rgba(255,255,255,0.42)",
  whiteGhost: "rgba(255,255,255,0.28)",
  // Use a system font stack that approximates Inter on most platforms.
  // Web fonts via @import in email are unreliable — most clients strip them.
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
  admin: "Admin",
  city_operator: "City Operator",
  fleet_owner: "Fleet Operator",
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

  const bulletsHtml = copy.bullets
    .map(
      (b) => `
        <tr>
          <td style="padding:8px 0; vertical-align:top; width:22px; line-height:1;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:9999px; background:${accent}; margin-top:8px; box-shadow:0 0 12px ${accent};"></span>
          </td>
          <td style="padding:8px 0 8px 8px; color:${BRAND.whiteStrong}; font-size:15px; line-height:1.55; font-family:${BRAND.fontStack};">${escapeHtml(b)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${escapeHtml(copy.subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { mso-line-height-rule: exactly; line-height: normal; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background:${BRAND.charcoalDeep}; font-family:${BRAND.fontStack}; color:${BRAND.white}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%;">
  <!-- Preheader (preview snippet in inbox list, hidden in body) -->
  <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px;">
    ${escapeHtml(copy.preheader)}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.charcoalDeep};">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- Outer card with subtle gradient border at top -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:${BRAND.charcoal}; border-radius:18px; overflow:hidden;">

          <!-- Top accent bar (gradient) -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, ${BRAND.orange} 0%, ${BRAND.cyan} 100%); line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header / brand -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:14px;">
                    <img src="${LOGO_URL}" width="44" height="44" alt="Cruze logo" style="display:block; border:0; outline:none; border-radius:10px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; font-size:20px; letter-spacing:0.10em; color:${BRAND.white}; font-family:${BRAND.fontStack}; line-height:1;">CRUZE</div>
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:${accent}; font-family:${BRAND.fontStack}; margin-top:6px;">${escapeHtml(copy.eyebrow)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <h1 style="margin:0; font-size:34px; line-height:1.12; font-weight:700; color:${BRAND.white}; font-family:${BRAND.fontStack}; letter-spacing:-0.02em;">
                You've been invited<br/>to <span style="color:${accent};">Cruze</span>.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px 40px;">
              <p style="margin:0; font-size:16px; line-height:1.6; color:${BRAND.whiteMuted}; font-family:${BRAND.fontStack};">
                ${escapeHtml(inviter)} invited you to join as a
                <strong style="color:${accent}; font-weight:600;">${escapeHtml(roleLabel)}</strong>.
                ${escapeHtml(copy.subhead)}
              </p>
            </td>
          </tr>

          <!-- Bullets card -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cardBg}; border:1px solid ${BRAND.cardBorder}; border-radius:14px; width:100%;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:${accent}; font-family:${BRAND.fontStack}; margin-bottom:12px;">What you'll get</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${bulletsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="left" style="padding:0 40px 16px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${accent}; border-radius:9999px;">
                    <a href="${escapeAttr(vars.inviteUrl)}"
                       style="display:inline-block; padding:16px 36px; color:${BRAND.charcoal}; font-weight:700; font-size:15px; text-decoration:none; border-radius:9999px; font-family:${BRAND.fontStack}; letter-spacing:0.02em;">
                      Accept invitation →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Plain link fallback + expiry -->
          <tr>
            <td style="padding:8px 40px 32px 40px;">
              <p style="margin:0 0 10px; font-size:13px; color:${BRAND.whiteFaint}; line-height:1.5; font-family:${BRAND.fontStack};">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 18px; font-size:13px; word-break:break-all; line-height:1.5; font-family:${BRAND.fontStack};">
                <a href="${escapeAttr(vars.inviteUrl)}" style="color:${accent}; text-decoration:underline;">${escapeHtml(vars.inviteUrl)}</a>
              </p>
              <p style="margin:0; font-size:13px; color:${BRAND.whiteFaint}; line-height:1.5; font-family:${BRAND.fontStack};">
                This invitation expires on <strong style="color:${BRAND.whiteMuted}; font-weight:600;">${escapeHtml(expiresIso)}</strong>.
                If you weren't expecting this, you can safely ignore the email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid ${BRAND.cardBorder}; padding:24px 40px 32px 40px; background:${BRAND.charcoalDeep};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; letter-spacing:0.08em; font-size:12px; color:${BRAND.whiteMuted}; font-family:${BRAND.fontStack};">CRUZE TECHNOLOGIES</div>
                    <div style="margin-top:4px; font-size:12px; color:${BRAND.whiteFaint}; font-family:${BRAND.fontStack}; font-style:italic;">Dissolve traffic, not just avoid it.</div>
                  </td>
                  <td align="right" style="vertical-align:middle; font-size:12px; color:${BRAND.whiteFaint}; font-family:${BRAND.fontStack};">
                    <a href="https://cruzemaps.com" style="color:${BRAND.whiteMuted}; text-decoration:none;">cruzemaps.com</a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0; font-size:11px; color:${BRAND.whiteGhost}; line-height:1.6; font-family:${BRAND.fontStack};">
                Sent to ${escapeHtml(vars.email)}. Questions: <a href="mailto:hello@cruzemaps.com" style="color:${BRAND.whiteFaint}; text-decoration:none;">hello@cruzemaps.com</a>
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
    `${inviter} invited you to join as a ${roleLabel}.`,
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
