create table if not exists payment_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  wave_enabled boolean default true,
  wave_number text,
  wave_link text,
  orange_enabled boolean default true,
  orange_number text,
  orange_link text,
  cash_enabled boolean default true,
  card_enabled boolean default false,
  bank_enabled boolean default false,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  instructions text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id)
);

create index if not exists payment_settings_business_id_idx on payment_settings(business_id);
