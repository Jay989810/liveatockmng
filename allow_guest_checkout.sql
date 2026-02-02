-- 1. Make user_id nullable in transactions table to allow guest checkout
alter table public.transactions alter column user_id drop not null;

-- 2. Update the complete_order RPC to accept null user_id
create or replace function complete_order(
  p_user_id uuid, -- This can now be null
  p_items jsonb, -- Array of objects: { id, price }
  p_payment_ref text,
  p_recipient_name text,
  p_phone_number text,
  p_state text,
  p_city text,
  p_delivery_address text,
  p_delivery_instructions text
) returns void as $$
declare
  item jsonb;
  v_current_qty int;
  v_new_qty int;
begin
  -- Loop through each item in the cart
  for item in select * from jsonb_array_elements(p_items) loop
    
    -- A. Insert Transaction
    insert into public.transactions (
      user_id, 
      livestock_id, 
      amount, 
      flutterwave_ref, 
      status, 
      delivery_status,
      recipient_name, 
      phone_number, 
      state, 
      city, 
      delivery_address, 
      delivery_instructions
    ) values (
      p_user_id,
      (item->>'id')::uuid,
      (item->>'price')::numeric,
      p_payment_ref,
      'Successful',
      'Processing',
      p_recipient_name,
      p_phone_number,
      p_state,
      p_city,
      p_delivery_address,
      p_delivery_instructions
    );

    -- B. Update Livestock Quantity
    select quantity into v_current_qty from public.livestock where id = (item->>'id')::uuid;
    
    -- Handle missing quantity (default to 1)
    if v_current_qty is null then 
      v_current_qty := 1; 
    end if;
    
    v_new_qty := v_current_qty - 1;
    if v_new_qty < 0 then v_new_qty := 0; end if;
    
    update public.livestock
    set 
      quantity = v_new_qty,
      status = case when v_new_qty <= 0 then 'Sold' else status end
    where id = (item->>'id')::uuid;
    
  end loop;
end;
$$ language plpgsql security definer;
