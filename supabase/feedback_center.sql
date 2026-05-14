-- Merchant Feedback Center for CaissePro beta

create table if not exists merchant_feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid,
  type text default 'feedback',
  -- feedback, bug, feature_request, support, praise
  priority text default 'normal',
  -- low, normal, high, urgent
  status text default 'new',
  -- new, reviewing, planned, resolved, closed
  title text not null,
  message text not null,
  page_url text,
  screenshot_url text,
  user_agent text,
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table merchant_feedback enable row level security;

create policy if not exists "Members can create feedback"
on merchant_feedback for insert
with check (
  auth.uid() is not null
);

create policy if not exists "Members can read own business feedback"
on merchant_feedback for select
using (
  business_id is null
  or auth.uid() in (
    select user_id from business_members
    where business_id = merchant_feedback.business_id
  )
);

create policy if not exists "Platform admins can read all feedback"
on merchant_feedback for select
using (
  auth.uid() in (
    select user_id from platform_admins
    where status = 'active'
  )
);

create policy if not exists "Platform admins can update feedback"
on merchant_feedback for update
using (
  auth.uid() in (
    select user_id from platform_admins
    where status = 'active'
  )
);

create index if not exists merchant_feedback_business_idx on merchant_feedback(business_id, created_at desc);
create index if not exists merchant_feedback_status_idx on merchant_feedback(status, priority, created_at desc);
