-- Add detailed delivery columns to transactions table
alter table public.transactions 
add column if not exists state text,
add column if not exists city text,
add column if not exists delivery_instructions text;
