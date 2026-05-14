alter table businesses add column if not exists slug text;
alter table businesses add column if not exists banner_url text;
alter table businesses add column if not exists whatsapp text;
alter table businesses add column if not exists address text;

create unique index if not exists businesses_slug_unique_idx on businesses(slug) where slug is not null;
create index if not exists businesses_slug_idx on businesses(slug);
