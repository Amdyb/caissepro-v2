'use client'

import AppShell from '@/components/AppShell'
import PushPermissionPrompt from '@/components/PushPermissionPrompt'
import { getBusinessTemplate } from '@/lib/businessTemplates'
import { getDashboardCards } from '@/lib/dashboardCards'
import { SkeletonDashboard } from '@/components/Skeleton'
import { supabase } from '@/lib/supabaseClient'
import { getAdminContext } from '@/lib/superAdmin'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  Crown,
  DollarSign,
  Globe,
  Lightbulb,
  Lock,
  Package,
  Plus,
  Receipt,
  ReceiptText,
  RotateCcw,
  Settings,
  ShoppingBag,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  User,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { mutate } from 'swr'

const CACHE_KEY = 'caissepro_dashboard_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function writeCache(data: any) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

type Product = { id: string; name: string; stock: number | null }

type BusinessInfo = {
  id: string
  name?: string | null
  slogan?: string | null
  banner_url?: string | null
  logo_url?: string | null
  business_type?: string | null
  onboarding_completed?: boolean | null
  slug?: string | null
}

type MenuItem = {
  label: string
  href: string
  icon: any
  breadcrumb: string
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { label: 'Vendre', href: '/pos', icon: ShoppingCart, breadcrumb: 'Caisse' },
  { label: 'Historique des ventes', href: '/sales', icon: ReceiptText, breadcrumb: 'Caisse' },
  { label: 'Remboursements', href: '/refunds', icon: RotateCcw, breadcrumb: 'Caisse' },
  { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet, breadcrumb: 'Caisse' },
  { label: 'Produits', href: '/products', icon: Package, breadcrumb: 'Gestion' },
  { label: 'Clients', href: '/customers', icon: Users, breadcrumb: 'Gestion' },
  { label: 'Employes', href: '/employees', icon: UserCog, breadcrumb: 'Gestion' },
  { label: 'Fournisseurs', href: '/suppliers', icon: Truck, breadcrumb: 'Gestion' },
  { label: 'Categories', href: '/categories', icon: Tag, breadcrumb: 'Gestion' },
  { label: 'Depenses', href: '/expenses', icon: Receipt, breadcrumb: 'Rapports' },
  { label: 'Finances', href: '/finances', icon: DollarSign, breadcrumb: 'Rapports' },
  { label: 'Rapports', href: '/reports', icon: TrendingUp, breadcrumb: 'Rapports' },
  { label: 'Ma boutique en ligne', href: '/storefront', icon: Globe, breadcrumb: 'Boutique' },
  { label: 'Commandes clients', href: '/orders', icon: ShoppingBag, breadcrumb: 'Boutique' },
  { label: 'Modes de paiement', href: '/payment-methods', icon: CreditCard, breadcrumb: 'Parametres' },
  { label: 'Parametres', href: '/settings', icon: Settings, breadcrumb: 'Parametres' },
  { label: 'Profil', href: '/profile', icon: User, breadcrumb: 'Parametres' },
]

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

function getWeekStart() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export default function DashboardPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [todayTotal, setTodayTotal] = useState(0)
  const [weekTotal, setWeekTotal] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [referralCount, setReferralCount] = useState(0)
  const [rewardCount, setRewardCount] = useState(0)
  const [copyDone, setCopyDone] = useState(false)
  // Conseil du jour — one data-driven tip, cached per business per day.
  const [dailyTip, setDailyTip] = useState('')

  const {
    userId,
    businessId,
    businessType,
    business,
    plan,
    expiresAt,
    isActive,
    onboardingCompleted,
    role,
    allBusinesses,
    loading: bdLoading,
  } = useBusinessData()

  function switchBusiness(id: string) {
    localStorage.setItem('caissepro_selected_business_id', id)
    localStorage.removeItem(CACHE_KEY)
    mutate('business-data')
  }

  const loading = bdLoading || statsLoading
  const isPremium = plan === 'premium'

  // Raccourcis state
  const [shortcutSearch, setShortcutSearch] = useState('')
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([])

  // Platform-admin access (founders + invited admins) for the admin shortcut.
  const [adminAllowed, setAdminAllowed] = useState(false)
  useEffect(() => {
    let active = true
    getAdminContext().then((ctx) => {
      if (active) setAdminAllowed(!!ctx?.allowed)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    // Prefetch frequently-visited pages
    const prefetchLinks = ['/pos', '/products', '/sales']
    prefetchLinks.forEach((href) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    })
  }, [])

  // Handle redirects once business data loads
  useEffect(() => {
    if (bdLoading) return
    if (!businessId) { router.push('/login'); return }
    if (!isActive) {
      supabase.auth.signOut().then(() => router.push('/login?error=deactivated'))
      return
    }
    const STAFF_ROLES_CHECK = ['sales', 'staff', 'cashier', 'employee']
    if (!onboardingCompleted && !STAFF_ROLES_CHECK.includes(role)) {
      router.push('/onboarding')
    }
  }, [bdLoading, businessId, isActive, onboardingCompleted, role, router])

  // Fetch stats once businessId is known
  useEffect(() => {
    if (!businessId || bdLoading) return

    // Load from cache first for instant render
    const cached = readCache()
    if (cached) {
      setTodayTotal(cached.todayTotal || 0)
      setWeekTotal(cached.weekTotal || 0)
      setTotalDebt(cached.totalDebt || 0)
      setLowStockCount(cached.lowStockCount || 0)
      setReferralCount(cached.referralCount || 0)
      setRewardCount(cached.rewardCount || 0)
      setStatsLoading(false)
    }

    async function fetchStats() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekStart = getWeekStart()

      const [
        todaySalesResult,
        weekSalesResult,
        productsResult,
        debtsResult,
        referralsResult,
      ] = await Promise.all([
        supabase
          .from('sales')
          .select('total')
          .eq('business_id', businessId)
          .gte('created_at', today.toISOString()),

        supabase
          .from('sales')
          .select('total')
          .eq('business_id', businessId)
          .gte('created_at', weekStart.toISOString()),

        supabase
          .from('products')
          .select('id, name, stock')
          .eq('business_id', businessId)
          .not('archived', 'is', true)
          .not('is_active', 'is', false),

        supabase
          .from('customers')
          .select('debt_balance')
          .eq('business_id', businessId),

        supabase
          .from('referrals')
          .select('id, reward_granted')
          .eq('referrer_business_id', businessId),
      ])

      const todayAmount = (todaySalesResult.data || []).reduce(
        (sum: number, sale: any) => sum + Number(sale.total || 0), 0
      )
      const weekAmount = (weekSalesResult.data || []).reduce(
        (sum: number, sale: any) => sum + Number(sale.total || 0), 0
      )
      const debtAmount = (debtsResult.data || []).reduce(
        (sum: number, customer: any) => sum + Number(customer.debt_balance || 0), 0
      )
      const lowStock = (productsResult.data || []).filter(
        (p: any) => p.stock !== null && Number(p.stock) <= 5
      )
      const refs = referralsResult.data || []

      setTodayTotal(todayAmount)
      setWeekTotal(weekAmount)
      setTotalDebt(debtAmount)
      setLowStockCount(lowStock.length)
      setReferralCount(refs.length)
      setRewardCount(refs.filter((r: any) => r.reward_granted).length)
      setProducts((productsResult.data || []) as Product[])

      writeCache({
        todayTotal: todayAmount,
        weekTotal: weekAmount,
        totalDebt: debtAmount,
        lowStockCount: lowStock.length,
        referralCount: refs.length,
        rewardCount: refs.filter((r: any) => r.reward_granted).length,
      })

      setStatsLoading(false)
    }

    fetchStats()
  }, [businessId, bdLoading])

  // Conseil du jour: one tip per shop per day, stored in daily_tips.
  // DB hit first (no API). If none today, generate once via /api/conseiller,
  // save it, then show — so the AI is called at most once per day per shop.
  // Non-premium shops NEVER call the API: they get a generic teaser tip plus an
  // "unlock" CTA, so the Conseiller's Anthropic cost is Premium-only.
  useEffect(() => {
    if (!businessId || statsLoading) return
    let active = true

    function fallbackTip(): string {
      const tips: string[] = []
      if (totalDebt > 0) tips.push(`Vos clients vous doivent ${totalDebt.toLocaleString('fr-FR')} CFA. Relancez-les cette semaine pour renflouer votre caisse.`)
      if (lowStockCount > 0) tips.push(`${lowStockCount} produit(s) en stock bas. Réapprovisionnez avant la rupture pour ne pas perdre de ventes.`)
      if (todayTotal === 0) tips.push(`Aucune vente enregistrée aujourd'hui. Partagez votre boutique sur WhatsApp pour attirer des clients.`)
      tips.push(`Mettez en avant vos produits les plus rentables pour augmenter votre panier moyen.`)
      tips.push(`Offrez une petite remise à vos clients fidèles — ils reviendront et parleront de vous.`)
      tips.push(`Demandez à vos clients satisfaits de recommander votre boutique autour d'eux.`)
      return tips[Math.floor(Date.now() / 86400000) % tips.length]
    }

    // Non-premium: show a generic teaser, never hit the AI.
    if (!isPremium) {
      setDailyTip(fallbackTip())
      return () => { active = false }
    }

    ;(async () => {
      const today = new Date().toISOString().slice(0, 10)

      // 1. Already have today's tip in the DB? Show it, no API call.
      const { data: existing } = await supabase
        .from('daily_tips')
        .select('tip_text')
        .eq('business_id', businessId)
        .eq('tip_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!active) return
      if (existing?.tip_text) { setDailyTip(existing.tip_text); return }

      // 2. Only attempt generation once per browser per day (avoids re-calling
      //    when the AI key isn't configured yet).
      const attemptKey = `daily_tip_attempt_${businessId}_${today}`
      if (localStorage.getItem(attemptKey) === '1') { setDailyTip(fallbackTip()); return }
      localStorage.setItem(attemptKey, '1')

      // 3. Generate via the advisor, persist to daily_tips, then show.
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/conseiller', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({
            businessId,
            question: "Donne-moi UN seul conseil court (1 à 2 phrases), concret et actionnable pour ma boutique aujourd'hui. Réponds uniquement avec le conseil, sans introduction.",
          }),
        })
        const data = await res.json()
        if (!active) return
        if (res.ok && data.advice) {
          const tip = String(data.advice).trim()
          setDailyTip(tip)
          await supabase.from('daily_tips').insert({ business_id: businessId, tip_text: tip, tip_date: today })
        } else {
          setDailyTip(fallbackTip())
        }
      } catch {
        if (active) setDailyTip(fallbackTip())
      }
    })()

    return () => { active = false }
  }, [businessId, statsLoading, totalDebt, lowStockCount, todayTotal, isPremium])

  // Load pinned shortcuts from localStorage once userId is known
  useEffect(() => {
    if (!userId) return
    try {
      const stored = localStorage.getItem(`caissepro_shortcuts_${userId}`)
      if (stored) setPinnedSlugs(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [userId])

  function savePinned(slugs: string[]) {
    if (!userId) return
    setPinnedSlugs(slugs)
    localStorage.setItem(`caissepro_shortcuts_${userId}`, JSON.stringify(slugs))
  }

  function pinItem(href: string) {
    if (pinnedSlugs.includes(href)) return
    savePinned([...pinnedSlugs, href])
  }

  function unpinItem(href: string) {
    savePinned(pinnedSlugs.filter((s) => s !== href))
  }

  const template = getBusinessTemplate(businessType)
  const cards = getDashboardCards(businessType)

  if (loading) {
    return (
      <AppShell title="Tableau de bord">
        <SkeletonDashboard />
      </AppShell>
    )
  }

  const actionHref = '/pos'

  const referralUrl = `https://caissepro.app/register?ref=${business?.slug || ''}`

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  function handleWhatsApp() {
    const text = `Rejoignez CaissePro et gerez votre commerce facilement ! Utilisez mon lien : ${referralUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const filteredMenuItems = shortcutSearch.trim()
    ? ALL_MENU_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
        item.breadcrumb.toLowerCase().includes(shortcutSearch.toLowerCase())
      )
    : []

  const pinnedItems = ALL_MENU_ITEMS.filter((item) => pinnedSlugs.includes(item.href))

  return (
    <AppShell title="Tableau de bord" subtitle={business?.name ? `Bienvenue sur ${business.name}` : "Vue d'ensemble de votre activite"}>
      <PushPermissionPrompt businessId={businessId} />
      {message && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {message}
        </div>
      )}

      {/* 1. Welcome header — hero banner, flush edge to edge */}
      <section className="-mx-5 -mt-8 relative overflow-hidden bg-slate-950">
        {business?.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${business.banner_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />

        <div className="relative flex flex-col gap-5 px-5 py-8 md:px-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-white backdrop-blur-xl">
              <Sparkles size={13} /> Dashboard Premium
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white shadow-2xl">
                {business?.logo_url ? (
                  <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Store size={34} className="text-slate-400" />
                )}
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                  {business?.name || template.dashboardTitle}
                </h1>

                <p className="mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-white/70 md:text-base">
                  {business?.slogan || 'Pilotez votre activite avec une vue claire sur vos ventes, votre stock et vos performances.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-wide text-white/60">Plan actuel</p>
              <p className="mt-1 text-base font-black uppercase">{plan}</p>
            </div>

            <Link href={actionHref} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-600">
              Action rapide
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px]">
        {/* Business switcher — shown only when user manages multiple businesses */}
        {allBusinesses.length > 1 && (
          <div className="mt-4 flex items-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Store size={18} className="shrink-0 text-emerald-600" />
            <p className="text-sm font-black text-slate-700 dark:text-slate-200 shrink-0">Boutique active :</p>
            <select
              value={businessId || ''}
              onChange={(e) => switchBusiness(e.target.value)}
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-950 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              {allBusinesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Multi-shop: create a new business (Premium feature) */}
        <div className="mt-4">
          {plan === 'premium' ? (
            <a
              href="/create-business"
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <Plus size={18} /> Créer une nouvelle boutique
            </a>
          ) : (
            <a
              href="/upgrade"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-400 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
              <Lock size={16} /> Créer une nouvelle boutique — Premium requis
            </a>
          )}
        </div>

        {/* Platform-admin shortcut — founders & invited admins only */}
        {adminAllowed && (
          <Link
            href="/super-admin"
            className="mt-4 flex items-center justify-between gap-3 rounded-[2rem] border border-slate-800 bg-slate-950 px-5 py-4 text-white shadow-sm transition hover:bg-slate-800"
          >
            <span className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              <span className="text-sm font-black">Accéder à l&apos;administration</span>
            </span>
            <ArrowRight size={18} className="text-emerald-400" />
          </Link>
        )}

        {/* 2. Subscription status card */}
        {(() => {
          const isPaid = plan && plan !== 'free'
          const days = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000) : null
          const color = !isPaid ? 'neutral' : days !== null && days > 30 ? 'green' : days !== null && days > 0 ? 'amber' : 'red'
          const bg = { neutral: 'bg-slate-50 border-slate-200', green: 'bg-emerald-50 border-emerald-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' }
          const txt = { neutral: 'text-slate-600', green: 'text-emerald-700', amber: 'text-amber-700', red: 'text-red-700' }
          const sub = { neutral: 'text-slate-400', green: 'text-emerald-500', amber: 'text-amber-500', red: 'text-red-500' }
          return (
            <div className={`mt-4 flex items-center justify-between rounded-[2rem] border p-4 shadow-sm ${bg[color]}`}>
              <div className="flex items-center gap-3">
                <CreditCard className={txt[color]} size={20} />
                <div>
                  <p className={`text-sm font-black uppercase tracking-wide ${txt[color]}`}>Plan {isPaid ? plan : 'Gratuit'}</p>
                  {isPaid && days !== null && (
                    <p className={`text-xs font-bold ${sub[color]}`}>{days > 0 ? `${days} jours restants` : 'Abonnement expire'}</p>
                  )}
                  {!isPaid && <p className={`text-xs font-bold ${sub[color]}`}>Passez a un plan payant pour debloquer toutes les fonctionnalites</p>}
                </div>
              </div>
              <Link href="/upgrade" className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
                {isPaid ? 'Renouveler' : 'Upgrader'}
              </Link>
            </div>
          )
        })()}

        {/* 3. Today's sales / key stats & performance */}
        <div id="tour-stats" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/sales" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Ventes aujourd'hui</p>
                <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{cfa(todayTotal)}</p>
              </div>
              <CalendarDays className="text-emerald-600" size={24} />
            </div>
          </Link>

          <Link href="/sales" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Performance semaine</p>
                <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{cfa(weekTotal)}</p>
              </div>
              <Sparkles className="text-emerald-600" size={24} />
            </div>
          </Link>

          <Link href="/products" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Stock critique</p>
                <p className="mt-2 text-3xl font-black text-amber-600">{lowStockCount}</p>
              </div>
              <Bell className="text-amber-500" size={24} />
            </div>
          </Link>

          <Link href="/debts" className="rounded-[2rem] border border-red-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-red-900 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Paiements a recuperer</p>
                <p className="mt-2 text-3xl font-black text-red-600">{cfa(totalDebt)}</p>
              </div>
              <CreditCard className="text-red-500" size={24} />
            </div>
          </Link>
        </div>

        {/* 4. Quick actions / raccourcis */}
        <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Raccourcis</p>

          <input
            type="text"
            placeholder="Rechercher une fonctionnalite..."
            value={shortcutSearch}
            onChange={(e) => setShortcutSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
          />

          {filteredMenuItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isPinned = pinnedSlugs.includes(item.href)
                return (
                  <li
                    key={item.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="shrink-0 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{item.breadcrumb}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => (isPinned ? unpinItem(item.href) : pinItem(item.href))}
                      className={`rounded-xl p-1.5 transition ${isPinned ? 'bg-emerald-100 text-emerald-600 hover:bg-red-100 hover:text-red-600 dark:bg-emerald-900/40' : 'bg-slate-200 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-600'}`}
                    >
                      {isPinned ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {pinnedItems.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
              {pinnedItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.href}
                    className="relative flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700"
                  >
                    <button
                      onClick={() => unpinItem(item.href)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-slate-200 p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-600 dark:bg-slate-600"
                    >
                      <X size={10} />
                    </button>
                    <Link href={item.href} className="flex flex-col items-center gap-2 pt-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        <Icon size={18} />
                      </div>
                      <span className="text-center text-[10px] font-bold leading-tight text-slate-700 dark:text-slate-200">{item.label}</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {pinnedItems.length === 0 && !shortcutSearch && (
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">Ajoute la liste de tes outils favoris.</p>
          )}
        </div>

        {/* 6. Conseil du jour — data-driven daily tip + entry to the advisor */}
        {dailyTip && (
          <div className="mt-4 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-900/20 dark:to-slate-800">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Lightbulb size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Conseil du jour
                  {!isPremium && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white"><Crown size={9} /> Premium</span>
                  )}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{dailyTip}</p>
                {isPremium ? (
                  <Link href="/conseiller" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700">
                    Voir plus de conseils <ArrowRight size={14} />
                  </Link>
                ) : (
                  <Link href="/upgrade" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-600">
                    <Crown size={13} /> Débloquez votre conseiller
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. Parrainage — secondary option, kept at the very bottom */}
        <div className="mt-4 rounded-[2rem] border border-violet-200 bg-violet-50 p-5 shadow-sm dark:border-violet-800 dark:bg-violet-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-violet-700 dark:text-violet-400">Parrainage</p>
              <p className="mt-0.5 text-xs font-bold text-violet-500 dark:text-violet-500">
                {referralCount} filleul{referralCount !== 1 ? 's' : ''} &bull; {rewardCount} mois offert{rewardCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-row gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-black text-white shadow-lg shadow-green-500/20 transition hover:bg-green-600"
            >
              Partager sur WhatsApp
            </button>
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-violet-300 bg-transparent py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20"
            >
              {copyDone ? <Check size={14} /> : null}
              {copyDone ? 'Lien copié !' : 'Copier le lien'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
