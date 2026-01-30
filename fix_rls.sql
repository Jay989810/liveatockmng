-- Ensure Public Read Access is definitely enabled for everyone
drop policy if exists "Public read access" on public.livestock;
create policy "Public read access" on public.livestock for select using (true);

-- Ensure Authenticated users can insert (for Admins mostly, but let's be safe)
drop policy if exists "Enable insert for authenticated users only" on public.livestock;
create policy "Enable insert for authenticated users only" on public.livestock for insert to authenticated with check (true);

-- Ensure Authenticated users can update
drop policy if exists "Enable update for authenticated users only" on public.livestock;
create policy "Enable update for authenticated users only" on public.livestock for update to authenticated using (true);

-- Ensure Authenticated users can delete
drop policy if exists "Enable delete for authenticated users only" on public.livestock;
create policy "Enable delete for authenticated users only" on public.livestock for delete to authenticated using (true);

-- Ensure storage bucket is public
insert into storage.buckets (id, name, public) 
values ('livestock-images', 'livestock-images', true)
on conflict (id) do update set public = true;

-- Storage policies
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'livestock-images' );

drop policy if exists "Auth Upload" on storage.objects;
create policy "Auth Upload" on storage.objects for insert to authenticated with check ( bucket_id = 'livestock-images' );
