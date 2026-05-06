// Email template for the invitation pipeline. Edit copy/layout here without
// touching index.ts (the function plumbing).
//
// Returns { subject, html, text } for Resend's API.
//
// Conventions:
//   - Table-based layout (works in Outlook/Gmail/dark mode/light mode)
//   - Inline styles only (most email clients strip <style> blocks)
//   - Preheader text in a hidden span at the very top (shows in inbox list)
//   - Plain-text fallback included so accessibility and spam scoring are good
//
// To change the design, edit COPY and BRAND constants below, then redeploy
// the function (Supabase Dashboard → Edge Functions → send-invitation →
// paste new index.ts which imports this).

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

const BRAND = {
  charcoal: "#0B0E14",
  cyan: "#00F2FF",
  orange: "#FF8C00",
  white: "#FFFFFF",
  whiteMuted: "rgba(255,255,255,0.65)",
  whiteFaint: "rgba(255,255,255,0.4)",
  borderFaint: "rgba(255,255,255,0.08)",
  cardBg: "#0F131C",
  fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
};

// Role-specific copy. Edit these to change what each role sees.
const COPY: Record<string, { subject: string; preheader: string; subhead: string; bullets: string[] }> = {
  admin: {
    subject: "You've been invited as a Cruze Admin",
    preheader: "Accept your admin invitation to manage Cruze pilots, users, and audit trails.",
    subhead: "You'll be able to manage pilot applications, change user roles, and run the operations hub.",
    bullets: [
      "Review and approve incoming pilot applications",
      "Manage roles and access for the whole team",
      "View the full audit trail of every change",
    ],
  },
  city_operator: {
    subject: "Your Cruze city operator invitation",
    preheader: "Accept your invitation to access Mission Control for your city's corridor.",
    subhead: "You'll get access to Mission Control, where you can monitor your corridor's flow in real time.",
    bullets: [
      "Real-time corridor flow telemetry",
      "Coordination metrics for your DOT's pilot",
      "Pre/post benchmarks against control segments",
    ],
  },
  fleet_owner: {
    subject: "Your Cruze fleet pilot invitation",
    preheader: "Accept your invitation to start your Cruze fleet pilot.",
    subhead: "You'll get the fleet dashboard with live integration metrics, fuel reduction tracking, and driver-hour reclaim.",
    bullets: [
      "Live fuel and stop-and-go reduction per truck",
      "Audit-ready CO₂ ledger for sustainability reports",
      "Direct integration with Samsara, Geotab, Motive, and others",
    ],
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
  const roleLabel = ROLE_LABEL[vars.role] ?? vars.role;
  const expiresIso = new Date(vars.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const inviter = vars.inviterName ?? "an admin at Cruze";

  const bulletsHtml = copy.bullets
    .map(
      (b) => `
        <tr>
          <td style="padding:6px 0; vertical-align:top; width:24px; color:${BRAND.cyan}; font-size:14px; line-height:1.5;">→</td>
          <td style="padding:6px 0; color:${BRAND.whiteMuted}; font-size:15px; line-height:1.5;">${escapeHtml(b)}</td>
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
</head>
<body style="margin:0; padding:0; background:${BRAND.charcoal}; font-family:${BRAND.fontStack}; color:${BRAND.white}; -webkit-font-smoothing:antialiased;">
  <!-- Preheader (preview snippet in inbox list, hidden in body) -->
  <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all;">
    ${escapeHtml(copy.preheader)}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.charcoal};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%;">
          <!-- Header / brand -->
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${BRAND.cyan}; color:${BRAND.charcoal}; width:40px; height:40px; border-radius:8px; text-align:center; font-weight:800; font-size:20px; vertical-align:middle;">C</td>
                  <td style="padding-left:14px; font-weight:800; letter-spacing:0.06em; font-size:18px; color:${BRAND.white}; vertical-align:middle;">CRUZE</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding-bottom:8px;">
              <h1 style="margin:0; font-size:32px; line-height:1.15; font-weight:700; color:${BRAND.white};">
                You've been invited to Cruze.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0; font-size:16px; line-height:1.55; color:${BRAND.whiteMuted};">
                ${inviter} invited you to join as a <strong style="color:${BRAND.cyan}; font-weight:600;">${escapeHtml(roleLabel)}</strong>.
                ${escapeHtml(copy.subhead)}
              </p>
            </td>
          </tr>

          <!-- Bullets -->
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cardBg}; border:1px solid ${BRAND.borderFaint}; border-radius:12px; width:100%;">
                <tr><td style="padding:20px 24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${bulletsHtml}
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="left" style="padding-bottom:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${BRAND.cyan}; border-radius:9999px;">
                    <a href="${escapeAttr(vars.inviteUrl)}"
                       style="display:inline-block; padding:14px 32px; color:${BRAND.charcoal}; font-weight:700; font-size:16px; text-decoration:none; border-radius:9999px;">
                      Accept invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Plain link fallback + expiry -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 8px; font-size:13px; color:${BRAND.whiteFaint}; line-height:1.5;">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 16px; font-size:13px; color:${BRAND.cyan}; word-break:break-all; line-height:1.5;">
                <a href="${escapeAttr(vars.inviteUrl)}" style="color:${BRAND.cyan}; text-decoration:underline;">${escapeHtml(vars.inviteUrl)}</a>
              </p>
              <p style="margin:0; font-size:13px; color:${BRAND.whiteFaint}; line-height:1.5;">
                This invitation expires on <strong style="color:${BRAND.whiteMuted};">${escapeHtml(expiresIso)}</strong>.
                If you weren't expecting this email you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid ${BRAND.borderFaint}; padding-top:24px;">
              <p style="margin:0 0 6px; font-size:12px; color:${BRAND.whiteFaint}; line-height:1.5;">
                Cruze Technologies · cruzemaps.com
              </p>
              <p style="margin:0 0 6px; font-size:12px; color:${BRAND.whiteFaint}; line-height:1.5;">
                Dissolve traffic, not just avoid it.
              </p>
              <p style="margin:0; font-size:11px; color:${BRAND.whiteFaint}; line-height:1.5;">
                Sent to ${escapeHtml(vars.email)}. Questions: <a href="mailto:hello@cruzemaps.com" style="color:${BRAND.cyan}; text-decoration:none;">hello@cruzemaps.com</a>
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
    ...copy.bullets.map((b) => `  - ${b}`),
    ``,
    `Accept your invitation:`,
    vars.inviteUrl,
    ``,
    `This invitation expires on ${expiresIso}.`,
    `If you weren't expecting this email you can safely ignore it.`,
    ``,
    `Cruze Technologies · cruzemaps.com`,
    `Questions: hello@cruzemaps.com`,
  ].join("\n");

  return { subject: copy.subject, html, text };
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
