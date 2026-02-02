-- Create a secure function to check admin status
-- This function runs with 'security definer' privileges, bypassing RLS
-- enabling us to check admin status reliably even if policies are broken.

create or replace function public.check_is_admin(check_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = check_user_id 
    and is_admin = true
  );
end;
$$ language plpgsql security definer;
