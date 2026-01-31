-- Add quantity column to livestock for stock management
alter table public.livestock 
add column if not exists quantity integer default 1;

-- Add delivery_status to transactions for order tracking
alter table public.transactions 
add column if not exists delivery_status text default 'Processing';

-- Update RLS if needed (usually 'all' covers new columns, but good to be safe)
-- (Existing policies are broad enough)
