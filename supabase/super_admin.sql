-- Super Admin foundation for CaissePro

create table if not exists platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  full_name text,
  role text not null default 'support_agent',
  -- owner, admin_manager, subscription_validator, support_agent, analyst
  status text default 'active',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscription_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  submitted_by uuid,
  plan text not null,
  amount numeric default 0,
  payment_method text default 'wave',
  payment_reference text,
  proof_url text,
  status text default 'pending',
  -- pending, approved, rejected
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz default now()
);

create table if not exists platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz default now()
);

insert into platform_settings(key, value)
values
('owner_payment_methods', '{"wave_number":"","orange_number":"","bank_name":"","bank_account":"","instructions":"Payez votre abonnement puis envoyez la preuve pour validation."}'::jsonb),
('beta_settings', '{"enabled":true,"default_days":30,"founding_member_days":60}'::jsonb)
on conflict(key) do nothing;

alter table platform_admins enable row level security;
alter table subscription_payment_proofs enable row level security;
alter table platform_settings enable row level security;

create index if not exists platform_admins_user_id_idx on platform_admins(user_id);
create index if not exists platform_admins_role_idx on platform_admins(role,status);
create index if not exists subscription_payment_proofs_status_idx on subscription_payment_proofs(status, created_at);
create index if not exists subscription_payment_proofs_business_idx on subscription_payment_proofs(business_id);
