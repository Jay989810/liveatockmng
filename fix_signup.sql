-- FIX SIGNUP ISSUE: Ensure profile creation trigger works correctly

-- 1. Drop and recreate the trigger function to handle missing 'role' column
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, is_admin)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    false  -- New users are NOT admin by default
  )
  on conflict (id) do nothing;  -- Prevent duplicate errors
  return new;
end;
$$ language plpgsql security definer;

-- 2. Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Ensure profiles table has correct structure
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;

-- 4. Allow users to INSERT their own profile (in case trigger fails)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check ( auth.uid() = id );
