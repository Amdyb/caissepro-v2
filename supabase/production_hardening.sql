-- Production hardening foundation for CaissePro

-- Enable RLS on common business tables
alter table if exists businesses enable row level security;
alter table if exists business_members enable row level security;
alter table if exists products enable row level security;
alter table if exists customers enable row level security;
alter table if exists sales enable row level security;
alter table if exists payment_settings enable row level security;

-- Public storefront read access
create policy if not exists "Public can read published businesses"
on businesses for select
using (online_store_enabled = true or auth.uid() in (
  select user_id from business_members where business_id = businesses.id
));

create policy if not exists "Members can manage their businesses"
on businesses for update
using (auth.uid() in (select user_id from business_members where business_id = businesses.id));

create policy if not exists "Members can read memberships"
on business_members for select
using (auth.uid() = user_id or auth.uid() in (
  select user_id from business_members bm where bm.business_id = business_members.business_id
));

create policy if not exists "Members can read products"
on products for select
using (auth.uid() in (select user_id from business_members where business_id = products.business_id));

create policy if not exists "Public can read storefront products"
on products for select
using (business_id in (select id from businesses where online_store_enabled = true));

create policy if not exists "Members can manage products"
on products for all
using (auth.uid() in (select user_id from business_members where business_id = products.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = products.business_id));

create policy if not exists "Members can manage customers"
on customers for all
using (auth.uid() in (select user_id from business_members where business_id = customers.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = customers.business_id));

create policy if not exists "Members can manage sales"
on sales for all
using (auth.uid() in (select user_id from business_members where business_id = sales.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = sales.business_id));

create policy if not exists "Members can manage payment settings"
on payment_settings for all
using (auth.uid() in (select user_id from business_members where business_id = payment_settings.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = payment_settings.business_id));

-- Public order table for storefront checkout requests
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_name text,
  customer_phone text,
  customer_address text,
  payment_method text default 'wave',
  payment_status text default 'pending',
  status text default 'new',
  total numeric default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer default 1,
  unit_price numeric default 0,
  line_total numeric default 0,
  created_at timestamp with time zone default now()
);

alter table orders enable row level security;
alter table order_items enable row level security;

create policy if not exists "Public can create storefront orders"
on orders for insert
with check (business_id in (select id from businesses where online_store_enabled = true));

create policy if not exists "Members can manage orders"
on orders for all
using (auth.uid() in (select user_id from business_members where business_id = orders.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = orders.business_id));

create policy if not exists "Public can create order items"
on order_items for insert
with check (order_id in (select id from orders));

create policy if not exists "Members can read order items"
on order_items for select
using (order_id in (select orders.id from orders join business_members on business_members.business_id = orders.business_id where business_members.user_id = auth.uid()));

create index if not exists orders_business_id_idx on orders(business_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- Error logging
create table if not exists app_error_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  user_id uuid,
  source text,
  message text,
  details jsonb,
  created_at timestamp with time zone default now()
);

alter table app_error_logs enable row level security;
create policy if not exists "Members can read own business errors"
on app_error_logs for select
using (business_id is null or auth.uid() in (select user_id from business_members where business_id = app_error_logs.business_id));

create policy if not exists "Authenticated users can log errors"
on app_error_logs for insert
with check (auth.uid() is not null);
