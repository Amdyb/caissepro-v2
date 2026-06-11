-- ROLLBACK REFERENCE: original EXECUTE grants on public schema functions
-- Captured 2026-06-10 BEFORE the security hardening migrations.
-- Original state: every function was executable by PUBLIC (=> anon + authenticated + service_role).
-- Run this file to fully restore the pre-fix grant state.

GRANT EXECUTE ON FUNCTION public.add_business_member_by_email(target_business_id uuid, target_email text, target_role text) TO public;
GRANT EXECUTE ON FUNCTION public.calculate_monthly_commission(p_agent_id uuid, p_month text) TO public;
GRANT EXECUTE ON FUNCTION public.clear_temp_password(p_member_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.deactivate_employee(p_member_id uuid, p_reason text) TO public;
GRANT EXECUTE ON FUNCTION public.generate_temp_password(p_member_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(base_slug text) TO public;
GRANT EXECUTE ON FUNCTION public.get_my_business_id() TO public;
GRANT EXECUTE ON FUNCTION public.get_temp_password(p_member_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.get_user_business_id(p_user_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.get_user_role(p_user_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.handle_member_login() TO public;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO public;
GRANT EXECUTE ON FUNCTION public.is_business_owner_or_manager(p_business_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.mark_password_changed(p_user_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.notify_new_member_invite() TO public;
GRANT EXECUTE ON FUNCTION public.reactivate_employee(p_member_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.record_debt_payment(p_debt_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_note text) TO public;
GRANT EXECUTE ON FUNCTION public.record_supplier_payment(p_supplier_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_reference text, p_note text) TO public;
GRANT EXECUTE ON FUNCTION public.refresh_daily_report(p_business_id uuid, p_date date) TO public;
GRANT EXECUTE ON FUNCTION public.remove_business_member(target_member_id uuid) TO public;
GRANT EXECUTE ON FUNCTION public.set_agent_invite_code() TO public;
GRANT EXECUTE ON FUNCTION public.set_employee_temp_password(p_member_id uuid, p_temp_password text) TO public;
GRANT EXECUTE ON FUNCTION public.trigger_refresh_daily_report() TO public;
GRANT EXECUTE ON FUNCTION public.trigger_refresh_report_on_expense() TO public;
GRANT EXECUTE ON FUNCTION public.update_agent_lead_on_subscription() TO public;
GRANT EXECUTE ON FUNCTION public.update_business_member_role(target_member_id uuid, target_role text) TO public;
