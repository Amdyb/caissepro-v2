-- Phase 1C: tighten overly-permissive RLS policies flagged as rls_policy_always_true.

-- 1) subscriptions: members_manage_subscriptions was FOR ALL USING(true) WITH CHECK(true),
--    meaning ANY user could INSERT/UPDATE a subscription for their business (self-upgrade
--    fraud) and write any other business's row. Real subscription writes happen via the
--    superadmin console (client, gated to ADMIN_EMAILS) and the PayDunya webhook (service_role,
--    which bypasses RLS). Reads are universal today (the public storefront reads other
--    businesses' plan), so we preserve a universal SELECT and restrict writes to superadmin.
DROP POLICY IF EXISTS members_manage_subscriptions ON public.subscriptions;
DROP POLICY IF EXISTS members_read_subscriptions ON public.subscriptions;

CREATE POLICY subscriptions_select_all ON public.subscriptions
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY subscriptions_superadmin_insert ON public.subscriptions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com'::text, 'azzideejay@gmail.com'::text]));

CREATE POLICY subscriptions_superadmin_update ON public.subscriptions
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com'::text, 'azzideejay@gmail.com'::text]))
  WITH CHECK ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com'::text, 'azzideejay@gmail.com'::text]));

CREATE POLICY subscriptions_superadmin_delete ON public.subscriptions
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com'::text, 'azzideejay@gmail.com'::text]));

-- 2) businesses: "Users can create businesses" was INSERT WITH CHECK(true). It is fully
--    redundant with businesses_insert (WITH CHECK auth.uid() IS NOT NULL), which already
--    gates creation to logged-in users. Drop the always-true duplicate.
DROP POLICY IF EXISTS "Users can create businesses" ON public.businesses;

-- 3) referrals: "Service role can insert referrals" was INSERT WITH CHECK(true) for everyone
--    (service_role bypasses RLS anyway). The app inserts referrals client-side at signup AFTER
--    a session exists, so require a logged-in user instead of allowing anon.
DROP POLICY IF EXISTS "Service role can insert referrals" ON public.referrals;

CREATE POLICY referrals_insert_authenticated ON public.referrals
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
