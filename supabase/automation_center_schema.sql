create table if not exists automation_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text,
  business_type text default 'all',
  category text default 'operations',
  trigger_event text not null,
  default_delay_minutes integer default 0,
  message_template text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists merchant_automations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  template_key text references automation_templates(key) on delete set null,
  title text not null,
  enabled boolean default false,
  channel text default 'whatsapp',
  delay_minutes integer default 0,
  message_template text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(business_id, template_key)
);

alter table automation_templates enable row level security;
alter table merchant_automations enable row level security;

create policy if not exists "Read active automation templates"
on automation_templates for select
using (auth.uid() is not null and active = true);

create policy if not exists "Members manage merchant automations"
on merchant_automations for all
using (auth.uid() in (select user_id from business_members where business_id = merchant_automations.business_id))
with check (auth.uid() in (select user_id from business_members where business_id = merchant_automations.business_id));

create index if not exists automation_templates_business_type_idx on automation_templates(business_type, active);
create index if not exists merchant_automations_business_idx on merchant_automations(business_id, enabled);
