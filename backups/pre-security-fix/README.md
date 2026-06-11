# Pre-Security-Fix Backup — 2026-06-10

Rollback reference captured **before** the Supabase security + performance hardening
work on project `kmhhmuwpajwpjxivnlqa` (production caissepro.app).

## Files
- `rollback_rls_policies.sql` — all 85 `public` RLS policies exactly as they were.
- `rollback_function_grants.sql` — original EXECUTE grants (everything was `PUBLIC`-executable).

## How to roll back
If a migration breaks the app:
1. Identify the changed object (policy or function grant).
2. `DROP POLICY <name> ON public.<table>;` then re-run its original `CREATE POLICY`
   statement from `rollback_rls_policies.sql`.
3. For grants, run the matching line from `rollback_function_grants.sql`.
4. `NOTIFY pgrst, 'reload schema';`

## Baseline facts at capture time
- Build: `npm run build` passed (exit 0).
- App calls only 4 SECURITY DEFINER RPCs: `calculate_monthly_commission`,
  `add_business_member_by_email`, `update_business_member_role`, `remove_business_member`.
  All other flagged functions are legacy (employee/debt/temp-password flows use direct
  table writes, not RPC).
- `business_members` has `bm_select_all USING (true)` — the employee first-login flow
  (`app/employee-setup`) relies on anon reading `business_members` by `temp_password`.
  Do NOT tighten that without reworking that flow.
