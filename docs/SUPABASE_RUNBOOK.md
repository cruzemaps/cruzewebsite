# Supabase setup runbook (for Claude in Chrome / extension)

This is a **click-by-click runbook** an extension can execute. Every step has an exact URL, button name, and the exact text to paste. Do steps in order; do not skip.

> Project URL pattern: `https://supabase.com/dashboard/project/<PROJECT_REF>`
> Replace `<PROJECT_REF>` everywhere — find it in the project URL after you log in.

---

## Step 1 — Run migration 001 (security fix)

1. Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`
2. Open this file in the repo: [`supabase/migrations/20260504_001_security_fix.sql`](../supabase/migrations/20260504_001_security_fix.sql)
3. Copy the **entire file contents** and paste into the SQL editor.
4. Click the green **RUN** button (or press `Cmd/Ctrl+Enter`).
5. Verify: bottom panel shows `Success. No rows returned`.

> If you see `relation "public.profiles" does not exist`, the original `supabase-schema.sql` was never applied. Run that first from the repo root, then come back to this step.

---

## Step 2 — Run migration 002 (role management)

1. Same URL: `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`
2. Click **+ New query** in the left sidebar to start fresh.
3. Open: [`supabase/migrations/20260504_002_role_management.sql`](../supabase/migrations/20260504_002_role_management.sql)
4. Copy the entire file contents and paste.
5. Click **RUN**.
6. Verify: `Success. No rows returned`. If you see `function ... already exists`, that's safe — re-running is idempotent for the `create or replace` blocks.

---

## Step 3 — Run migration 003 (JWT custom claims function)

1. Same URL, **+ New query**.
2. Open: [`supabase/migrations/20260504_003_jwt_claims.sql`](../supabase/migrations/20260504_003_jwt_claims.sql)
3. Copy the entire file contents and paste.
4. Click **RUN**.
5. Verify: `Success`.

This installs the function but doesn't activate it yet — that's step 5.

---

## Step 4 — Find your admin user UUID & promote yourself

1. Navigate to `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`, **+ New query**.
2. Paste this query (replace `YOUR_EMAIL` with the email you signed up with):

   ```sql
   select id, email from auth.users where email = 'YOUR_EMAIL';
   ```

3. Click **RUN**. Copy the `id` value from the result row (looks like `c3d4e5f6-1234-5678-9abc-def012345678`).
4. Now promote yourself to admin. **+ New query**, paste (replace `YOUR_UUID_HERE`):

   ```sql
   update public.profiles
   set role = 'admin', status = 'active'
   where id = 'YOUR_UUID_HERE';
   ```

5. Click **RUN**. Verify: bottom shows `Success. 1 row affected`.

---

## Step 5 — (Optional but recommended) Audit & demote any self-promoted legacy accounts

Skip this if your project has zero existing users besides yourself.

1. Navigate to `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`, **+ New query**.
2. Audit query — paste and **RUN**:

   ```sql
   select id, role, first_name, last_name
   from public.profiles
   where role in ('admin','city_operator')
   order by created_at;
   ```

3. **Manually review** the result. Each row is someone whose role was self-assigned at signup. For each one that should NOT have that role, copy the `id`.
4. Demotion query — paste, replace the array with the UUIDs you want demoted, and **RUN**:

   ```sql
   update public.profiles
   set
     requested_role = role,  -- preserve what they originally requested
     role = 'fleet_owner'
   where id = any (array['UUID_TO_DEMOTE_1','UUID_TO_DEMOTE_2']::uuid[]);
   ```

You'll re-promote legitimate ones via the Admin Portal later (more auditable than raw SQL).

---

## Step 6 — Activate the JWT auth hook (the one critical dashboard click)

This is the step that makes role-based access work without a database round-trip on every nav.

1. Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/auth/hooks`
2. Find the section labeled **"Custom Access Token (JWT) Claims hook"**. Click **Add a new hook** or its toggle.
3. **Hook type**: select `Postgres`.
4. **Schema**: select `public`.
5. **Function**: select `custom_access_token_hook`.
6. Click **Create hook** (or **Save**).
7. Verify: the hook appears in the enabled list.

---

## Step 7 — Sign out and back in (force JWT refresh)

The currently-issued JWT does not yet contain the new claims. To pick them up:

1. In another tab open your live site, e.g. `https://cruzemaps.com/admin`
2. Sign out, then sign back in.
3. Open browser DevTools → Application → Local Storage → find the Supabase auth token. The `access_token` JWT now contains `app_role`, `app_status`, `app_organization_id`. (Decode at jwt.io if you want to confirm.)

---

## Step 8 — Enable realtime on three tables (so admin portal streams updates live)

1. Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/database/replication`
2. Find the `supabase_realtime` publication. Click **Source** or its row to manage tables.
3. Toggle **on** for each:
   - `public.pilot_applications`
   - `public.invitations`
   - `public.role_history`
4. Save.

---

## Step 9 — (Optional) Create the press-kit Storage bucket

Skip if you don't have press-kit assets to upload yet.

1. Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/storage/buckets`
2. Click **New bucket**.
3. Name: `press`. Toggle **Public bucket** ON. Click **Create**.
4. Upload your assets (drag & drop):
   - `cruze-brand-assets.zip`
   - `cruze-fact-sheet.pdf`
   - `cruze-founders.zip`
   - `cruze-product-screens.zip`
5. After upload, click each file → **Get URL** → copy.
6. Open `src/pages/Press.tsx` in the repo and replace each `/press/...` href with the corresponding Storage public URL.

---

## Step 10 — (Optional) Wire transactional invitation emails via Resend

This sends an email automatically when an admin creates an invitation, instead of the admin manually copying the link.

1. Sign up at `https://resend.com`. Verify your `cruzemaps.com` sending domain (DNS records in Resend dashboard → add to Cloudflare DNS).
2. Create an API key in Resend → copy.
3. Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/settings/functions`
4. Under **Edge Function Secrets**, add:
   - Name: `RESEND_API_KEY`, Value: paste your Resend key.
   - Name: `INVITE_BASE_URL`, Value: `https://cruzemaps.com`
5. Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/functions`
6. Click **Deploy a new function**. Name it `send-invitation`.
7. Open the repo file: [`supabase/functions/send-invitation/index.ts`](../supabase/functions/send-invitation/index.ts) — copy its entire contents into the function editor.
8. Click **Deploy**.
9. Now wire the DB webhook so it fires on invitation insert:
   - Navigate to: `https://supabase.com/dashboard/project/<PROJECT_REF>/database/hooks`
   - Click **Create a new hook**.
   - Name: `invite_email_on_insert`.
   - Table: `public.invitations`. Events: `Insert`.
   - Type: `Supabase Edge Functions`. Function: `send-invitation`. Method: `POST`.
   - Save.

---

## Verification checklist (run last)

- [ ] `select * from public.organizations limit 1;` returns 0 rows or runs cleanly (table exists).
- [ ] `select public.is_admin();` returns `true` for you, `false` for non-admins.
- [ ] `select * from public.live_impact_stats();` returns one row with three counts.
- [ ] Site `/admin` loads "Operations Hub" with the three tile counts at the top.
- [ ] Create an invitation in the Invitations tab → copy link → open in incognito → sign up → click link → land on the right dashboard.

If any check fails, the most common cause is the JWT auth hook (Step 6) not being activated.
