-- Phase 4 (cont.): customer_profiles + customer_transactions were unreferenced and empty.
-- Per owner decision: keep the tables and add the standard business-scoped policies
-- (instead of dropping), so they're protected + advisor-clean and ready for a future
-- loyalty feature.
CREATE POLICY customer_profiles_business_access ON public.customer_profiles
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

CREATE POLICY customer_transactions_business_access ON public.customer_transactions
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
