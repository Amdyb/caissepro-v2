-- Feature: short product description.
-- Optional short marketing blurb (~200 chars) shown on the public storefront
-- product cards (/shop/[slug]). Not used in the POS sell screen.
alter table products add column if not exists short_description text;

comment on column products.short_description is
  'Optional short marketing blurb (~200 chars) shown on public storefront product cards. Not used in POS.';

notify pgrst, 'reload schema';
