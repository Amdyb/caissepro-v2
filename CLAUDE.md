# CaissePro — Claude Code Instructions

## Project Overview
CaissePro is a multi-tenant SaaS POS (Point of Sale) platform for West African merchants.
- Live at: https://caissepro.app
- GitHub: https://github.com/Amdyb/caissepro-v2
- Owner: Amdy Boubacar (AmdyLabs) — NOT a developer, gives directions only

## Tech Stack
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS v3
- **Database:** Supabase (PostgreSQL + RLS + Storage)
- **Auth:** Supabase Auth
- **Icons:** Lucide React ONLY — never use emojis
- **Hosting:** Vercel (auto-deploy from GitHub main)
- **Payments:** PayDunya (Wave, Orange Money, Carte Bancaire)
- **Messaging:** Twilio WhatsApp Business API
- **Email:** Resend
- **Charts:** Recharts
- **QR Scanning:** html5-qrcode

## Supabase
- Project URL: https://qxcpaxpttyzlqscwgigv.supabase.co
- Key tables: profiles, businesses, business_members, subscriptions, products, sales, sale_items, customers, employees, suppliers, categories, expenses, orders, tickets, refunds, register_shifts, upgrade_requests, agents, agent_leads, agent_commissions, referrals, payment_links, debts

## Design System — NEVER BREAK THESE RULES
- **Background:** white / slate-50 (light mode), slate-900 (dark mode)
- **Primary color:** emerald-600 (#059669)
- **Rounded corners:** `rounded-[2rem]` for cards, `rounded-2xl` for items, `rounded-full` for buttons/chips
- **Font weight:** `font-black` for all headings and labels (Tailwind's 900 weight)
- **Card style:** `rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800`
- **Primary button:** `bg-emerald-600 text-white font-black rounded-2xl px-5 py-3 hover:bg-emerald-700`
- **NO emojis anywhere** — use Lucide React icons only
- Dark mode always supported via DarkModeProvider

## Architecture
- `app/` — Next.js App Router pages
- `components/` — Shared UI components (AppShell is the main layout wrapper)
- `lib/` — Utilities (supabase, whatsapp, plans, i18n, etc.)
- `public/` — Static assets (caissepro-logo.png, sw.js, offline.html)

## AppShell
Every authenticated page uses `<AppShell title="..." subtitle="...">`. It:
- Handles auth + role loading from Supabase
- Renders sidebar navigation by business type
- Shows bottom nav on mobile
- Supports dark mode

## Business Types Supported
retail, restaurant, beauty, pharmacy, garage, btp, tontine, rental, wholesale, laundry

Each has custom navigation sections defined in `components/AppShell.tsx`.

## Roles
- **owner** — full access
- **manager/admin** — most features except security zone
- **sales/cashier/staff/employee** — POS only

## Plans
- free (default), starter, business, premium
- Feature gating via `lib/featureLimits.ts` and `lockedPlan` on nav items

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
PAYDUNYA_MASTER_KEY=
PAYDUNYA_PRIVATE_KEY=
PAYDUNYA_TOKEN=
PAYDUNYA_MODE=
RESEND_API_KEY=
```

## Super Admin
Hardcoded founder emails: `infos@dakarvapes.com`, `azzideejay@gmail.com`
Super admin routes: `/super-admin`, `/super-admin/agents`, `/super-admin/businesses`, `/super-admin/analytics`, `/super-admin/health`

## Agent Program
- Agents recruit merchants via invite code
- 50,000 XOF/month commission at 20 paid signups
- Admin WhatsApp: +221784581111
- Agent status flow: pending → active → (suspended)

## Pages Built
All routes under `app/` — see directory listing. Key pages:
- `/dashboard` — Main hub with stats, shortcuts, referrals
- `/pos` — Point of sale
- `/sales`, `/refunds`, `/register-shifts` — Sales management
- `/products`, `/categories`, `/suppliers` — Inventory
- `/customers`, `/employees` — CRM / HR
- `/storefront`, `/storefront/qr`, `/storefront/share` — Online store
- `/orders` — Online orders
- `/reports`, `/finances`, `/expenses` — Analytics
- `/upgrade`, `/subscription`, `/payment-methods` — Billing
- `/settings`, `/profile`, `/language`, `/legal`, `/help` — Account
- `/agents` — Agent recruitment (public)
- `/super-admin/*` — Admin panel

## "Coming Soon" Pages (placeholder)
/appointments, /prescriptions, /services, /projects, /active-orders, /contracts
These show "Fonctionnalité disponible bientôt" with Clock icon and back button.

## Coding Conventions
- All components are `'use client'` unless explicitly server-side
- Use `font-black` (900) for all headings, labels, and button text
- Cards always use `rounded-[2rem]` with `border border-slate-200 shadow-sm`
- Loading states: use `<SkeletonDashboard />`, `<SkeletonGrid />`, `<SkeletonRow />` from `@/components/Skeleton`
- Supabase client: `@/lib/supabaseClient` (authenticated), `@/lib/supabasePublic` (unauthenticated)
- WhatsApp notifications: POST to `/api/whatsapp/send` with `{ to, body }`
- Error handling: always show user-facing error with `code` and message

## Running Locally
```bash
npm install
npm run dev
# App runs at http://localhost:3000
```

## Git Workflow
- Remote: https://github.com/Amdyb/caissepro-v2.git
- Branch: main
- Vercel auto-deploys on push to main
- Always commit with clear messages, push after each working feature

## Performance Notes
- Dashboard uses localStorage cache (5min TTL) via `readCache()`/`writeCache()`
- Dashboard queries use `Promise.all` for parallel fetching
- AppShell is wrapped with `React.memo`
- `next.config.js` has `optimizePackageImports: ['lucide-react']` and `compress: true`
- SWR installed for future data fetching optimization

## Database / RLS Conventions (MANDATORY — added 2026-06-10 security+perf hardening)
When writing any new RLS policy or SECURITY DEFINER function, follow these rules. Breaking
them re-introduces the exact advisor findings we just cleared.
- **Wrap auth calls in a subselect** so they evaluate once per statement, not once per row:
  use `(select auth.uid())`, `(select auth.email())`, `(select get_my_business_id())` —
  never bare `auth.uid()` / `auth.email()` inside `USING`/`WITH CHECK`.
- **One policy per (table, action, role).** Do not add a second permissive policy for the
  same action; fold the extra condition into the existing policy with `OR`.
- **Business scoping pattern:** `business_id IN (SELECT bm.business_id FROM business_members
  bm WHERE bm.user_id = (select auth.uid()))` (multi-boutique safe). Single-business helper
  `business_id = (select get_my_business_id())` is also fine for newer tables.
- **Never query `business_members` from inside a `business_members` policy** (infinite
  recursion) — use the SECURITY DEFINER helpers `get_my_business_id()`,
  `is_business_owner_or_manager()` instead.
- **Every new table with RLS enabled MUST get a policy** in the same migration, or it is
  fully locked.
- **SECURITY DEFINER functions:** always `SET search_path = public, pg_temp`; `REVOKE
  EXECUTE ... FROM PUBLIC, anon` (keep `authenticated` only if the app actually calls it;
  trigger-only functions revoke from authenticated too); and add an internal authorization
  guard (e.g. `is_business_owner_or_manager(...)`) since the function bypasses RLS.
- **Rollback reference:** `backups/pre-security-fix/`. **Unused-index review:**
  `docs/unused-indexes.md`. After any migration run `NOTIFY pgrst, 'reload schema';`.
- **Manual (Supabase dashboard, cannot be done in SQL):** enable Auth → Policies → "Leaked
  password protection". `pg_net` is intentionally left in the public schema (a DB function
  depends on it; moving it risks breakage).

## Current Pending Items
- /appointments — full calendar/booking system
- /prescriptions — pharmacy prescription management
- /services — garage intervention tracking
- /projects — BTP chantier management
- /active-orders — laundry order tracking
- /contracts — real estate rental contracts
- Mobile app (React Native / PWA enhancement)
- Google Analytics / AdSense (Phase 5)
