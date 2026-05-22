-- Add snapshot columns to sale_items so receipts remain accurate
-- even after a product is edited or deleted.
-- All columns are nullable so existing rows are unaffected.

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS product_name  text,
  ADD COLUMN IF NOT EXISTS product_image text,
  ADD COLUMN IF NOT EXISTS unit_price    numeric;
