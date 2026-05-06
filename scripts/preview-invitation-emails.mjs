#!/usr/bin/env bun
// Render the invitation email template for each role and write the
// resulting HTML to /tmp so you can preview in a browser before deploying
// the Edge Function. Run with: `bun scripts/preview-invitation-emails.mjs`

import { renderInvitationEmail } from "../supabase/functions/send-invitation/template.ts";
import { writeFile, mkdir } from "node:fs/promises";

const OUT_DIR = "/tmp/cruze-email-previews";
await mkdir(OUT_DIR, { recursive: true });

const ROLES = ["admin", "city_operator", "fleet_owner"];
const SAMPLE_INVITE_TOKEN = "abc123preview456token789def";
const EXPIRES_IN_DAYS = 7;
const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 86400_000).toISOString();

for (const role of ROLES) {
  const { subject, html } = renderInvitationEmail({
    email: `preview-${role}@example.com`,
    role,
    inviteUrl: `https://cruzemaps.com/invite/${SAMPLE_INVITE_TOKEN}`,
    expiresAt,
    inviterName: "Anudeep Bonagiri",
  });

  const path = `${OUT_DIR}/${role}.html`;
  await writeFile(path, html, "utf8");
  console.log(`✓ ${role}: ${path}`);
  console.log(`  Subject: ${subject}`);
}

console.log(`\nOpen each in your browser:`);
for (const role of ROLES) {
  console.log(`  open ${OUT_DIR}/${role}.html`);
}
