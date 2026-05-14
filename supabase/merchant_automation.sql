-- Merchant automation foundation

create table if not exists merchant_notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text,
  status text default 'unread',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table merchant_notifications enable row level security;

create policy if not exists "Members can read merchant notifications"
on merchant_notifications for select
using (
  auth.uid() in (
    select user_id from business_members
    where business_id = merchant_notifications.business_id
  )
);

create policy if not exists "Members can manage merchant notifications"
on merchant_notifications for all
using (
  auth.uid() in (
    select user_id from business_members
    where business_id = merchant_notifications.business_id
  )
)
with check (
  auth.uid() in (
    select user_id from business_members
    where business_id = merchant_notifications.business_id
  )
);

-- Inventory intelligence view
create or replace view low_stock_products as
select
  p.id,
  p.business_id,
  p.name,
  p.category,
  p.stock,
  p.price,
  b.name as business_name
from products p
join businesses b on b.id = p.business_id
where coalesce(p.stock,0) <= 5;

-- Daily merchant analytics snapshot
create table if not exists analytics_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  snapshot_date date not null,
  total_sales numeric default 0,
  total_orders integer default 0,
  total_customers integer default 0,
  low_stock_count integer default 0,
  created_at timestamptz default now()
);

create unique index if not exists analytics_daily_unique_idx
on analytics_daily_snapshots(business_id, snapshot_date);

alter table analytics_daily_snapshots enable row level security;

create policy if not exists "Members can read analytics snapshots"
on analytics_daily_snapshots for select
using (
  auth.uid() in (
    select user_id from business_members
    where business_id = analytics_daily_snapshots.business_id
  )
);

-- Referral rewards automation foundation
create table if not exists referral_rewards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  referrer_user_id uuid,
  referred_user_id uuid,
  reward_type text,
  reward_value integer default 0,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table referral_rewards enable row level security;
