// Transactional emails for fleet pilot applications.
// @ts-nocheck

const BRAND = {
  pageBg: "#EEF1F7",
  cardBg: "#FFFFFF",
  cardBorder: "#E0E5EE",
  footerBg: "#F4F6FB",
  footerBorder: "#E0E5EE",
  textPrimary: "#0B0E14",
  textBody: "#1F2530",
  textMuted: "#5C6478",
  textFaint: "#6F778A",
  ctaBg: "#0B0E14",
  ctaText: "#FFFFFF",
  orange: "#E67700",
  orangeBright: "#FF8C00",
  cyan: "#00B4C0",
  cyanBright: "#00F2FF",
  fontStack:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
};

const LOGO_URL = "https://cruzemaps.com/logo.png";
const SITE = "https://cruzemaps.com";

const STATUS_COPY: Record<
  string,
  { subject: string; headline: string; body: string; accent: string; accentBar: string }
> = {
  pending: {
    subject: "We received your Cruze pilot application",
    headline: "Application received",
    body: "Thanks for applying. Our team will review your fleet profile and signed LOI within two business days. You can track status anytime on your fleet dashboard.",
    accent: BRAND.orange,
    accentBar: BRAND.orangeBright,
  },
  in_review: {
    subject: "Your Cruze pilot application is under review",
    headline: "Under review",
    body: "Our team is evaluating your application and integration fit. We'll email you when we have a decision or need more information.",
    accent: BRAND.cyan,
    accentBar: BRAND.cyanBright,
  },
  approved: {
    subject: "Your Cruze pilot application was approved",
    headline: "You're approved for the pilot",
    body: "Welcome aboard. Check your fleet dashboard for kickoff details and next steps from our team.",
    accent: BRAND.orange,
    accentBar: BRAND.orangeBright,
  },
  onboarding: {
    subject: "Cruze pilot onboarding has started",
    headline: "Onboarding in progress",
    body: "We're coordinating FMS integration and kickoff. Your fleet dashboard has the latest instructions from our team.",
    accent: BRAND.cyan,
    accentBar: BRAND.cyanBright,
  },
  active: {
    subject: "Your Cruze pilot is now active",
    headline: "Pilot is live",
    body: "Your fleet is active on Cruze coordination. Open your fleet dashboard to view pilot status and your signed LOI.",
    accent: BRAND.cyan,
    accentBar: BRAND.cyanBright,
  },
  denied: {
    subject: "Update on your Cruze pilot application",
    headline: "Application update",
    body: "We reviewed your application but aren't able to include your fleet in the current pilot cohort. Your dashboard has more detail, and you can reach us anytime at hello@cruzemaps.com.",
    accent: BRAND.textMuted,
    accentBar: BRAND.textFaint,
  },
  archived: {
    subject: "Your Cruze pilot application was archived",
    headline: "Application archived",
    body: "This application has been archived. Contact hello@cruzemaps.com if you'd like to start a new pilot conversation.",
    accent: BRAND.textMuted,
    accentBar: BRAND.textFaint,
  },
};

export function renderPilotSubmittedEmail(vars: {
  email: string;
  companyName: string;
  dashboardUrl: string;
  loiUrl?: string;
}): { subject: string; html: string; text: string } {
  const copy = STATUS_COPY.pending;
  const ctaLabel = "View fleet dashboard";
  const extra = vars.loiUrl
    ? `<p style="margin:16px 0 0; font-size:14px; color:${BRAND.textMuted}; font-family:${BRAND.fontStack};">
        <a href="${escapeAttr(vars.loiUrl)}" style="color:${BRAND.orange};">Download your signed LOI</a>
      </p>`
    : "";

  return wrapEmail({
    email: vars.email,
    subject: copy.subject,
    preheader: `Application received for ${vars.companyName}.`,
    eyebrow: "Pilot application",
    headline: copy.headline,
    body: `${copy.body}${vars.companyName ? ` (${escapeHtml(vars.companyName)})` : ""}`,
    ctaUrl: vars.dashboardUrl,
    ctaLabel,
    accent: copy.accent,
    accentBar: copy.accentBar,
    extraHtml: extra,
  });
}

export function renderPilotStatusEmail(vars: {
  email: string;
  companyName: string;
  status: string;
  dashboardUrl: string;
  fleetMessage?: string | null;
}): { subject: string; html: string; text: string } {
  const copy = STATUS_COPY[vars.status] ?? {
    subject: "Update on your Cruze pilot application",
    headline: "Status update",
    body: "Your application status has been updated. Sign in to your fleet dashboard for details.",
    accent: BRAND.cyan,
    accentBar: BRAND.cyanBright,
  };

  const messageBlock = vars.fleetMessage
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
        <tr><td style="padding:16px 18px; background:#F8FAFD; border:1px solid ${BRAND.cardBorder}; border-radius:10px;">
          <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:${copy.accent}; font-weight:700; font-family:${BRAND.fontStack}; margin-bottom:8px;">Message from Cruze</div>
          <p style="margin:0; font-size:15px; line-height:1.55; color:${BRAND.textBody}; font-family:${BRAND.fontStack}; white-space:pre-wrap;">${escapeHtml(vars.fleetMessage)}</p>
        </td></tr>
      </table>`
    : "";

  return wrapEmail({
    email: vars.email,
    subject: copy.subject,
    preheader: copy.headline,
    eyebrow: "Pilot application",
    headline: copy.headline,
    body: copy.body,
    ctaUrl: vars.dashboardUrl,
    ctaLabel: "Open fleet dashboard",
    accent: copy.accent,
    accentBar: copy.accentBar,
    extraHtml: messageBlock,
  });
}

function wrapEmail(opts: {
  email: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  accent: string;
  accentBar: string;
  extraHtml?: string;
}): { subject: string; html: string; text: string } {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(opts.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.pageBg};font-family:${BRAND.fontStack};">
<span style="display:none!important;">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.pageBg};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:14px;">
<tr><td style="padding:32px 40px 16px;"><img src="${LOGO_URL}" width="48" height="48" alt="Cruzemaps"/>
<div style="font-weight:800;font-size:18px;letter-spacing:0.1em;margin-top:12px;color:${BRAND.textPrimary};">CRUZEMAPS</div>
<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${opts.accent};font-weight:700;margin-top:6px;">${escapeHtml(opts.eyebrow)}</div></td></tr>
<tr><td style="height:3px;background:${opts.accentBar};font-size:0;line-height:3px;">&nbsp;</td></tr>
<tr><td style="padding:28px 40px 12px;"><h1 style="margin:0;font-size:28px;color:${BRAND.textPrimary};">${escapeHtml(opts.headline)}</h1></td></tr>
<tr><td style="padding:0 40px 24px;"><p style="margin:0;font-size:16px;line-height:1.55;color:${BRAND.textBody};">${opts.body}</p>${opts.extraHtml ?? ""}</td></tr>
<tr><td align="center" style="padding:8px 40px 32px;">
<a href="${escapeAttr(opts.ctaUrl)}" style="display:inline-block;padding:16px 48px;background:${BRAND.ctaBg};color:${BRAND.ctaText};font-weight:700;font-size:16px;text-decoration:none;border-radius:12px;">${escapeHtml(opts.ctaLabel)} →</a>
</td></tr>
<tr><td style="padding:0 40px 32px;font-size:13px;color:${BRAND.textMuted};">
Or: <a href="${escapeAttr(opts.ctaUrl)}" style="color:${opts.accent};">${escapeHtml(opts.ctaUrl)}</a>
</td></tr>
<tr><td style="background:${BRAND.footerBg};border-top:1px solid ${BRAND.footerBorder};padding:24px 40px;text-align:center;font-size:12px;color:${BRAND.textMuted};">
<a href="${SITE}" style="color:${opts.accent};text-decoration:none;">cruzemaps.com</a> · hello@cruzemaps.com<br/>Sent to ${escapeHtml(opts.email)}
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    opts.headline,
    "",
    opts.body.replace(/<[^>]+>/g, ""),
    "",
    `${opts.ctaLabel}: ${opts.ctaUrl}`,
    "",
    "— Cruzemaps",
  ].join("\n");

  return { subject: opts.subject, html, text };
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
