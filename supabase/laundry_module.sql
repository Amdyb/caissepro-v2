-- Laundry & Dry Cleaning module for CaissePro

insert into business_templates (slug, name, description, icon, default_categories)
values (
  'laundry',
  'Blanchisserie & Pressing',
  'Gestion des dépôts, services, vêtements, statuts et retraits clients.',
  'shirt',
  '["Lavage","Repassage","Nettoyage à sec","Express","Livraison"]'::jsonb
)
on conflict (slug) do nothing;

create table if not exists laundry_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  category text default 'Lavage',
  price numeric default 0,
  estimated_hours integer default 24,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists laundry_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  ticket_number text not null,
  customer_name text,
  customer_phone text,
  status text default 'received',
  -- received, washing, ironing, ready, delivered, canceled
  priority text default 'normal',
  due_at timestamptz,
  total_amount numeric default 0,
  amount_paid numeric default 0,
  payment_status text default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(business_id, ticket_number)
);

create table if not exists laundry_ticket_items (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references laundry_tickets(id) on delete cascade not null,
  service_id uuid references laundry_services(id) on delete set null,
  item_name text not null,
  quantity integer default 1,
  unit_price numeric default 0,
  line_total numeric default 0,
  color text,
  condition_note text,
  stain_note text,
  created_at timestamptz default now()
);

alter table laundry_services enable row level security;
alter table laundry_tickets enable row level security;
alter table laundry_ticket_items enable row level security;

create policy if not exists "Members can manage laundry services"
on laundry_services for all
using (auth.uid() in (select user_id from business_members where business_id = laundry_services.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = laundry_services.business_id));

create policy if not exists "Members can manage laundry tickets"
on laundry_tickets for all
using (auth.uid() in (select user_id from business_members where business_id = laundry_tickets.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = laundry_tickets.business_id));

create policy if not exists "Members can read laundry ticket items"
on laundry_ticket_items for select
using (ticket_id in (select lt.id from laundry_tickets lt join business_members bm on bm.business_id = lt.business_id where bm.user_id = auth.uid()));

create policy if not exists "Members can insert laundry ticket items"
on laundry_ticket_items for insert
with check (ticket_id in (select lt.id from laundry_tickets lt join business_members bm on bm.business_id = lt.business_id where bm.user_id = auth.uid()));

create index if not exists laundry_tickets_business_status_idx on laundry_tickets(business_id, status);
create index if not exists laundry_tickets_due_idx on laundry_tickets(due_at);
create index if not exists laundry_ticket_items_ticket_idx on laundry_ticket_items(ticket_id);
