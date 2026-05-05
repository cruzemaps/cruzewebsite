-- ============================================================================
-- 20260504_003_jwt_claims.sql
-- Custom-claims auth hook. Injects role + status + organization_id into the
-- JWT so the client doesn't need a per-request lookup against `profiles`.
--
-- AFTER RUNNING THIS, you must register the hook in the Supabase dashboard:
-- Authentication -> Hooks -> Customize Access Token (JWT) Claims hook
-- and select `public.custom_access_token_hook`.
-- ============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_role text;
  v_status text;
  v_org uuid;
begin
  select role, status, organization_id
    into v_role, v_status, v_org
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if v_role is not null then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{app_status}', to_jsonb(coalesce(v_status, 'pending')));
    if v_org is not null then
      claims := jsonb_set(claims, '{app_organization_id}', to_jsonb(v_org::text));
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Grant the supabase auth admin permission to invoke the hook
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant all on table public.profiles to supabase_auth_admin;
create policy "auth admin can read profiles for JWT" on public.profiles
  as permissive for select to supabase_auth_admin using (true);
