-- CaissePro Trust Infrastructure
-- Audit logs + backup tracking foundation

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists business_backups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  backup_type text default 'automatic',
  storage_path text,
  file_size bigint,
  status text default 'completed',
  created_by uuid,
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;
alter table business_backups enable row level security;

create policy if not exists "Members can read audit logs"
on audit_logs for select
using (
  auth.uid() in (
    select user_id from business_members
    where business_id = audit_logs.business_id
  )
);

create policy if not exists "Members can read backups"
on business_backups for select
using (
  auth.uid() in (
    select user_id from business_members
    where business_id = business_backups.business_id
  )
);

create index if not exists audit_logs_business_idx
on audit_logs(business_id, created_at desc);

create index if not exists audit_logs_entity_idx
on audit_logs(entity_type, entity_id);

create index if not exists business_backups_business_idx
on business_backups(business_id, created_at desc);
