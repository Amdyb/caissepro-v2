-- Founder Beta global unlock fields

alter table businesses
add column if not exists beta_access boolean default false;

alter table businesses
add column if not exists beta_plan text default null;

alter table businesses
add column if not exists beta_expires_at timestamptz;

alter table businesses
add column if not exists founding_member boolean default false;

create index if not exists businesses_beta_access_idx
on businesses(beta_access, beta_expires_at);

-- Optional: mark active FOUNDER50 redemptions as beta businesses
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
