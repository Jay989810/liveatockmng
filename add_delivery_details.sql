-- Add delivery details to transactions table
alter table public.transactions 
add column if not exists recipient_name text,
add column if not exists delivery_address text,
add column if not exists phone_number text,
add column if not exists delivery_status text default 'Processing'; 
-- delivery_status was added in previous step but good to ensure
