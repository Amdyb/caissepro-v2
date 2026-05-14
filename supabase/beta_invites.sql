create table if not exists beta_invites (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid,
  invited_name text,
  invited_phone text,
  invited_email text,
  status text default 'active',
  -- active, used, expired, disabled
  beta_days integer default 30,
  used_by_business_id uuid references businesses(id) on delete set null,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists beta_invites_code_idx on beta_invites(code);
create index if not exists beta_invites_status_idx on beta_invites(status);
