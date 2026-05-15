-- Client Doit / customer debt support

create table if not exists customer_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  amount numeric default 0,
  note text,
  created_at timestamptz default now()
);

alter table customer_payments enable row level security;

create policy if not exists "Members can manage customer payments"
on customer_payments for all
using (
  auth.uid() in (
    select user_id from business_members
    where business_id = customer_payments.business_id
  )
)
with check (
  auth.uid() in (
    select user_id from business_members
    where business_id = customer_payments.business_id
  )
);

alter table customers add column if not exists debt_balance numeric default 0;
alter table customers add column if not exists total_spent numeric default 0;
alter table customers add column if not exists points integer default 0;

create index if not exists customer_payments_business_idx on customer_payments(business_id, created_at desc);
create index if not exists customers_debt_idx on customers(business_id, debt_balance desc);
