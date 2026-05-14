-- One-time migration: unlock existing beta users as Founder Premium
-- Run this in Supabase SQL Editor after deployment if needed.

-- 1) Unlock businesses that came through FOUNDER50 redemptions
update businesses
set
  beta_access = true,
  beta_plan = 'founder_premium',
  founding_member = true,
  beta_expires_at = coalesce(beta_expires_at, now() + interval '60 days')
where id in (
  select business_id
  from beta_access_redemptions
  where business_id is not null
);

-- 2) During private beta, unlock all existing businesses that are still free/no subscription.
-- Remove or comment this block after your private beta is over.
update businesses b
set
  beta_access = true,
  beta_plan = 'founder_premium',
  founding_member = true,
  beta_expires_at = coalesce(beta_expires_at, now() + interval '60 days')
where not exists (
  select 1
  from subscriptions s
  where s.business_id = b.id
  and s.status = 'active'
);

-- 3) Optional visibility check
select
  id,
  name,
  business_type,
  beta_access,
  beta_plan,
  founding_member,
  beta_expires_at
from businesses
where beta_access = true
order by created_at desc;
