-- SQL: activate_subscription(payment_id uuid, transaction_id text)
-- Updates payments row, sets completed status, and updates the user's subscription
-- Create as a SECURITY DEFINER function scoped to your schema

create or replace function public.activate_subscription(
  p_payment_id uuid,
  p_transaction_id text
) returns json language plpgsql security definer as $$
declare
  v_payment record;
  v_user record;
  v_now timestamp := now();
  v_end_date timestamp;
  v_result json;
begin
  select * into v_payment from payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found';
  end if;

  -- mark payment completed
  update payments
    set status = 'completed',
        transaction_id = p_transaction_id,
        completed_at = v_now,
        updated_at = v_now
  where id = p_payment_id;

  -- compute end date
  if v_payment.billing_cycle = 'month' then
    v_end_date := v_now + interval '1 month';
  elsif v_payment.billing_cycle = '3 months' then
    v_end_date := v_now + interval '3 months';
  elsif v_payment.billing_cycle = '6 months' then
    v_end_date := v_now + interval '6 months';
  else
    v_end_date := v_now + interval '1 year';
  end if;

  -- update user subscription
  update users
    set subscription_tier = v_payment.plan_id,
        subscription_status = 'active',
        subscription_end_date = v_end_date,
        usage_count = 0
  where id = v_payment.user_id
  returning * into v_user;

  -- also update resource limits as needed in app code

  v_result := json_build_object(
    'subscription_id', concat('sub_', extract(epoch from v_now)),
    'plan_id', v_payment.plan_id,
    'payment', row_to_json(v_payment)
  );

  return v_result;
end;
$$;


