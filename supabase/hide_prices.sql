-- Feature: hide prices storefront-wide.
-- When true, the public storefront /shop/[slug] replaces every price with
-- "Prix sur demande" and shows a WhatsApp contact CTA. Display-only: POS,
-- checkout totals, reporting and stock are unaffected. Online ordering still
-- works (customer orders without a visible price; merchant quotes on WhatsApp).
alter table businesses add column if not exists hide_prices boolean not null default false;

comment on column businesses.hide_prices is
  'When true, the public storefront hides price numbers (shows "Prix sur demande") and surfaces a WhatsApp contact CTA. Display-only; POS/totals/reporting/stock unaffected.';

notify pgrst, 'reload schema';
