-- Phase 2: RLS performance.
--   2A auth_rls_initplan: wrap auth.uid()/auth.email() (and get_my_business_id()) in
--      (select ...) so they evaluate once per statement instead of once per row.
--   2B multiple_permissive_policies: merge old/new duplicate policy pairs into a single
--      policy whose condition is the OR of the originals (never narrower). Where one side
--      is the strict superset of the other, the redundant policy is simply dropped.
-- All conditions are behaviour-preserving (the merged policy = union of the originals).

-- ============================ profiles ============================
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO public USING ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO public WITH CHECK ((select auth.uid()) = id);

-- ============================ products ============================
-- SELECT: merge member-scoped read + public (non-deleted) read into one policy.
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS public_products_read ON public.products;
CREATE POLICY products_select ON public.products FOR SELECT TO public
  USING ((deleted_at IS NULL)
    OR (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid()))));
-- INSERT: keep role-restricted, wrap auth.uid().
DROP POLICY IF EXISTS products_insert ON public.products;
CREATE POLICY products_insert ON public.products FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm
    WHERE bm.user_id = (select auth.uid())
      AND bm.role = ANY (ARRAY['proprietaire'::text,'manager'::text,'owner'::text,'admin'::text])));
-- UPDATE: products_update (any member) is the superset of products_update_policy (own business). Keep one.
DROP POLICY IF EXISTS products_update ON public.products;
DROP POLICY IF EXISTS products_update_policy ON public.products;
CREATE POLICY products_update ON public.products FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
-- DELETE: union of role-restricted (any of caller's businesses) OR any-role of current business.
DROP POLICY IF EXISTS products_delete ON public.products;
DROP POLICY IF EXISTS products_delete_policy ON public.products;
CREATE POLICY products_delete ON public.products FOR DELETE TO public
  USING ((business_id IN (SELECT bm.business_id FROM business_members bm
            WHERE bm.user_id = (select auth.uid())
              AND bm.role = ANY (ARRAY['proprietaire'::text,'manager'::text,'owner'::text,'admin'::text])))
      OR (business_id = (select get_my_business_id())));

-- ============================ businesses ============================
-- SELECT: businesses_read USING(true) is the superset; drop the two redundant reads.
DROP POLICY IF EXISTS "Members can read their businesses" ON public.businesses;
DROP POLICY IF EXISTS public_business_read ON public.businesses;
-- (businesses_read USING(true) kept as-is.)
-- INSERT: wrap auth.uid().
DROP POLICY IF EXISTS businesses_insert ON public.businesses;
CREATE POLICY businesses_insert ON public.businesses FOR INSERT TO public
  WITH CHECK ((select auth.uid()) IS NOT NULL);
-- UPDATE: merge the two update policies (member OR superadmin).
DROP POLICY IF EXISTS businesses_update ON public.businesses;
DROP POLICY IF EXISTS businesses_update_policy ON public.businesses;
CREATE POLICY businesses_update ON public.businesses FOR UPDATE TO public
  USING ((id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
      OR ((select auth.email()) = 'infos@dakarvapes.com'::text));

-- ============================ customers ============================
DROP POLICY IF EXISTS customers_select ON public.customers;
DROP POLICY IF EXISTS customers_insert ON public.customers;
DROP POLICY IF EXISTS customers_update ON public.customers;
DROP POLICY IF EXISTS customers_delete ON public.customers;
CREATE POLICY customers_select ON public.customers FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY customers_insert ON public.customers FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY customers_update ON public.customers FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY customers_delete ON public.customers FOR DELETE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ sales ============================
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_update ON public.sales;
DROP POLICY IF EXISTS sales_insert ON public.sales;
DROP POLICY IF EXISTS sales_insert_policy ON public.sales;
CREATE POLICY sales_select ON public.sales FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY sales_update ON public.sales FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY sales_insert ON public.sales FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ sale_items ============================
DROP POLICY IF EXISTS sale_items_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_insert ON public.sale_items;
DROP POLICY IF EXISTS sale_items_insert_policy ON public.sale_items;
CREATE POLICY sale_items_select ON public.sale_items FOR SELECT TO public
  USING (sale_id IN (SELECT s.id FROM sales s
    WHERE s.business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid()))));
CREATE POLICY sale_items_insert ON public.sale_items FOR INSERT TO public
  WITH CHECK (sale_id IN (SELECT s.id FROM sales s
    WHERE s.business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid()))));

-- ============================ expenses ============================
DROP POLICY IF EXISTS expenses_select ON public.expenses;
DROP POLICY IF EXISTS expenses_insert ON public.expenses;
DROP POLICY IF EXISTS expenses_update ON public.expenses;
DROP POLICY IF EXISTS expenses_delete ON public.expenses;
CREATE POLICY expenses_select ON public.expenses FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY expenses_insert ON public.expenses FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY expenses_update ON public.expenses FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY expenses_delete ON public.expenses FOR DELETE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ suppliers ============================
DROP POLICY IF EXISTS suppliers_select ON public.suppliers;
DROP POLICY IF EXISTS suppliers_insert ON public.suppliers;
DROP POLICY IF EXISTS suppliers_update ON public.suppliers;
DROP POLICY IF EXISTS suppliers_delete ON public.suppliers;
CREATE POLICY suppliers_select ON public.suppliers FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY suppliers_delete ON public.suppliers FOR DELETE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ product_categories ============================
DROP POLICY IF EXISTS categories_select ON public.product_categories;
DROP POLICY IF EXISTS categories_insert ON public.product_categories;
DROP POLICY IF EXISTS categories_update ON public.product_categories;
DROP POLICY IF EXISTS categories_delete ON public.product_categories;
CREATE POLICY categories_select ON public.product_categories FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY categories_insert ON public.product_categories FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY categories_update ON public.product_categories FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY categories_delete ON public.product_categories FOR DELETE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ cash_register_shifts ============================
DROP POLICY IF EXISTS shifts_select ON public.cash_register_shifts;
DROP POLICY IF EXISTS shifts_insert ON public.cash_register_shifts;
DROP POLICY IF EXISTS shifts_update ON public.cash_register_shifts;
CREATE POLICY shifts_select ON public.cash_register_shifts FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY shifts_insert ON public.cash_register_shifts FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY shifts_update ON public.cash_register_shifts FOR UPDATE TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ client_debts ============================
-- client_debts_all (ALL) already covers INSERT; drop the redundant insert-only policy.
DROP POLICY IF EXISTS client_debts_insert_policy ON public.client_debts;
DROP POLICY IF EXISTS client_debts_all ON public.client_debts;
CREATE POLICY client_debts_all ON public.client_debts FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())))
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ stock_movements ============================
DROP POLICY IF EXISTS stock_movements_select ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_insert ON public.stock_movements;
CREATE POLICY stock_movements_select ON public.stock_movements FOR SELECT TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));
CREATE POLICY stock_movements_insert ON public.stock_movements FOR INSERT TO public
  WITH CHECK (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ payment_settings ============================
DROP POLICY IF EXISTS "Members can read payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Owners can insert payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Owners can update payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Owners can delete payment settings" ON public.payment_settings;
CREATE POLICY "Members can read payment settings" ON public.payment_settings FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM business_members bm
    WHERE bm.business_id = payment_settings.business_id AND bm.user_id = (select auth.uid())));
CREATE POLICY "Owners can insert payment settings" ON public.payment_settings FOR INSERT TO public
  WITH CHECK (EXISTS (SELECT 1 FROM business_members bm
    WHERE bm.business_id = payment_settings.business_id AND bm.user_id = (select auth.uid()) AND bm.role = 'owner'::text));
CREATE POLICY "Owners can update payment settings" ON public.payment_settings FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM business_members bm
    WHERE bm.business_id = payment_settings.business_id AND bm.user_id = (select auth.uid()) AND bm.role = 'owner'::text));
CREATE POLICY "Owners can delete payment settings" ON public.payment_settings FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM business_members bm
    WHERE bm.business_id = payment_settings.business_id AND bm.user_id = (select auth.uid()) AND bm.role = 'owner'::text));

-- ============================ referrals ============================
DROP POLICY IF EXISTS "Owners can view referrals they made" ON public.referrals;
CREATE POLICY "Owners can view referrals they made" ON public.referrals FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM business_members bm
    WHERE bm.business_id = referrals.referrer_business_id AND bm.user_id = (select auth.uid()) AND bm.role = 'owner'::text));

-- ============================ restock_orders ============================
DROP POLICY IF EXISTS restock_orders_business_access ON public.restock_orders;
CREATE POLICY restock_orders_business_access ON public.restock_orders FOR ALL TO public
  USING (business_id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = (select auth.uid())));

-- ============================ upgrade_requests ============================
DROP POLICY IF EXISTS upgrade_requests_insert ON public.upgrade_requests;
DROP POLICY IF EXISTS upgrade_requests_select ON public.upgrade_requests;
DROP POLICY IF EXISTS upgrade_requests_update ON public.upgrade_requests;
CREATE POLICY upgrade_requests_insert ON public.upgrade_requests FOR INSERT TO public
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY upgrade_requests_select ON public.upgrade_requests FOR SELECT TO public
  USING ((business_id = (select get_my_business_id())) OR ((select auth.email()) = 'infos@dakarvapes.com'::text));
CREATE POLICY upgrade_requests_update ON public.upgrade_requests FOR UPDATE TO public
  USING ((select auth.email()) = 'infos@dakarvapes.com'::text);

-- ============================ agent_leads ============================
DROP POLICY IF EXISTS agent_leads_superadmin_all ON public.agent_leads;
DROP POLICY IF EXISTS agent_leads_own ON public.agent_leads;
CREATE POLICY agent_leads_superadmin_all ON public.agent_leads FOR ALL TO public
  USING ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com'::text,'azzideejay@gmail.com'::text]));
CREATE POLICY agent_leads_own ON public.agent_leads FOR SELECT TO public
  USING (agent_id IN (SELECT a.id FROM agents a WHERE a.email = (select auth.email())));

-- ============================ agent_commissions ============================
DROP POLICY IF EXISTS agent_commissions_superadmin_all ON public.agent_commissions;
DROP POLICY IF EXISTS agent_commissions_own ON public.agent_commissions;
CREATE POLICY agent_commissions_superadmin_all ON public.agent_commissions FOR ALL TO public
  USING ((select auth.email()) = ANY (ARRAY['infos@dakarvapes.com'::text,'azzideejay@gmail.com'::text]));
CREATE POLICY agent_commissions_own ON public.agent_commissions FOR SELECT TO public
  USING (agent_id IN (SELECT a.id FROM agents a WHERE a.email = (select auth.email())));

-- ============================ agents ============================
DROP POLICY IF EXISTS agents_read_own ON public.agents;
DROP POLICY IF EXISTS agents_admin_update ON public.agents;
DROP POLICY IF EXISTS agents_admin_delete ON public.agents;
CREATE POLICY agents_read_own ON public.agents FOR SELECT TO public
  USING ((email = (select auth.email())) OR ((select auth.email()) = 'infos@dakarvapes.com'::text));
CREATE POLICY agents_admin_update ON public.agents FOR UPDATE TO public
  USING ((select auth.email()) = 'infos@dakarvapes.com'::text);
CREATE POLICY agents_admin_delete ON public.agents FOR DELETE TO public
  USING ((select auth.email()) = 'infos@dakarvapes.com'::text);

-- ============================ business_members ============================
-- NOTE: never query business_members from inside its own policy (infinite recursion);
-- we only wrap the auth.* calls and keep the SECURITY DEFINER helper.
DROP POLICY IF EXISTS bm_update_self_or_owner ON public.business_members;
CREATE POLICY bm_update_self_or_owner ON public.business_members FOR UPDATE TO public
  USING ((user_id = (select auth.uid()))
      OR (email = (select auth.email()))
      OR is_business_owner_or_manager(business_id)
      OR ((select auth.email()) = 'infos@dakarvapes.com'::text));
