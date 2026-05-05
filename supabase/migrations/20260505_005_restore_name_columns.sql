-- ============================================================================
-- 20260505_005_restore_name_columns.sql
-- Restore first_name and last_name columns on profiles so signup form data
-- isn't dropped on the floor. The original supabase-schema.sql declared
-- these columns, but the live database in production never had them.
--
-- After running this, update the trigger function (next block) to populate
-- both columns. Idempotent.
-- ============================================================================

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, role, requested_role, first_name, last_name, email, status, last_active_at
  )
  values (
    new.id,
    'fleet_owner',
    coalesce(new.raw_user_meta_data->>'role', 'fleet_owner'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    'active',
    now()
  );
  return new;
exception
  when others then
    raise log 'handle_new_user failed for user_id=% email=% sqlstate=% message=%',
      new.id, new.email, SQLSTATE, SQLERRM;
    raise;
end;
$$;
