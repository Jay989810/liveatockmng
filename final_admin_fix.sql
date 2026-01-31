-- 1. Enable RLS on profiles (Safety)
alter table public.profiles enable row level security;

-- 2. Drop potential conflicting policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- 3. Create permissive policies for correct access
create policy "Users can view own profile"
on public.profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on public.profiles for update
using ( auth.uid() = id );

-- 4. CRITICAL: Insert profiles for users who exist in Auth but missing in Profiles
-- This fixes the "Admin Dashboard not showing" if the profile row was missing
insert into public.profiles (id, full_name, role, is_admin)
select 
  id, 
  raw_user_meta_data->>'full_name', 
  'user', 
  true -- Defaulting to TRUE for you to ensure you see the dashboard
from auth.users
where id not in (select id from public.profiles);

-- 5. Force ALL existing profiles to be Admin (For your peace of mind)
update public.profiles set is_admin = true;

-- 6. Verify Function for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, is_admin)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user', false)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
