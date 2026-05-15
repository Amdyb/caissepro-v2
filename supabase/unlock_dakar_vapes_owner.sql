-- Owner unlock for Dakar Vapes / Amdy testing account
-- Run in Supabase SQL Editor.
-- This unlocks all premium/founder features for the business connected to infos@dakarvapes.com.

update businesses
set
  beta_access = true,
  beta_plan = 'founder_premium',
  founding_member = true,
  beta_expires_at = null,
  plan = 'premium'
where id in (
  select business_id
  from business_members
  where lower(email) = lower('infos@dakarvapes.com')
);

-- Optional verification
select
  b.id,
  b.name,
  b.business_type,
  b.plan,
  b.beta_access,
  b.beta_plan,
  b.founding_member,
  b.beta_expires_at,
  bm.email,
  bm.role
from businesses b
join business_members bm on bm.business_id = b.id
where lower(bm.email) = lower('infos@dakarvapes.com');
