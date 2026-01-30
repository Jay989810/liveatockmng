-- Add images column to livestock table to support multiple images
alter table public.livestock 
add column images text[] default '{}';

-- Migrate existing image_url data to the new images array if needed
update public.livestock 
set images = array[image_url] 
where image_url is not null and images = '{}';

-- (Optional) You can perform this cleanup later if you want to drop the old column
-- alter table public.livestock drop column image_url;
