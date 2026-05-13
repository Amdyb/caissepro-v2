
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric default 0,
  note text,
  created_at timestamptz default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  created_by uuid references profiles(id),
  total numeric default 0,
  paid_amount numeric default 0,
  remaining_amount numeric default 0,
  payment_status text default 'paid',
  note text,
  created_at timestamptz default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1,
  cost_price numeric default 0,
  total numeric default 0
);

alter table purchase_orders
add column if not exists paid_amount numeric default 0;

alter table purchase_orders
add column if not exists remaining_amount numeric default 0;

alter table purchase_orders
add column if not exists payment_status text default 'paid';

alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_items enable row level security;

drop policy if exists "Members can manage suppliers" on suppliers;
drop policy if exists "Members can manage purchase orders" on purchase_orders;
drop policy if exists "Members can manage purchase items" on purchase_items;

create policy "Members can manage suppliers"
on suppliers for all
using (
  exists (
    select 1 from business_members
    where business_members.business_id = suppliers.business_id
    and business_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from business_members
    where business_members.business_id = suppliers.business_id
    and business_members.user_id = auth.uid()
  )
);

create policy "Members can manage purchase orders"
on purchase_orders for all
using (
  exists (
    select 1 from business_members
    where business_members.business_id = purchase_orders.business_id
    and business_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from business_members
    where business_members.business_id = purchase_orders.business_id
    and business_members.user_id = auth.uid()
  )
);

create policy "Members can manage purchase items"
on purchase_items for all
using (
  exists (
    select 1 from purchase_orders
    join business_members on business_members.business_id = purchase_orders.business_id
    where purchase_orders.id = purchase_items.purchase_order_id
    and business_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from purchase_orders
    join business_members on business_members.business_id = purchase_orders.business_id
    where purchase_orders.id = purchase_items.purchase_order_id
    and business_members.user_id = auth.uid()
  )
);
