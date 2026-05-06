// Email template for the invitation pipeline. Edit copy/layout here without
// touching index.ts (the function plumbing).
//
// FINAL DESIGN — fully light theme, no dark bands.
//
// Why no dark bands: Gmail dark mode aggressively crushes dark backgrounds
// AND any text inside them, regardless of !important hacks, color-scheme
// hints, or specific hex tricks. We tried two iterations of dark bands and
// both ended up with ghost-text in Gmail dark mode. Light theme avoids the
// fight entirely — Gmail just dims white slightly which stays readable.
//
// Visual identity is preserved through:
//   1. The brand logo at the top
//   2. A colored accent bar (orange or cyan) right under the logo
//   3. A SOLID dark CTA button with white text — the button is intentionally
//      dark, so Gmail leaves it alone, and the white text on top has 14:1+
//      contrast that survives any client treatment
//   4. Brand color used for the role eyebrow, headline highlight, and bullet
//      markers
//   5. A light-gray footer (NOT dark) with proper text contrast
//
// Returns { subject, html, text } for Resend's API.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

const BRAND = {
  // Page + card backgrounds (all light)
  pageBg: "#EEF1F7",
  cardBg: "#FFFFFF",
  cardBorder: "#E0E5EE",
  bulletBg: "#F8FAFD",
  bulletBorder: "#E0E5EE",
  footerBg: "#F4F6FB",   // slightly tinted gray, NOT dark — dark-mode safe
  footerBorder: "#E0E5EE",

  // Light-theme text — solid hex, all readable on white
  textPrimary: "#0B0E14",
  textBody: "#1F2530",
  textMuted: "#5C6478",
  textFaint: "#6F778A",

  // CTA button — solid dark with white text. The dark stays dark in dark
  // mode (Gmail won't darken something already near-black further), and
  // white text on charcoal has the highest possible contrast.
  ctaBg: "#0B0E14",
  ctaText: "#FFFFFF",

  // Brand accents (for the accent bar, eyebrow, headline highlight, bullets)
  cyan: "#00B4C0",       // darker cyan for use as text on white
  cyanBright: "#00F2FF", // brighter cyan for accent bars
  orange: "#E67700",     // darker orange for use as text on white
  orangeBright: "#FF8C00", // brighter orange for accent bars

  // System
  fontStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
};

const LOGO_URL = "https://cruzemaps.com/logo.png";

// `accentText` is the readable variant for accent text on the WHITE body.
// `accentBar` is the brighter saturated variant used for the top accent bar
// and the accent dot markers.
const COPY: Record<
  string,
  {
    subject: string;
    preheader: string;
    eyebrow: string;
    subhead: string;
    bullets: string[];
    accentText: string;
    accentBar: string;
  }
> = {
  admin: {
    subject: "You've been invited as a Cruzemaps Admin",
    preheader: "Accept your admin invitation to manage Cruzemaps pilots, users, and audit trails.",
    eyebrow: "Admin invitation",
    subhead: "You'll have full operational control of the Cruzemaps platform: pilot reviews, user management, and the complete audit trail.",
    bullets: [
      "Review and approve incoming pilot applications",
      "Manage roles and access for the entire team",
      "Inspect every change with the immutable audit log",
      "Issue invitations, suspend accounts, and impersonate users for support",
    ],
    accentText: BRAND.cyan,
    accentBar: BRAND.cyanBright,
  },
  city_operator: {
    subject: "Your Cruzemaps city operator invitation",
    preheader: "Accept your invitation to access Mission Control for your city's corridor.",
    eyebrow: "City operator invitation",
    subhead: "Mission Control gives you live corridor telemetry, coordination metrics, and pre/post benchmarking against control segments.",
    bullets: [
      "Real-time flow telemetry across your corridors",
      "Phantom-jam dissolution metrics, updated continuously",
      "Pre/post benchmarks against unmanaged control segments",
      "Equity and emissions reporting for federal program co-funding",
    ],
    accentText: BRAND.cyan,
    accentBar: BRAND.cyanBright,
  },
  fleet_owner: {
    subject: "Your Cruzemaps fleet pilot invitation",
    preheader: "Accept your invitation to start your Cruzemaps fleet pilot.",
    eyebrow: "Fleet pilot invitation",
    subhead: "Cruzemaps coordinates speeds across your drivers and the swarm around them. Pilots show 8 to 14% fuel reduction and 1 to 2 hours per week reclaimed per driver.",
    bullets: [
      "Live fuel and stop-and-go reduction per truck",
      "Audit-ready CO₂ ledger for sustainability reports",
      "Direct integration with Samsara, Geotab, Motive, Verizon Connect, and Trimble",
      "Calibrated savings projections after a 30-day pilot",
    ],
    accentText: BRAND.orange,
    accentBar: BRAND.orangeBright,
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
  expiresAt: string;
  inviterName?: string;
}

export function renderInvitationEmail(vars: InvitationVars): {
  subject: string;
  html: string;
  text: string;
} {
  const copy = COPY[vars.role] ?? COPY.fleet_owner;
  const roleLabel = ROLE_LABEL[vars.role] ?? vars.role;
  const expiresIso = new Date(vars.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const inviter = vars.inviterName ?? "An admin at Cruzemaps";

  const bulletsHtml = copy.bullets
    .map(
      (b) => `
        <tr>
          <td style="padding:8px 0; vertical-align:top; width:18px; line-height:1;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:9999px; background:${copy.accentBar}; margin-top:7px;">&nbsp;</span>
          </td>
          <td style="padding:8px 0 8px 12px; color:${BRAND.textBody}; font-size:15px; line-height:1.55; font-family:${BRAND.fontStack};">${escapeHtml(b)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(copy.subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { mso-line-height-rule: exactly; line-height: normal; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background:${BRAND.pageBg}; font-family:${BRAND.fontStack}; color:${BRAND.textBody}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%;">
  <!-- Preheader (preview snippet in inbox list, hidden in body) -->
  <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px;">
    ${escapeHtml(copy.preheader)}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.pageBg}; min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- Outer card — fully light, no dark bands anywhere -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:${BRAND.cardBg}; border:1px solid ${BRAND.cardBorder}; border-radius:14px; overflow:hidden; box-shadow:0 6px 28px rgba(11,14,20,0.08);">

          <!-- LIGHT HEADER with logo and role eyebrow -->
          <tr>
            <td style="padding:36px 40px 20px 40px; background:${BRAND.cardBg};" bgcolor="${BRAND.cardBg}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:14px; width:56px;">
                    <img src="${LOGO_URL}" width="48" height="48" alt="Cruzemaps" style="display:block; border:0; outline:none; border-radius:10px; max-width:48px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; font-size:18px; letter-spacing:0.10em; color:${BRAND.textPrimary}; font-family:${BRAND.fontStack}; line-height:1.1;">CRUZEMAPS</div>
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:${copy.accentText}; font-family:${BRAND.fontStack}; margin-top:6px; font-weight:700;">${escapeHtml(copy.eyebrow)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Brand accent bar (the only saturated-color element above the fold) -->
          <tr>
            <td style="height:3px; background:${copy.accentBar}; line-height:3px; font-size:0; mso-line-height-rule:exactly;" bgcolor="${copy.accentBar}">&nbsp;</td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 40px 12px 40px; background:${BRAND.cardBg};" bgcolor="${BRAND.cardBg}">
              <h1 style="margin:0; font-size:30px; line-height:1.18; font-weight:700; color:${BRAND.textPrimary}; font-family:${BRAND.fontStack}; letter-spacing:-0.02em;">
                You've been invited to <span style="color:${copy.accentText};">Cruzemaps</span>.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px 40px; background:${BRAND.cardBg};" bgcolor="${BRAND.cardBg}">
              <p style="margin:0 0 14px; font-size:16px; line-height:1.55; color:${BRAND.textBody}; font-family:${BRAND.fontStack};">
                ${escapeHtml(inviter)} invited you to join Cruzemaps as <strong style="color:${copy.accentText}; font-weight:700;">${escapeHtml(roleLabel)}</strong>.
              </p>
              <p style="margin:0; font-size:16px; line-height:1.55; color:${BRAND.textBody}; font-family:${BRAND.fontStack};">
                ${escapeHtml(copy.subhead)}
              </p>
            </td>
          </tr>

          <!-- Bullets card -->
          <tr>
            <td style="padding:0 40px 32px 40px; background:${BRAND.cardBg};" bgcolor="${BRAND.cardBg}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bulletBg}; border:1px solid ${BRAND.bulletBorder}; border-radius:10px; width:100%;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:${copy.accentText}; font-family:${BRAND.fontStack}; margin-bottom:10px; font-weight:700;">What you'll get</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${bulletsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA — bullet-proof button.
               1. Solid charcoal background (#0B0E14). Gmail dark mode won't
                  "auto-darken" something already near-black, so the bg stays.
               2. WHITE text on the dark button. Highest possible contrast,
                  resists every dark-mode override.
               3. Background applied to BOTH the wrapping <td> AND the <a>
                  itself, so if either is stripped the button still renders.
               4. Big tap target: 18px vertical padding, 56px horizontal,
                  minimum width 280px.
               5. Centered with align="center" on the row. -->
          <tr>
            <td align="center" style="padding:8px 40px 32px 40px; background:${BRAND.cardBg};" bgcolor="${BRAND.cardBg}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${BRAND.ctaBg}" style="background-color:${BRAND.ctaBg}; border-radius:12px; mso-padding-alt:0;">
                    <a href="${escapeAttr(vars.inviteUrl)}"
                       target="_blank"
                       style="display:inline-block; min-width:280px; padding:18px 56px; background-color:${BRAND.ctaBg}; background:${BRAND.ctaBg}; color:${BRAND.ctaText} !important; font-weight:700; font-size:17px; text-decoration:none; border-radius:12px; border:1px solid ${BRAND.ctaBg}; font-family:${BRAND.fontStack}; letter-spacing:0.02em; text-align:center; mso-padding-alt:0; mso-text-raise:18pt;">
                      <span style="color:${BRAND.ctaText} !important; mso-text-raise:18pt;">Accept invitation →</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Plain link fallback + expiry -->
          <tr>
            <td style="padding:0 40px 32px 40px; background:${BRAND.cardBg};" bgcolor="${BRAND.cardBg}">
              <p style="margin:0 0 6px; font-size:13px; color:${BRAND.textMuted}; line-height:1.5; font-family:${BRAND.fontStack};">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 16px; font-size:13px; word-break:break-all; line-height:1.55; font-family:${BRAND.fontStack};">
                <a href="${escapeAttr(vars.inviteUrl)}" style="color:${copy.accentText}; text-decoration:underline;">${escapeHtml(vars.inviteUrl)}</a>
              </p>
              <p style="margin:0; font-size:13px; color:${BRAND.textMuted}; line-height:1.5; font-family:${BRAND.fontStack};">
                This invitation expires on <strong style="color:${BRAND.textPrimary}; font-weight:600;">${escapeHtml(expiresIso)}</strong>. If you weren't expecting this email you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- LIGHT FOOTER (gray, not dark — dark-mode safe) -->
          <tr>
            <td style="background:${BRAND.footerBg}; border-top:1px solid ${BRAND.footerBorder}; padding:32px 40px;" bgcolor="${BRAND.footerBg}" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <div style="font-weight:800; letter-spacing:0.16em; font-size:14px; color:${BRAND.textPrimary}; font-family:${BRAND.fontStack}; text-transform:uppercase;">Cruzemaps</div>
                    <div style="margin-top:6px; font-size:13px; color:${BRAND.textMuted}; font-family:${BRAND.fontStack}; font-style:italic;">Dissolve traffic, not just avoid it.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr><td style="height:1px; background:${BRAND.footerBorder}; line-height:1px; font-size:0;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:14px;">
                    <div style="font-size:13px; color:${BRAND.textMuted}; line-height:1.6; font-family:${BRAND.fontStack};">
                      <a href="https://cruzemaps.com" style="color:${copy.accentText}; text-decoration:none; font-weight:700;">cruzemaps.com</a>
                      <span style="color:${BRAND.textFaint}; padding:0 8px;">·</span>
                      <a href="mailto:hello@cruzemaps.com" style="color:${BRAND.textBody}; text-decoration:none;">hello@cruzemaps.com</a>
                    </div>
                    <div style="margin-top:10px; font-size:11px; color:${BRAND.textFaint}; line-height:1.5; font-family:${BRAND.fontStack};">
                      Sent to ${escapeHtml(vars.email)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `You've been invited to Cruzemaps.`,
    ``,
    `${inviter} invited you to join Cruzemaps as ${roleLabel}.`,
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
    `Cruzemaps — Dissolve traffic, not just avoid it.`,
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
