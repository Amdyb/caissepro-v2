-- Add paid_amount and remaining_amount to sales for partial payment tracking.
-- paid_amount: amount collected at time of sale
-- remaining_amount: balance still owed (used for "Client Doit" payment method)

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS paid_amount      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount numeric DEFAULT 0;
