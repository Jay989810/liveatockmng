-- Add 'deleted' column to livestock table for soft deletes
alter table public.livestock add column if not exists deleted boolean default false;

-- Add index for performance on filtering
create index if not exists idx_livestock_deleted on public.livestock(deleted);
