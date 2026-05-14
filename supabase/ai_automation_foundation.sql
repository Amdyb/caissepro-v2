create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid,
  title text default 'Assistant CaissePro',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references ai_conversations(id) on delete cascade not null,
  role text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists automation_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  type text not null,
  status text default 'pending',
  payload jsonb default '{}'::jsonb,
  run_at timestamptz default now(),
  attempts integer default 0,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists event_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  status text default 'queued',
  processed_at timestamptz,
  created_at timestamptz default now()
);

alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table automation_jobs enable row level security;
alter table event_queue enable row level security;

create index if not exists automation_jobs_run_at_idx on automation_jobs(run_at, status);
create index if not exists event_queue_status_idx on event_queue(status, created_at);
