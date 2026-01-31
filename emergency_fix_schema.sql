-- 1. FIX THE SCHEMA ERROR: Add 'role' column if it's missing
alter table public.profiles 
add column if not exists role text default 'user';

-- 1b. Ensure is_admin exists too
alter table public.profiles 
add column if not exists is_admin boolean default false;

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Reset Policies (Fixes permission issues)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on public.profiles for update
using ( auth.uid() = id );

-- 4. REPAIR MISSING PROFILES (The Magic Fix)
insert into public.profiles (id, full_name, role, is_admin)
select 
  id, 
  raw_user_meta_data->>'full_name', 
  'user', -- Now valid because we added the column above
  true 
from auth.users
where id not in (select id from public.profiles);

-- 5. GRANT ADMIN TO EVERYONE (For simple dev access)
update public.profiles set is_admin = true;
