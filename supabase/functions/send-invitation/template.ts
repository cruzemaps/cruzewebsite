// Email template for the invitation pipeline. Edit copy/layout here without
// touching index.ts (the function plumbing).
//
// DESIGN APPROACH — LIGHT THEME WITH DARK ACCENT BANDS:
//   Gmail dark mode aggressively auto-darkens already-dark emails, which is
//   why the previous fully-dark design rendered as ghost text in Gmail dark
//   mode. The robust solution every major transactional sender (Stripe,
//   Linear, Vercel, Notion, Figma) uses: a LIGHT email body with dark brand
//   bands at top and bottom.
//
//   - White card background, near-black body text → reads predictably in
//     both light AND dark mode (Gmail dim-pass keeps it legible).
//   - Dark header band with logo + role eyebrow gives brand presence without
//     being touched by dark-mode auto-inversion.
//   - Dark footer band closes the visual frame.
//   - Brand accent colors (cyan / orange) used for: top accent bar,
//     "Accept invitation" CTA, headline highlight, bullet markers.
//
//   - Table-based layout (Outlook compatibility).
//   - Inline styles only (most clients strip <style> blocks).
//   - Hidden preheader text in <span style="display:none"> at the top.
//   - meta name="color-scheme" left as "light" so clients don't try to
//     auto-flip the design.
//
// Returns { subject, html, text } for Resend's API.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

const BRAND = {
  // Dark band colors (header + footer)
  charcoal: "#0B0E14",
  charcoalDeep: "#070A10",

  // Light body colors
  bodyBg: "#F4F6FB",         // outer canvas (page background)
  cardBg: "#FFFFFF",         // email card background
  cardBorder: "#E5E9F2",     // subtle card edges

  // Light-theme text
  textPrimary: "#0B0E14",    // headlines on white
  textBody: "#1F2530",       // body copy
  textMuted: "#5C6478",      // tertiary
  textFaint: "#8F98AB",      // faint footer text in light areas

  // Dark-band text
  darkBandPrimary: "#FFFFFF",
  darkBandSecondary: "#C5CCDB",
  darkBandFaint: "#8F98AB",

  // Brand accents
  cyan: "#00B4C0",           // slightly darker cyan that has good contrast on WHITE
  cyanBg: "#00F2FF",         // brighter cyan for use on dark bands / CTA backgrounds
  orange: "#E67700",         // slightly darker orange for white background readability
  orangeBg: "#FF8C00",       // brighter orange for dark bands / CTA backgrounds

  // Bullet card
  bulletCardBg: "#F8FAFD",
  bulletCardBorder: "#E5E9F2",

  // System
  fontStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
};

const LOGO_URL = "https://cruzemaps.com/logo.png";

// Per-role copy and accent.
// `accentDark` is used on dark surfaces (bands, CTAs); `accentText` is the
// readable variant for accent text on the WHITE body.
const COPY: Record<
  string,
  {
    subject: string;
    preheader: string;
    eyebrow: string;
    subhead: string;
    bullets: string[];
    accentDark: string;   // color used on dark bands / for the CTA fill
    accentText: string;   // color used for accent text on white background
  }
> = {
  admin: {
    subject: "You've been invited as a Cruzemaps Admin",
    preheader: "Accept your admin invitation to manage Cruze pilots, users, and audit trails.",
    eyebrow: "Admin invitation",
    subhead: "You'll have full operational control of the Cruzemaps platform: pilot reviews, user management, and the complete audit trail.",
    bullets: [
      "Review and approve incoming pilot applications",
      "Manage roles and access for the entire team",
      "Inspect every change with the immutable audit log",
      "Issue invitations, suspend accounts, and impersonate users for support",
    ],
    accentDark: BRAND.cyanBg,
    accentText: BRAND.cyan,
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
    accentDark: BRAND.cyanBg,
    accentText: BRAND.cyan,
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
    accentDark: BRAND.orangeBg,
    accentText: BRAND.orange,
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
            <span style="display:inline-block; width:8px; height:8px; border-radius:9999px; background:${copy.accentText}; margin-top:7px;">&nbsp;</span>
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
    .button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
  <style>
    /* Override Gmail dark mode auto-inversion. Gmail's mobile dark mode
       sometimes recolors emails it considers "light" — these classes hint
       to keep the explicit colors. Standard properties used by Gmail. */
    u + .body .gmail-fix { display: none !important; }
    @media (prefers-color-scheme: dark) {
      .body { background:${BRAND.bodyBg} !important; }
      .card { background:${BRAND.cardBg} !important; }
      .text-primary { color:${BRAND.textPrimary} !important; }
      .text-body { color:${BRAND.textBody} !important; }
      .text-muted { color:${BRAND.textMuted} !important; }
    }
  </style>
</head>
<body class="body" style="margin:0; padding:0; background:${BRAND.bodyBg}; font-family:${BRAND.fontStack}; color:${BRAND.textBody}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%;">
  <!-- Preheader (preview snippet in inbox list, hidden in body) -->
  <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px;">
    ${escapeHtml(copy.preheader)}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bodyBg}; min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- Outer card -->
        <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:${BRAND.cardBg}; border:1px solid ${BRAND.cardBorder}; border-radius:14px; overflow:hidden; box-shadow:0 4px 24px rgba(11,14,20,0.06);">

          <!-- DARK HEADER BAND with logo + brand + eyebrow -->
          <tr>
            <td style="background:${BRAND.charcoal}; padding:32px 40px;" bgcolor="${BRAND.charcoal}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle; padding-right:14px; width:56px;">
                    <img src="${LOGO_URL}" width="48" height="48" alt="Cruzemaps" style="display:block; border:0; outline:none; border-radius:10px; max-width:48px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; font-size:20px; letter-spacing:0.10em; color:${BRAND.darkBandPrimary}; font-family:${BRAND.fontStack}; line-height:1.1;">CRUZE</div>
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:${copy.accentDark}; font-family:${BRAND.fontStack}; margin-top:6px; font-weight:600;">${escapeHtml(copy.eyebrow)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top accent bar in brand color -->
          <tr>
            <td style="height:4px; background:${copy.accentDark}; line-height:4px; font-size:0; mso-line-height-rule:exactly;" bgcolor="${copy.accentDark}">&nbsp;</td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:40px 40px 12px 40px; background:${BRAND.cardBg};">
              <h1 class="text-primary" style="margin:0; font-size:30px; line-height:1.18; font-weight:700; color:${BRAND.textPrimary}; font-family:${BRAND.fontStack}; letter-spacing:-0.02em;">
                You've been invited to <span style="color:${copy.accentText};">Cruzemaps</span>.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px 40px; background:${BRAND.cardBg};">
              <p class="text-body" style="margin:0 0 14px; font-size:16px; line-height:1.55; color:${BRAND.textBody}; font-family:${BRAND.fontStack};">
                ${escapeHtml(inviter)} invited you to join Cruzemaps as <strong style="color:${copy.accentText}; font-weight:600;">${escapeHtml(roleLabel)}</strong>.
              </p>
              <p class="text-body" style="margin:0; font-size:16px; line-height:1.55; color:${BRAND.textBody}; font-family:${BRAND.fontStack};">
                ${escapeHtml(copy.subhead)}
              </p>
            </td>
          </tr>

          <!-- Bullets card on a slightly tinted background -->
          <tr>
            <td style="padding:0 40px 32px 40px; background:${BRAND.cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bulletCardBg}; border:1px solid ${BRAND.bulletCardBorder}; border-radius:10px; width:100%;">
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

          <!-- CTA button. Bullet-proof: solid bgcolor + dark text + explicit padding. -->
          <tr>
            <td align="left" style="padding:0 40px 16px 40px; background:${BRAND.cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${copy.accentDark}; border-radius:10px;" bgcolor="${copy.accentDark}">
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
            <td style="padding:8px 40px 32px 40px; background:${BRAND.cardBg};">
              <p class="text-muted" style="margin:0 0 6px; font-size:13px; color:${BRAND.textMuted}; line-height:1.5; font-family:${BRAND.fontStack};">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 16px; font-size:13px; word-break:break-all; line-height:1.55; font-family:${BRAND.fontStack};">
                <a href="${escapeAttr(vars.inviteUrl)}" style="color:${copy.accentText}; text-decoration:underline;">${escapeHtml(vars.inviteUrl)}</a>
              </p>
              <p class="text-muted" style="margin:0; font-size:13px; color:${BRAND.textMuted}; line-height:1.5; font-family:${BRAND.fontStack};">
                This invitation expires on <strong style="color:${BRAND.textPrimary}; font-weight:600;">${escapeHtml(expiresIso)}</strong>. If you weren't expecting this email you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- DARK FOOTER BAND -->
          <tr>
            <td style="background:${BRAND.charcoalDeep}; padding:24px 40px 28px 40px;" bgcolor="${BRAND.charcoalDeep}">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; letter-spacing:0.10em; font-size:13px; color:${BRAND.darkBandPrimary}; font-family:${BRAND.fontStack}; text-transform:uppercase;">Cruzemaps</div>
                    <div style="margin-top:4px; font-size:12px; color:${BRAND.darkBandSecondary}; font-family:${BRAND.fontStack};">Dissolve traffic, not just avoid it.</div>
                  </td>
                  <td align="right" style="vertical-align:middle; font-size:12px; font-family:${BRAND.fontStack};">
                    <a href="https://cruzemaps.com" style="color:${copy.accentDark}; text-decoration:none; font-weight:600;">cruzemaps.com</a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0; font-size:11px; color:${BRAND.darkBandFaint}; line-height:1.6; font-family:${BRAND.fontStack};">
                Sent to ${escapeHtml(vars.email)} · Questions: <a href="mailto:hello@cruzemaps.com" style="color:${BRAND.darkBandSecondary}; text-decoration:underline;">hello@cruzemaps.com</a>
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
