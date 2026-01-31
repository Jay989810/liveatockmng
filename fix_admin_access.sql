-- 1. Ensure Profile RLS Policies exist and allow reading 'is_admin'
alter table public.profiles enable row level security;

-- Drop existing policies to prevent conflicts/duplicates
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

-- Create permissive policies for this dev environment
create policy "Users can view own profile"
on public.profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on public.profiles for update
using ( auth.uid() = id );

-- 2. AUTOMATICALLY MAKE ALL EXISTING USERS ADMINS (For Development Convenience)
-- This ensures you see the dashboard immediately without manual tweaking
update public.profiles 
set is_admin = true;

-- 3. Ensure new users are created correctly (Trigger check)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, is_admin)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user', false);
  return new;
end;
$$ language plpgsql security definer;
