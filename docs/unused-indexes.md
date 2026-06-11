# Unused indexes — review later (do NOT drop yet)

The Supabase performance advisor flagged these 28 indexes as "unused" on 2026-06-10.
The app/database is young, so "unused" almost certainly means "no traffic has needed them
yet" rather than "useless" — most are `business_id`/`status`/lookup indexes that WILL be
used as data grows. Dropping them now gains almost nothing (tiny write overhead) and risks
slowing future queries.

**Action:** revisit in ~1-2 months. Re-run the performance advisor; only drop an index that
is *still* reported unused AND whose column is not used in any WHERE/JOIN/ORDER BY of a hot
query path. Verify against `pg_stat_user_indexes.idx_scan` before dropping.

| Table | Index |
|-------|-------|
| debt_reminders | idx_debt_reminders_debt_id |
| debt_reminders | idx_debt_reminders_scheduled |
| daily_reports | idx_daily_reports_business_date |
| business_members | idx_business_members_business_id |
| products | idx_products_barcode |
| purchase_orders | idx_purchase_orders_supplier_id |
| purchase_items | idx_purchase_items_order_id |
| branches | idx_branches_business_id |
| customers | idx_customers_phone |
| expenses | idx_expenses_business_id |
| expenses | idx_expenses_business_date |
| cash_register_shifts | idx_cash_shifts_business_id |
| cash_register_shifts | idx_cash_shifts_status |
| subscriptions | idx_subscriptions_business_id |
| suppliers | idx_suppliers_business_id |
| purchase_orders | idx_purchase_orders_business_id |
| product_categories | idx_product_categories_business_id |
| online_orders | idx_online_orders_business_id |
| tontine_participants | idx_tontine_participants_group_id |
| tontine_contributions | idx_tontine_contributions_group_id |
| client_debts | idx_client_debts_business_id |
| client_debts | idx_client_debts_customer_id |
| debt_payments | idx_debt_payments_debt_id |
| client_debts | idx_client_debts_sale_id |
| client_debts | idx_client_debts_status |
| debt_payments | idx_debt_payments_customer_id |
| agent_leads | idx_agent_leads_agent_id |
| agent_commissions | idx_agent_commissions_agent_id |
