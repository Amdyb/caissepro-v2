-- Part 6 (RLS): make "second admin + delegated manager can approve" actually work.
-- Previously agents/upgrade_requests/businesses writes were gated to infos@dakarvapes.com only,
-- and subscription writes to the two founders only — so the UI for a second admin / granted
-- manager would be silently blocked by RLS. This helper centralizes "who may approve".
CREATE OR REPLACE FUNCTION public.is_platform_approver()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
  SELECT coalesce(auth.email(), '') = ANY (ARRAY['infos@dakarvapes.com', 'azzideejay@gmail.com'])
    OR EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.user_id = auth.uid() AND bm.can_approve_subscriptions = true
    );
$function$;

-- subscriptions: founders OR granted managers may write (reads stay universal)
DROP POLICY IF EXISTS subscriptions_superadmin_insert ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_superadmin_update ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_superadmin_delete ON public.subscriptions;
CREATE POLICY subscriptions_superadmin_insert ON public.subscriptions
  AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select is_platform_approver()));
CREATE POLICY subscriptions_superadmin_update ON public.subscriptions
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((select is_platform_approver())) WITH CHECK ((select is_platform_approver()));
CREATE POLICY subscriptions_superadmin_delete ON public.subscriptions
  AS PERMISSIVE FOR DELETE TO authenticated USING ((select is_platform_approver()));

-- upgrade_requests: approvers can read all + update status
DROP POLICY IF EXISTS upgrade_requests_select ON public.upgrade_requests;
DROP POLICY IF EXISTS upgrade_requests_update ON public.upgrade_requests;
CREATE POLICY upgrade_requests_select ON public.upgrade_requests
  AS PERMISSIVE FOR SELECT TO public
  USING ((business_id = (select get_my_business_id())) OR (select is_platform_approver()));
CREATE POLICY upgrade_requests_update ON public.upgrade_requests
  AS PERMISSIVE FOR UPDATE TO public USING ((select is_platform_approver()));

-- agents: both founders (not delegated managers) may activate/suspend/reject
DROP POLICY IF EXISTS agents_admin_update ON public.agents;
DROP POLICY IF EXISTS agents_admin_delete ON public.agents;
CREATE POLICY agents_admin_update ON public.agents
  AS PERMISSIVE FOR UPDATE TO public
  USING ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com', 'azzideejay@gmail.com']));
CREATE POLICY agents_admin_delete ON public.agents
  AS PERMISSIVE FOR DELETE TO public
  USING ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com', 'azzideejay@gmail.com']));

-- businesses: both founders may manage any business (super-admin console)
DROP POLICY IF EXISTS businesses_update ON public.businesses;
CREATE POLICY businesses_update ON public.businesses
  AS PERMISSIVE FOR UPDATE TO public
  USING ((id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
      OR ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com', 'azzideejay@gmail.com'])));
