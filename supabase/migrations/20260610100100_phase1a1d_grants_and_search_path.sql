-- Phase 1A: lock down EXECUTE on SECURITY DEFINER functions (currently PUBLIC-executable,
-- i.e. callable by the anon role over /rest/v1/rpc/). Phase 1D: pin search_path on the
-- remaining flagged functions (the 4 in 1B already got their search_path set).
--
-- Grant strategy (verified against the codebase RPC map):
--   * trigger-only functions     -> revoke from PUBLIC, anon, authenticated (triggers don't need grants)
--   * legacy RPCs (uncalled here)-> revoke from PUBLIC, anon, authenticated (service_role retained)
--   * param-based id leakers      -> revoke from PUBLIC, anon (keep authenticated)
--   * RPCs the app actually calls  -> revoke from PUBLIC, anon (keep authenticated)
--   * get_my_business_id / is_business_owner_or_manager -> LEFT AS-IS on purpose: they are
--     referenced inside RLS policies for the `public` role, so anon/authenticated must keep
--     EXECUTE or RLS evaluation errors. They are auth.uid()-scoped (return null/false for anon),
--     so there is no data exposure.

-- ---- trigger-only: revoke everything ----
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_member_login() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_member_invite() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_refresh_daily_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_refresh_report_on_expense() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_agent_lead_on_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_agent_invite_code() FROM PUBLIC, anon, authenticated;

-- ---- legacy RPCs not called by the app (direct table writes are used instead) ----
REVOKE EXECUTE ON FUNCTION public.clear_temp_password(p_member_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_temp_password(p_member_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_temp_password(p_member_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_employee_temp_password(p_member_id uuid, p_temp_password text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_password_changed(p_user_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_employee(p_member_id uuid, p_reason text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reactivate_employee(p_member_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_debt_payment(p_debt_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_note text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_supplier_payment(p_supplier_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_reference text, p_note text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_daily_report(p_business_id uuid, p_date date) FROM PUBLIC, anon, authenticated;

-- ---- param-based id leakers: not called anywhere and not used in any policy -> revoke all app roles ----
REVOKE EXECUTE ON FUNCTION public.get_user_role(p_user_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_business_id(p_user_id uuid) FROM PUBLIC, anon, authenticated;

-- ---- RPCs the app actually calls: keep authenticated, drop anon/public ----
REVOKE EXECUTE ON FUNCTION public.add_business_member_by_email(target_business_id uuid, target_email text, target_role text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_business_member_role(target_member_id uuid, target_role text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_business_member(target_member_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_monthly_commission(p_agent_id uuid, p_month text) FROM PUBLIC, anon;

-- ---- Phase 1D: pin search_path on the remaining flagged functions ----
ALTER FUNCTION public.set_employee_temp_password(p_member_id uuid, p_temp_password text) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_password_changed(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_debt_payment(p_debt_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_note text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_supplier_payment(p_supplier_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_reference text, p_note text) SET search_path = public, pg_temp;
ALTER FUNCTION public.refresh_daily_report(p_business_id uuid, p_date date) SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_refresh_daily_report() SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_refresh_report_on_expense() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_unique_slug(base_slug text) SET search_path = public, pg_temp;
ALTER FUNCTION public.deactivate_employee(p_member_id uuid, p_reason text) SET search_path = public, pg_temp;
ALTER FUNCTION public.reactivate_employee(p_member_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_agent_invite_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_agent_lead_on_subscription() SET search_path = public, pg_temp;
