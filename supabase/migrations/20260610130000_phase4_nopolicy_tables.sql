-- Phase 4: add policies to RLS-enabled tables that had none (so they were fully locked).
-- All have business_id and 0 rows today. plan_limits is global config read by the app.
-- The real-estate (properties/tenants/rent_payments) and tontine_* modules were inaccessible
-- (RLS on, no policy); these business-scoped policies enable them. Conditions match the
-- multi-business pattern used elsewhere and are initplan-optimized.

-- global plan config: world-readable, no client writes (managed via migrations/admin)
CREATE POLICY plan_limits_read ON public.plan_limits
  AS PERMISSIVE FOR SELECT TO public USING (true);

-- real-estate module
CREATE POLICY properties_business_access ON public.properties
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

CREATE POLICY tenants_business_access ON public.tenants
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

CREATE POLICY rent_payments_business_access ON public.rent_payments
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- tontine module
CREATE POLICY tontine_groups_business_access ON public.tontine_groups
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

CREATE POLICY tontine_participants_business_access ON public.tontine_participants
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

CREATE POLICY tontine_contributions_business_access ON public.tontine_contributions
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

CREATE POLICY tontine_winners_business_access ON public.tontine_winners
  AS PERMISSIVE FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
