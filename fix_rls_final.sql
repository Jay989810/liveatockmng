-- Final RLS Fix for Livestock Accessibility and Storage
-- This script ensures:
-- 1. Everyone can read livestock
-- 2. Everyone can read images
-- 3. Authenticated users can upload images
-- 4. Admins can manage everything

-- LIVESTOCK TABLE
alter table public.livestock enable row level security;

-- Drop existing policies to avoid conflicts (clean slate)
drop policy if exists "Livestock is viewable by everyone" on public.livestock;
drop policy if exists "Public read access" on public.livestock;
drop policy if exists "Admins can manage livestock" on public.livestock;

-- Create robust policies
create policy "Public Read Access" 
  on public.livestock for select 
  using (true);

create policy "Admin Write Access" 
  on public.livestock for all 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- STORAGE OBJECTS
-- Ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('livestock-images', 'livestock-images', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Give public access to livestock images" on storage.objects;
drop policy if exists "Allow authenticated users to upload images" on storage.objects;

-- Create robust storage policies
create policy "Public Image Read"
  on storage.objects for select
  using ( bucket_id = 'livestock-images' );

create policy "Authenticated Image Upload"
  on storage.objects for insert
  with check ( 
    bucket_id = 'livestock-images' 
    and auth.role() = 'authenticated' 
  );

create policy "User Image Update"
  on storage.objects for update
  using ( bucket_id = 'livestock-images' and auth.uid() = owner );

create policy "User Image Delete"
  on storage.objects for delete
  using ( bucket_id = 'livestock-images' and auth.uid() = owner );
