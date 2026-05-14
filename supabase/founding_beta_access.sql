-- Limited Founding Beta access system

create table if not exists beta_access_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  status text default 'active',
  max_users integer default 50,
  current_users integer default 0,
  beta_days integer default 60,
  plan text default 'premium',
  created_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists beta_access_redemptions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references beta_access_campaigns(id) on delete cascade not null,
  user_id uuid not null,
  business_id uuid references businesses(id) on delete cascade,
  redeemed_at timestamptz default now(),
  unique(campaign_id, user_id)
);

insert into beta_access_campaigns (code, name, max_users, beta_days, plan)
values ('FOUNDER50', 'Founding Beta 50', 50, 60, 'premium')
on conflict(code) do nothing;

alter table beta_access_campaigns enable row level security;
alter table beta_access_redemptions enable row level security;

create index if not exists beta_access_campaigns_code_idx on beta_access_campaigns(code,status);
create index if not exists beta_access_redemptions_user_idx on beta_access_redemptions(user_id);
