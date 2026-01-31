-- 1. Enable RLS on Transactions
alter table public.transactions enable row level security;

-- 2. Drop existing policies to prevent conflicts
drop policy if exists "Users can view own transactions" on public.transactions;
drop policy if exists "Users can create own transactions" on public.transactions;
drop policy if exists "Admins can manage all transactions" on public.transactions;

-- 3. Policy: Users can view their own orders
create policy "Users can view own transactions"
on public.transactions for select
using ( auth.uid() = user_id );

-- 4. Policy: Admins can view and update ALL transactions
create policy "Admins can manage all transactions"
on public.transactions for all
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  )
);

-- 5. Helper: Ensure 'delivery_status' column exists and has default
alter table public.transactions 
add column if not exists delivery_status text default 'Processing';
