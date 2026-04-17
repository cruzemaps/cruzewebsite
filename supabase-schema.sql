-- 1. Create a Profiles table to securely link Supabase Auth users to App Roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null check (role in ('admin', 'fleet_owner', 'city_operator')),
  first_name text,
  last_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.profiles enable row level security;

-- Create Policies for Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. Trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, first_name, last_name)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'role', 'fleet_owner'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Create Pilot Applications table
create table if not exists public.pilot_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  company_name text,
  truck_size text,
  fleet_size text,
  status text check (status in ('pending', 'approved', 'denied')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.pilot_applications enable row level security;

create policy "Users can view own pilot application"
  on public.pilot_applications for select
  using ( auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Users can insert own pilot application"
  on public.pilot_applications for insert
  with check ( auth.uid() = user_id );

create policy "Admins can update applications"
  on public.pilot_applications for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );
