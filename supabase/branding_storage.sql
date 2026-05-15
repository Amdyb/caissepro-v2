-- Branding storage setup for CaissePro
-- Run this in Supabase SQL Editor if the business-assets bucket does not already exist.

insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

create policy if not exists "Authenticated users can upload business assets"
on storage.objects for insert
with check (
  bucket_id = 'business-assets'
  and auth.uid() is not null
);

create policy if not exists "Anyone can view business assets"
on storage.objects for select
using (bucket_id = 'business-assets');

create policy if not exists "Authenticated users can update own business assets"
on storage.objects for update
using (
  bucket_id = 'business-assets'
  and auth.uid() is not null
)
with check (
  bucket_id = 'business-assets'
  and auth.uid() is not null
);

create policy if not exists "Authenticated users can delete own business assets"
on storage.objects for delete
using (
  bucket_id = 'business-assets'
  and auth.uid() is not null
);
