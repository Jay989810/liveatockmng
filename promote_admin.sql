-- OPTION 1: Promote the most recently created user to Admin
-- Run this if you just signed up and want to be the admin immediately.
update public.profiles
set is_admin = true
where id in (
    select id from public.profiles 
    order by created_at desc 
    limit 1
);

-- OPTION 2: Promote a specific email (Uncomment and replace 'your@email.com')
-- update public.profiles
-- set is_admin = true
-- where email = 'your@email.com';

-- Verify the result
select email, is_admin from public.profiles where is_admin = true;
