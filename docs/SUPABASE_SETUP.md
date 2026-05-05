# Supabase setup

What you need to do in the Supabase dashboard so the security fix, role-management workflow, JWT claims, and admin portal all work end-to-end.

## 1. Run the migrations in order

In Supabase Dashboard → **SQL Editor**, paste and run each file from [supabase/migrations/](../supabase/migrations/) **in order**:

1. **`20260504_001_security_fix.sql`** — patches the privilege-escalation hole in the original `handle_new_user` trigger. After this runs, all new signups land as `fleet_owner` regardless of what the signup payload says. Existing self-promoted accounts get demoted; their original request is preserved in `requested_role` so you can review and re-promote in the admin portal.

   ⚠️ **Before running:** edit the bottom UPDATE block to exempt your own admin user UUID, otherwise you'll demote yourself. Find your UUID with: `select id, email from auth.users where email = 'YOUR_EMAIL';`

2. **`20260504_002_role_management.sql`** — adds `organizations`, `role_history`, `invitations` tables; profile status; `is_admin()`, `change_user_role()`, `accept_invitation()`, `touch_last_active()`, `live_impact_stats()` functions; expanded pilot lifecycle states; tightened RLS using `is_admin()`.

3. **`20260504_003_jwt_claims.sql`** — installs `custom_access_token_hook(jsonb)` so role/status/organization_id appear as claims in every issued JWT.

## 2. Register the JWT auth hook (the one extra dashboard step)

Migration 003 only installs the function. You also need to tell Supabase Auth to call it:

1. Dashboard → **Authentication** → **Hooks**
2. Find **"Customize Access Token (JWT) Claims hook"**
3. Enable it
4. Function: `public.custom_access_token_hook`
5. Save.

After this, sign out and back in. Your next JWT will contain `app_role`, `app_status`, and `app_organization_id` claims. The React app reads these — check the network tab on `/admin`; it should no longer hit `profiles` on every nav.

## 3. Promote yourself to admin

After running migration 001, your account is now `fleet_owner` (unless you exempted yourself). To reclaim admin:

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Then sign out and back in so the JWT picks up the new role.

## 4. Realtime (optional but recommended)

The admin portal can stream new pilot applications and invitations live. Enable realtime per table:

Dashboard → **Database** → **Replication** → toggle on for:
- `public.pilot_applications`
- `public.invitations`
- `public.role_history`

## 5. Email (for invitations)

The invitation flow currently generates a tokenized link in the admin portal that you copy and send manually. To send automatically:

1. Set up a Supabase Edge Function `send-invitation` that's invoked when a row is inserted into `invitations` (DB webhook on insert).
2. The function calls Resend / Postmark / SendGrid with the invite link.

A starter Edge Function is intentionally not included — the chosen provider depends on your domain and deliverability setup. Keep the manual copy-link flow until you wire it.

## 6. Supabase storage for the press kit (optional)

If you want the `/press` download links to actually serve files:

1. Create a public bucket `press`.
2. Upload `cruze-brand-assets.zip`, `cruze-fact-sheet.pdf`, `cruze-founders.zip`, `cruze-product-screens.zip`.
3. In `src/pages/Press.tsx`, replace the `/press/...` paths with the public Storage URLs (or proxy them through the Pages site).

## 7. Verify

After all the above:

1. Open `/admin` — should load Operations Hub with three counts at the top.
2. Click **Users** → **Manage** on any user → change role with a reason → confirm a row appears in **Audit**.
3. Click **Invitations** → **Create invite** → copy link → open in incognito → sign up → click invitation link → land on the right dashboard with the right role.
4. Open `/stats` — should show real numbers from `live_impact_stats()` RPC.

If `/admin` shows "Failed to load applications": you forgot to grant `is_admin()` execute or the auth hook isn't registered. Re-check steps 2 and 3 above.
