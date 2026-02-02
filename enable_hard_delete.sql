-- Drop the existing foreign key constraint
alter table public.transactions 
drop constraint if exists transactions_livestock_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
-- This ensures that when a livestock item is deleted, all its transaction history is also deleted automatically.
alter table public.transactions 
add constraint transactions_livestock_id_fkey 
foreign key (livestock_id) 
references public.livestock(id) 
on delete cascade;
