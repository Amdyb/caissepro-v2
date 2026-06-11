-- ROLLBACK REFERENCE: all public-schema RLS policies captured 2026-06-10
-- BEFORE the security/performance hardening migrations.
-- To restore a single policy: DROP POLICY <name> ON public.<table>; then run its CREATE below.
-- To restore everything: drop the modified policies and replay the relevant statements here.

CREATE POLICY agent_commissions_superadmin_all ON public.agent_commissions AS PERMISSIVE FOR ALL TO public USING (((( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text = ANY ((ARRAY['infos@dakarvapes.com'::character varying, 'azzideejay@gmail.com'::character varying])::text[])));
CREATE POLICY agent_commissions_own ON public.agent_commissions AS PERMISSIVE FOR SELECT TO public USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))));
CREATE POLICY agent_leads_superadmin_all ON public.agent_leads AS PERMISSIVE FOR ALL TO public USING (((( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text = ANY ((ARRAY['infos@dakarvapes.com'::character varying, 'azzideejay@gmail.com'::character varying])::text[])));
CREATE POLICY agent_leads_insert_any ON public.agent_leads AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY agent_leads_own ON public.agent_leads AS PERMISSIVE FOR SELECT TO public USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))));
CREATE POLICY agents_admin_delete ON public.agents AS PERMISSIVE FOR DELETE TO public USING ((auth.email() = 'infos@dakarvapes.com'::text));
CREATE POLICY agents_public_insert ON public.agents AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY agents_read_own ON public.agents AS PERMISSIVE FOR SELECT TO public USING (((email = auth.email()) OR (auth.email() = 'infos@dakarvapes.com'::text)));
CREATE POLICY agents_admin_update ON public.agents AS PERMISSIVE FOR UPDATE TO public USING ((auth.email() = 'infos@dakarvapes.com'::text));
CREATE POLICY branches_all ON public.branches AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY bm_delete_owners ON public.business_members AS PERMISSIVE FOR DELETE TO public USING (is_business_owner_or_manager(business_id));
CREATE POLICY bm_insert_owners ON public.business_members AS PERMISSIVE FOR INSERT TO public WITH CHECK (is_business_owner_or_manager(business_id));
CREATE POLICY bm_select_all ON public.business_members AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY bm_update_self_or_owner ON public.business_members AS PERMISSIVE FOR UPDATE TO public USING (((user_id = auth.uid()) OR (email = auth.email()) OR is_business_owner_or_manager(business_id) OR (auth.email() = 'infos@dakarvapes.com'::text)));
CREATE POLICY "Users can create businesses" ON public.businesses AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY businesses_insert ON public.businesses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Members can read their businesses" ON public.businesses AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = businesses.id) AND (business_members.user_id = auth.uid())))));
CREATE POLICY businesses_read ON public.businesses AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY public_business_read ON public.businesses AS PERMISSIVE FOR SELECT TO public USING ((slug IS NOT NULL));
CREATE POLICY businesses_update ON public.businesses AS PERMISSIVE FOR UPDATE TO public USING (((id = get_my_business_id()) OR (auth.email() = 'infos@dakarvapes.com'::text)));
CREATE POLICY businesses_update_policy ON public.businesses AS PERMISSIVE FOR UPDATE TO public USING ((id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY shifts_insert ON public.cash_register_shifts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY shifts_select ON public.cash_register_shifts AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY shifts_update ON public.cash_register_shifts AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY client_debts_all ON public.client_debts AS PERMISSIVE FOR ALL TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY client_debts_insert_policy ON public.client_debts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY "Members can manage customer payments" ON public.customer_payments AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id()));
CREATE POLICY customers_delete ON public.customers AS PERMISSIVE FOR DELETE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY customers_insert ON public.customers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY customers_select ON public.customers AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY customers_update ON public.customers AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY daily_reports_insert ON public.daily_reports AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY daily_reports_select ON public.daily_reports AS PERMISSIVE FOR SELECT TO public USING ((business_id = get_my_business_id()));
CREATE POLICY daily_reports_update ON public.daily_reports AS PERMISSIVE FOR UPDATE TO public USING ((business_id = get_my_business_id()));
CREATE POLICY debt_payments_all ON public.debt_payments AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY debt_reminders_all ON public.debt_reminders AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id()));
CREATE POLICY expenses_delete ON public.expenses AS PERMISSIVE FOR DELETE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY expenses_insert ON public.expenses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY expenses_select ON public.expenses AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY expenses_update ON public.expenses AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY online_orders_all ON public.online_orders AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY payment_links_all ON public.payment_links AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY "Owners can delete payment settings" ON public.payment_settings AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = payment_settings.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::text)))));
CREATE POLICY "Owners can insert payment settings" ON public.payment_settings AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = payment_settings.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::text)))));
CREATE POLICY "Members can read payment settings" ON public.payment_settings AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = payment_settings.business_id) AND (business_members.user_id = auth.uid())))));
CREATE POLICY "Owners can update payment settings" ON public.payment_settings AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = payment_settings.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::text)))));
CREATE POLICY categories_delete ON public.product_categories AS PERMISSIVE FOR DELETE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY categories_insert ON public.product_categories AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY categories_select ON public.product_categories AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY categories_update ON public.product_categories AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY products_delete ON public.products AS PERMISSIVE FOR DELETE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE ((business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['proprietaire'::text, 'manager'::text, 'owner'::text, 'admin'::text]))))));
CREATE POLICY products_delete_policy ON public.products AS PERMISSIVE FOR DELETE TO public USING ((business_id = get_my_business_id()));
CREATE POLICY products_insert ON public.products AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE ((business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['proprietaire'::text, 'manager'::text, 'owner'::text, 'admin'::text]))))));
CREATE POLICY products_select ON public.products AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY public_products_read ON public.products AS PERMISSIVE FOR SELECT TO public USING ((deleted_at IS NULL));
CREATE POLICY products_update ON public.products AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY products_update_policy ON public.products AS PERMISSIVE FOR UPDATE TO public USING ((business_id = get_my_business_id()));
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can read own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = id));
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "Members can manage purchase items" ON public.purchase_items AS PERMISSIVE FOR ALL TO public USING ((purchase_order_id IN ( SELECT purchase_orders.id
   FROM purchase_orders
  WHERE (purchase_orders.business_id = get_my_business_id()))));
CREATE POLICY purchase_orders_all ON public.purchase_orders AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY "Service role can insert referrals" ON public.referrals AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Owners can view referrals they made" ON public.referrals AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = referrals.referrer_business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::text)))));
CREATE POLICY reminders_all ON public.reminders AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY restock_orders_business_access ON public.restock_orders AS PERMISSIVE FOR ALL TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY sale_items_insert ON public.sale_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.business_id IN ( SELECT business_members.business_id
           FROM business_members
          WHERE (business_members.user_id = auth.uid()))))));
CREATE POLICY sale_items_insert_policy ON public.sale_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.business_id = get_my_business_id()))));
CREATE POLICY sale_items_select ON public.sale_items AS PERMISSIVE FOR SELECT TO public USING ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.business_id IN ( SELECT business_members.business_id
           FROM business_members
          WHERE (business_members.user_id = auth.uid()))))));
CREATE POLICY sales_insert ON public.sales AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY sales_insert_policy ON public.sales AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY sales_select ON public.sales AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY sales_update ON public.sales AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY stock_movements_insert ON public.stock_movements AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY stock_movements_select ON public.stock_movements AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY members_manage_subscriptions ON public.subscriptions AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY members_read_subscriptions ON public.subscriptions AS PERMISSIVE FOR SELECT TO public USING ((business_id = get_my_business_id()));
CREATE POLICY supplier_payments_all ON public.supplier_payments AS PERMISSIVE FOR ALL TO public USING ((business_id = get_my_business_id())) WITH CHECK ((business_id = get_my_business_id()));
CREATE POLICY suppliers_delete ON public.suppliers AS PERMISSIVE FOR DELETE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY suppliers_insert ON public.suppliers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY suppliers_select ON public.suppliers AS PERMISSIVE FOR SELECT TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY suppliers_update ON public.suppliers AS PERMISSIVE FOR UPDATE TO public USING ((business_id IN ( SELECT business_members.business_id
   FROM business_members
  WHERE (business_members.user_id = auth.uid()))));
CREATE POLICY upgrade_requests_insert ON public.upgrade_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY upgrade_requests_select ON public.upgrade_requests AS PERMISSIVE FOR SELECT TO public USING (((business_id = get_my_business_id()) OR (auth.email() = 'infos@dakarvapes.com'::text)));
CREATE POLICY upgrade_requests_update ON public.upgrade_requests AS PERMISSIVE FOR UPDATE TO public USING ((auth.email() = 'infos@dakarvapes.com'::text));
