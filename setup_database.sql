-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create specific schemas if needed (using public for tables)

-- 1. Create Profiles Table (Linked to auth.users)
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  constraint proper_email check (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can update their own profile" 
  on public.profiles for update using (auth.uid() = id);

-- 2. Create Livestock Table
create table public.livestock (
  id uuid default gen_random_uuid() primary key,
  tag_number text not null unique,
  breed text not null,
  age numeric, -- Age in months or years
  weight numeric, -- Weight in kg
  price numeric not null,
  image_url text,
  status text default 'Available' check (status in ('Available', 'Sold', 'Reserved', 'Pending')),
  health_notes text,
  created_at timestamptz default now()
);

-- Enable RLS for Livestock
alter table public.livestock enable row level security;

-- Livestock Policies
-- Everyone can read 'Available' livestock
create policy "Livestock is viewable by everyone" 
  on public.livestock for select using (true);

-- Only Admins can insert/update/delete (We rely on the is_admin flag in profiles)
-- Helper to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

create policy "Admins can manage livestock" 
  on public.livestock for all 
  using (public.is_admin());

-- 3. Create Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  livestock_id uuid references public.livestock(id) not null,
  amount numeric not null,
  flutterwave_ref text unique,
  status text default 'Pending' check (status in ('Pending', 'Successful', 'Failed', 'Cancelled')),
  created_at timestamptz default now()
);

-- Enable RLS for Transactions
alter table public.transactions enable row level security;

-- Transactions Policies
create policy "Users can view their own transactions" 
  on public.transactions for select 
  using (auth.uid() = user_id);

create policy "Admins can view all transactions" 
  on public.transactions for select 
  using (public.is_admin());

create policy "Users can create transactions" 
  on public.transactions for insert 
  with check (auth.uid() = user_id);

-- 4. Storage Bucket Setup
-- Note: You might need to run this in the Supabase SQL Editor as 'postgres' role
insert into storage.buckets (id, name, public)
values ('livestock-images', 'livestock-images', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Give public access to livestock images"
  on storage.objects for select
  using ( bucket_id = 'livestock-images' );

create policy "Allow authenticated users to upload images"
  on storage.objects for insert
  with check ( bucket_id = 'livestock-images' and auth.role() = 'authenticated' );

-- 5. User Signup Trigger (Automatically create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed a dummy admin (Optional - for initial setup safety you might want to manually set this later)
-- update public.profiles set is_admin = true where email = 'your-admin-email@example.com';
