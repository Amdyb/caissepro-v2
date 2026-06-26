'use client'

import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import TutorialTour from '@/components/TutorialTour'
import DarkModeToggle from '@/components/DarkModeToggle'
import NotificationBell from '@/components/NotificationBell'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NetworkStatusBanner from '@/components/NetworkStatusBanner'
import SoundManager from '@/components/SoundManager'
import { supabase } from '@/lib/supabaseClient'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import { usePlatformSettings } from '@/lib/usePlatformSettings'
import { mutate as globalMutate } from 'swr'
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Plus,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  HandCoins,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  PackagePlus,
  Database,
  Eye,
  QrCode,
  Receipt,
  ReceiptText,
  RotateCcw,
  Settings,
  Share2,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  User,
  UserCog,
  Users,
  Wallet,
  Calendar,
  Droplets,
  HardHat,
  Lock,
  Megaphone,
  Wrench,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, memo, useEffect, useState } from 'react'

type AppShellProps = { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }

type SectionConfig = {
  key: string
  title: string
  borderColor: string
  bgColor: string
  textColor: string
  headerColor: string
  defaultOpen?: boolean
  items: { label: string; href: string; icon: any; tourId?: string; lockedPlan?: string; readOnly?: boolean }[]
}

const PLAN_LEVELS: Record<string, number> = { free: 0, starter: 1, business: 2, premium: 3 }

// Essentials shown by default (collapsed menu), in display order. Filtered against
// the role's actual items, so staff/managers only get the ones they can reach.
const ESSENTIAL_HREFS = ['/pos', '/products', '/register-shifts', '/storefront']

// Includes both the French ('caissier') and English ('cashier') cashier values
// so the POS-focused staff nav + route guard apply regardless of which was stored.
const STAFF_ROLES = ['sales', 'staff', 'employee', 'cashier', 'caissier']
const MANAGER_ROLES = ['manager', 'admin', 'owner']

const STAFF_ALLOWED_PATHS = [
  '/pos', '/checkout',
  '/register-shifts', '/profile', '/change-password', '/expenses',
  '/upgrade', '/pricing',
]

const MANAGER_ALLOWED_PATHS = [
  '/dashboard', '/pos', '/checkout',
  '/products', '/sales', '/refunds', '/register-shifts',
  '/customers', '/expenses', '/reports', '/finances', '/coach', '/conseiller',
  '/orders', '/debts', '/payment-links', '/purchases',
  '/stock-movements', '/activity',
  '/settings', '/payment-methods', '/employees', '/staff',
  '/storefront', '/orders', '/categories', '/suppliers',
  '/reminders', '/automation',
  '/profile', '/change-password', '/help', '/feedback', '/legal',
  '/upgrade', '/pricing',
]

// Narrowed list for the pure "manager" role (admins keep MANAGER_ALLOWED_PATHS).
// No /categories, /suppliers, /coach, /conseiller, /backup. Product create/edit
// routes are blocked separately (view-only) even though /products is allowed.
const MANAGER_ONLY_ALLOWED_PATHS = [
  '/dashboard', '/pos', '/checkout',
  '/products', '/sales', '/refunds', '/register-shifts',
  '/customers', '/debts', '/expenses',
  '/reports', '/finances',
  '/storefront', '/orders', '/payment-links',
  '/employees',
  '/profile', '/change-password', '/settings', '/payment-methods',
  '/help', '/feedback', '/legal', '/language',
  '/upgrade', '/pricing',
]

const STAFF_SECTION: SectionConfig = {
  key: 'staff',
  title: 'CAISSE',
  borderColor: 'border-emerald-500',
  bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  textColor: 'text-emerald-700 dark:text-emerald-400',
  headerColor: 'text-emerald-600 dark:text-emerald-400',
  defaultOpen: true,
  items: [
    { label: 'Vendre', href: '/pos', icon: ShoppingCart },
    { label: 'Produits', href: '/products', icon: Package, readOnly: true },
    { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet },
    { label: 'Dépenses', href: '/expenses', icon: Receipt },
  ],
}

const STAFF_PROFILE_SECTION: SectionConfig = {
  key: 'staff-profil',
  title: 'MON COMPTE',
  borderColor: 'border-slate-300',
  bgColor: 'bg-slate-100 dark:bg-slate-700',
  textColor: 'text-slate-700 dark:text-slate-200',
  headerColor: 'text-slate-500 dark:text-slate-400',
  defaultOpen: false,
  items: [
    { label: 'Mon profil', href: '/profile', icon: User },
  ],
}

const STAFF_BOTTOM_NAV = [
  { label: 'Vendre', href: '/pos', icon: ShoppingCart },
  { label: 'Produits', href: '/products', icon: Package },
  { label: 'Caisse', href: '/register-shifts', icon: Wallet },
  { label: 'Profil', href: '/profile', icon: User },
]

const MANAGER_BOTTOM_NAV = [
  { label: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vendre', href: '/pos', icon: ShoppingCart },
  { label: 'Produits', href: '/products', icon: Package },
  { label: 'Rapports', href: '/reports', icon: TrendingUp },
]

const MANAGER_CAISSE_SECTION: SectionConfig = {
  key: 'manager-caisse',
  title: 'CAISSE',
  borderColor: 'border-emerald-500',
  bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  textColor: 'text-emerald-700 dark:text-emerald-400',
  headerColor: 'text-emerald-600 dark:text-emerald-400',
  defaultOpen: true,
  items: [
    { label: 'Vendre', href: '/pos', icon: ShoppingCart },
    { label: 'Historique des ventes', href: '/sales', icon: ReceiptText },
    { label: 'Remboursements', href: '/refunds', icon: RotateCcw },
    { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet },
  ],
}

const MANAGER_GESTION_SECTION: SectionConfig = {
  key: 'manager-gestion',
  title: 'GESTION',
  borderColor: 'border-violet-500',
  bgColor: 'bg-violet-50 dark:bg-violet-900/30',
  textColor: 'text-violet-700 dark:text-violet-400',
  headerColor: 'text-violet-600 dark:text-violet-400',
  defaultOpen: false,
  items: [
    { label: 'Produits', href: '/products', icon: Package, readOnly: true },
    { label: 'Clients', href: '/customers', icon: Users },
    { label: 'Depenses', href: '/expenses', icon: Receipt },
    { label: 'Employés', href: '/employees', icon: UserCog, readOnly: true },
  ],
}

const MANAGER_BOUTIQUE_SECTION: SectionConfig = {
  key: 'manager-boutique',
  title: 'BOUTIQUE EN LIGNE',
  borderColor: 'border-orange-500',
  bgColor: 'bg-orange-50 dark:bg-orange-900/30',
  textColor: 'text-orange-700 dark:text-orange-400',
  headerColor: 'text-orange-600 dark:text-orange-400',
  defaultOpen: false,
  items: [
    { label: 'Ma boutique', href: '/storefront', icon: Globe },
    { label: 'Commandes en ligne', href: '/orders', icon: ShoppingBag },
    { label: 'QR Code boutique', href: '/storefront/qr', icon: QrCode },
  ],
}

const MANAGER_RAPPORTS_SECTION: SectionConfig = {
  key: 'manager-rapports',
  title: 'RAPPORTS',
  borderColor: 'border-teal-500',
  bgColor: 'bg-teal-50 dark:bg-teal-900/30',
  textColor: 'text-teal-700 dark:text-teal-400',
  headerColor: 'text-teal-600 dark:text-teal-400',
  defaultOpen: false,
  items: [
    { label: 'Rapports', href: '/reports', icon: TrendingUp },
    { label: 'Finances', href: '/finances', icon: DollarSign },
  ],
}

const MANAGER_PROFILE_SECTION: SectionConfig = {
  key: 'manager-profil',
  title: 'MON COMPTE',
  borderColor: 'border-slate-300',
  bgColor: 'bg-slate-100 dark:bg-slate-700',
  textColor: 'text-slate-700 dark:text-slate-200',
  headerColor: 'text-slate-500 dark:text-slate-400',
  defaultOpen: false,
  items: [
    { label: 'Mon profil', href: '/profile', icon: User },
    { label: 'Parametres', href: '/settings', icon: Settings },
    { label: 'Modes de paiement', href: '/payment-methods', icon: CreditCard },
    { label: 'Aide', href: '/help', icon: HelpCircle },
  ],
}

// The exact, narrowed Manager sidebar: Vendre, Historique, Remboursements,
// Caisse du jour, Produits (view), Clients, Dépenses, Employés (view), Boutique
// en ligne, Rapports — and the account section. No Catégories, Fournisseurs,
// Conseiller, Coach, or Zone de Sécurité.
const MANAGER_SECTIONS: SectionConfig[] = [
  MANAGER_CAISSE_SECTION,
  MANAGER_GESTION_SECTION,
  MANAGER_BOUTIQUE_SECTION,
  MANAGER_RAPPORTS_SECTION,
  MANAGER_PROFILE_SECTION,
]

const ROLE_LABELS: Record<string, string> = {
  sales: 'Vendeur',
  cashier: 'Caissier',
  staff: 'Employé',
  employee: 'Employé',
  manager: 'Manager',
  admin: 'Admin',
  owner: 'Propriétaire',
}

const SUPER_ADMIN_SECTION: SectionConfig = {
  key: 'super-admin',
  title: 'SUPER ADMIN',
  borderColor: 'border-slate-900',
  bgColor: 'bg-slate-100 dark:bg-slate-700',
  textColor: 'text-slate-950 dark:text-white',
  headerColor: 'text-slate-700 dark:text-slate-300',
  defaultOpen: false,
  items: [
    { label: 'Agents', href: '/super-admin/agents', icon: Users },
  ],
}

function productsLabel(businessType: string): string {
  switch (businessType) {
    case 'restaurant': return 'Menu & Produits'
    case 'beauty': return 'Services'
    case 'pharmacy': return 'Médicaments'
    case 'garage': return 'Pièces détachées'
    case 'btp': return 'Matériaux'
    case 'laundry': return 'Tarifs'
    default: return 'Produits'
  }
}

// Operational items unique to a business type, folded into VENTES so each shop
// keeps its workflow (most route to "Coming Soon" placeholders for now).
function operationalItems(businessType: string): SectionConfig['items'] {
  switch (businessType) {
    case 'beauty': return [{ label: 'Rendez-vous', href: '/appointments', icon: Calendar }]
    case 'pharmacy': return [{ label: 'Ordonnances', href: '/prescriptions', icon: FileText }]
    case 'garage': return [{ label: 'Interventions', href: '/services', icon: Wrench }]
    case 'btp': return [{ label: 'Chantiers', href: '/projects', icon: HardHat }]
    case 'laundry': return [{ label: 'En cours', href: '/active-orders', icon: Droplets }]
    default: return []
  }
}

// Unified owner navigation. Same section structure for every business type, with
// type-specific operational items + product label injected. Progressive
// disclosure (essentials vs full) is handled at render time.
function getNavSections(businessType: string): SectionConfig[] {
  return [
    {
      key: 'ventes', title: 'VENTES',
      borderColor: 'border-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-400', headerColor: 'text-emerald-600 dark:text-emerald-400',
      defaultOpen: true,
      items: [
        { label: 'Vendre', href: '/pos', icon: ShoppingCart },
        ...operationalItems(businessType),
        { label: 'Historique des ventes', href: '/sales', icon: ReceiptText, tourId: 'tour-nav-sales' },
        { label: 'Remboursements', href: '/refunds', icon: RotateCcw },
        { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet },
      ],
    },
    {
      key: 'stock', title: 'STOCK',
      borderColor: 'border-violet-500', bgColor: 'bg-violet-50 dark:bg-violet-900/30',
      textColor: 'text-violet-700 dark:text-violet-400', headerColor: 'text-violet-600 dark:text-violet-400',
      defaultOpen: false,
      items: [
        { label: productsLabel(businessType), href: '/products', icon: Package, tourId: 'tour-nav-products' },
        { label: 'Ajouter produit', href: '/products/new', icon: Plus },
        { label: 'Catégories', href: '/categories', icon: Tag },
        { label: 'Fournisseurs', href: '/suppliers', icon: Truck, lockedPlan: 'business' },
        { label: 'Réassort', href: '/reassort', icon: PackagePlus, lockedPlan: 'business' },
        { label: 'Performance produits', href: '/products/performance', icon: BarChart3, lockedPlan: 'business' },
      ],
    },
    {
      key: 'gestion', title: 'GESTION',
      borderColor: 'border-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-900/30',
      textColor: 'text-sky-700 dark:text-sky-400', headerColor: 'text-sky-600 dark:text-sky-400',
      defaultOpen: false,
      items: [
        { label: 'Clients', href: '/customers', icon: Users },
        { label: 'Employés', href: '/employees', icon: UserCog, lockedPlan: 'starter' },
      ],
    },
    {
      key: 'boutique', title: 'BOUTIQUE EN LIGNE',
      borderColor: 'border-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-400', headerColor: 'text-orange-600 dark:text-orange-400',
      defaultOpen: false,
      items: [
        { label: 'Ma boutique en ligne', href: '/storefront', icon: Globe, tourId: 'tour-nav-storefront' },
        { label: 'Commandes en ligne', href: '/orders', icon: ShoppingBag },
        { label: 'QR Code boutique', href: '/storefront/qr', icon: QrCode, lockedPlan: 'business' },
        { label: 'Partager boutique', href: '/storefront/share', icon: Share2 },
      ],
    },
    {
      key: 'rapports', title: 'RAPPORTS',
      borderColor: 'border-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      textColor: 'text-teal-700 dark:text-teal-400', headerColor: 'text-teal-600 dark:text-teal-400',
      defaultOpen: false,
      items: [
        { label: 'Rapports', href: '/reports', icon: TrendingUp },
        { label: 'Dépenses', href: '/expenses', icon: Receipt },
        { label: 'Finances', href: '/finances', icon: DollarSign, lockedPlan: 'business' },
        { label: 'Client Doit', href: '/client-doit', icon: HandCoins },
        { label: 'Coach Entrepreneur', href: '/conseiller', icon: Sparkles, lockedPlan: 'premium' },
      ],
    },
    {
      key: 'profils', title: 'PARAMÈTRES PROFILS',
      borderColor: 'border-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700',
      textColor: 'text-slate-700 dark:text-slate-200', headerColor: 'text-slate-500 dark:text-slate-400',
      defaultOpen: false,
      items: [
        { label: 'Profil', href: '/profile', icon: User },
        { label: 'Mode de paiement', href: '/payment-methods', icon: CreditCard },
        { label: 'Intégration WhatsApp', href: '/settings/whatsapp', icon: MessageCircle },
      ],
    },
    {
      key: 'avances', title: 'PARAMÈTRES AVANCÉS',
      borderColor: 'border-red-500', bgColor: 'bg-red-50 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400', headerColor: 'text-red-600 dark:text-red-400',
      defaultOpen: false,
      items: [
        { label: 'Sauvegarde', href: '/backup', icon: Database },
        { label: 'Réinitialiser tout', href: '/reset-products', icon: Trash2 },
        { label: 'Supprimer Mon Compte', href: '/delete-store', icon: AlertTriangle },
      ],
    },
  ]
}


const BOTTOM_NAV = [
  { label: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vendre', href: '/pos', icon: ShoppingCart },
  { label: 'Produits', href: '/products', icon: Package },
  { label: 'Rapports', href: '/reports', icon: TrendingUp },
]

const AppShell = memo(function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  // Progressive disclosure: collapsed shows only the essentials, expanded shows
  // the full organized menu. The choice persists across sessions in localStorage.
  const [navExpanded, setNavExpanded] = useState(false)

  const {
    businessId,
    businessName,
    businessLogo,
    businessType,
    role: userRole,
    fullName: userName,
    plan,
    expiresAt,
    isSuperAdmin,
    loading,
  } = useBusinessData()

  const platformSettings = usePlatformSettings()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    function onBusinessTypeChanged() {
      globalMutate('business-data')
    }
    window.addEventListener('business-type-changed', onBusinessTypeChanged)
    return () => window.removeEventListener('business-type-changed', onBusinessTypeChanged)
  }, [])

  // Block staff from restricted pages
  useEffect(() => {
    if (loading) return
    if (STAFF_ROLES.includes(userRole)) {
      const allowed =
        pathname === '/products' ||
        STAFF_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
      if (!allowed) router.replace('/pos')
    } else if (userRole === 'manager') {
      // Products are view-only: block the create/edit routes with a read-only notice.
      const blockedProductRoute =
        pathname === '/products/new' ||
        pathname.startsWith('/products/new') ||
        /^\/products\/[^/]+\/edit/.test(pathname)
      if (blockedProductRoute) {
        try { sessionStorage.setItem('products_flash', 'Accès en lecture seule') } catch {}
        router.replace('/products')
        return
      }
      const allowed = MANAGER_ONLY_ALLOWED_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
      )
      if (!allowed) router.replace('/dashboard')
    } else if (MANAGER_ROLES.includes(userRole) && userRole !== 'owner') {
      const allowed = MANAGER_ALLOWED_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
      )
      if (!allowed) router.replace('/dashboard')
    }
    // owner has unrestricted access
  }, [loading, userRole, pathname, router])

  // Restore the expanded/collapsed menu preference.
  useEffect(() => {
    try { setNavExpanded(localStorage.getItem('caissepro_nav_expanded') === '1') } catch {}
  }, [])

  function toggleNavExpanded() {
    setNavExpanded((prev) => {
      const next = !prev
      try { localStorage.setItem('caissepro_nav_expanded', next ? '1' : '0') } catch {}
      return next
    })
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-black text-slate-600 dark:text-slate-400">Chargement...</p>
      </main>
    )
  }

  // Maintenance mode locks merchants out; super-admins keep access to fix things.
  if (platformSettings.maintenance_mode && !isSuperAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-slate-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <Wrench size={30} />
        </div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Maintenance en cours</h1>
        <p className="max-w-md text-sm font-semibold text-slate-500 dark:text-slate-400">
          CaissePro est temporairement indisponible pour une mise à jour. Merci de réessayer dans quelques minutes.
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-2 rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-700"
        >
          Réessayer
        </button>
      </main>
    )
  }

  const isStaff = STAFF_ROLES.includes(userRole)
  const isManager = MANAGER_ROLES.includes(userRole)
  const isOwner = userRole === 'owner'
  const isManagerOnly = userRole === 'manager'
  const isEmployee = isStaff || isManager
  const baseSections = isStaff
    ? [STAFF_SECTION, STAFF_PROFILE_SECTION]
    : isOwner
    ? getNavSections(businessType)
    : isManagerOnly
    ? MANAGER_SECTIONS
    : isManager
    ? getNavSections(businessType).filter(s => s.key !== 'avances')
    : getNavSections(businessType)
  // Coach Entrepreneur now lives inside the RAPPORTS section, so no separate
  // section is prepended.
  const navSections = isSuperAdmin ? [...baseSections, SUPER_ADMIN_SECTION] : baseSections
  const currentPlanLevel = PLAN_LEVELS[plan || 'free'] ?? 0

  // Collapsed view = just the essentials, drawn from whatever sections this role
  // actually has, so each role only ever sees items it can access. Order follows
  // ESSENTIAL_HREFS (Vendre, Produits, Caisse du jour, Boutique en ligne).
  const allNavItems = navSections.flatMap((s) => s.items)
  const essentialItems = ESSENTIAL_HREFS
    .map((href) => allNavItems.find((it) => it.href === href))
    .filter((it): it is SectionConfig['items'][number] => Boolean(it))

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Business header */}
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-slate-700">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white">
          {businessLogo
            ? <Image src={businessLogo} alt={businessName} fill className="bg-white object-contain p-1" />
            : <Store size={22} />}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-black text-slate-950 dark:text-white">{businessName}</h1>
          {isEmployee ? (
            <>
              <p className="truncate text-sm font-bold text-slate-600 dark:text-slate-300">{userName}</p>
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${
                isManager
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </>
          ) : (
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Propulse par CaissePro</p>
          )}
        </div>
      </div>

      {/* Subscription status — hidden for employees and managers */}
      {!isEmployee && <div className="px-4 pt-3">
        {(() => {
          const planName = plan
          const exp = expiresAt
          const days = exp ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000) : null
          const isActive = !!planName && planName !== 'free'
          const color = !isActive ? 'neutral' : days !== null && days > 30 ? 'green' : days !== null && days > 0 ? 'amber' : 'red'
          const bg: Record<string, string> = {
            neutral: 'bg-slate-50 dark:bg-slate-700/50',
            green: 'bg-emerald-50 dark:bg-emerald-900/30',
            amber: 'bg-amber-50 dark:bg-amber-900/30',
            red: 'bg-red-50 dark:bg-red-900/30',
          }
          const txt: Record<string, string> = {
            neutral: 'text-slate-500 dark:text-slate-400',
            green: 'text-emerald-700 dark:text-emerald-400',
            amber: 'text-amber-700 dark:text-amber-400',
            red: 'text-red-700 dark:text-red-400',
          }
          return (
            <div className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${bg[color]}`}>
              <div>
                <p className={`text-xs font-black uppercase tracking-wide ${txt[color]}`}>
                  Plan {planName || 'Gratuit'}
                </p>
                {isActive && days !== null && (
                  <p className={`text-[10px] font-bold ${txt[color]}`}>
                    {days > 0 ? `${days} jours restants` : 'Expire'}
                  </p>
                )}
              </div>
              <Link href="/upgrade" className="rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-emerald-700">
                {isActive && days !== null && days > 0 ? 'Renouveler' : 'Upgrader'}
              </Link>
            </div>
          )
        })()}
      </div>}

      {/* VENDRE button */}
      <div className="px-4 pt-4">
        <Link
          href="/pos"
          onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new Event('play-navigation')) }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95"
        >
          <ShoppingCart size={20} />
          VENDRE
        </Link>
      </div>

      {/* ACCUEIL — hidden for staff, shown for managers and owners */}
      {!isStaff && (
        <div className="px-4 pt-3">
          <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ACCUEIL</p>
          <Link
            href="/dashboard"
            onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new Event('play-navigation')) }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
              pathname === '/dashboard'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard size={17} />
            Tableau de bord
          </Link>
        </div>
      )}

      {/* Navigation: essentials by default, full organized menu when expanded */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {!navExpanded && (
          <div className="overflow-hidden rounded-2xl border-l-4 border-emerald-500 bg-white shadow-sm dark:bg-slate-800 dark:shadow-none">
            <div className="space-y-0.5 p-2">
              {essentialItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={`essential-${item.href}`}
                    href={item.href}
                    onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new Event('play-navigation')) }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {navExpanded && navSections.map((section) => {
          const isOpen = openSections[section.key] ?? (section.defaultOpen ?? false)
          const itemHeight = 48

          const visibleItems = section.items
          if (visibleItems.length === 0) return null

          return (
            <div
              key={section.key}
              className={`overflow-hidden rounded-2xl border-l-4 bg-white shadow-sm dark:bg-slate-800 dark:shadow-none ${section.borderColor}`}
            >
              <button
                onClick={() => toggleSection(section.key)}
                className={`flex w-full items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${section.headerColor}`}
              >
                <span>{section.title}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? `${visibleItems.length * itemHeight}px` : '0px' }}
              >
                <div className="space-y-0.5 px-2 pb-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href
                    const isLocked = item.lockedPlan
                      ? currentPlanLevel < (PLAN_LEVELS[item.lockedPlan] ?? 0)
                      : false

                    return (
                      <Link
                        key={`${section.key}-${item.href}-${item.label}`}
                        href={isLocked ? '/upgrade' : item.href}
                        id={item.tourId}
                        onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new Event('play-navigation')) }}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                          active
                            ? `${section.bgColor} ${section.textColor}`
                            : isLocked
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="flex-1">{item.label}</span>
                        {isLocked && <Lock size={12} className="shrink-0 text-amber-500" />}
                        {item.readOnly && !isLocked && (
                          <span title="Accès lecture seule"><Lock size={11} className="shrink-0 text-slate-400" /></span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Afficher tout / Afficher moins — progressive disclosure toggle */}
      <div className="px-4 pb-1 pt-2">
        <button
          onClick={toggleNavExpanded}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {navExpanded
            ? (<><ChevronDown size={14} className="rotate-180" /> Afficher moins</>)
            : (<><Eye size={14} /> Afficher tout</>)}
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-slate-100 p-4 dark:border-slate-700">
        <button
          onClick={logout}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Deconnexion
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-900 dark:text-white">
      <NetworkStatusBanner />
      <SoundManager />
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-700 dark:bg-slate-800 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute right-4 top-4 rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-700 dark:text-slate-300 lg:hidden"
        >
          <X size={18} />
        </button>

        {sidebarContent}
      </aside>

      {/* Main content */}
      <section className="lg:pl-72">
        {platformSettings.announcement_banner?.trim() && (
          <div className="flex items-center justify-center gap-2 bg-emerald-600 px-5 py-2.5 text-center text-sm font-black text-white">
            <Megaphone size={16} className="shrink-0" />
            <span>{platformSettings.announcement_banner}</span>
          </div>
        )}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
                {subtitle && <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DarkModeToggle />
              <LanguageSwitcher />
              {action && <div>{action}</div>}
            </div>
          </div>
        </header>

        <div className="px-5 py-8 pb-28 lg:pb-8">{children}</div>

        <footer className="border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col items-center gap-3">
            <AmdyLabsBrand />
            <div className="flex gap-4 text-xs font-bold text-slate-400 dark:text-slate-500">
              <Link href="/help" className="hover:text-slate-700 dark:hover:text-slate-300">Aide</Link>
              <span>·</span>
              <Link href="/legal" className="hover:text-slate-700 dark:hover:text-slate-300">Mentions legales</Link>
              <span>·</span>
              <Link href="/feedback" className="hover:text-slate-700 dark:hover:text-slate-300">Feedback</Link>
              <span>·</span>
              <Link href="/careers" className="hover:text-emerald-600 dark:hover:text-emerald-400">Carrieres</Link>
            </div>
          </div>
        </footer>
      </section>

      {/* Floating VENDRE button */}
      {pathname !== '/pos' && pathname !== '/checkout' && (
        <Link
          id="tour-vendre-fab"
          href="/pos"
          aria-label="Vendre"
          className="fixed bottom-24 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 transition hover:scale-105 hover:bg-emerald-700 active:scale-95 lg:bottom-8 lg:right-8"
        >
          <Plus size={28} />
        </Link>
      )}

      <TutorialTour />

      {/* Fixed bottom nav (mobile only) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 lg:hidden">
        <div className="grid grid-cols-5">
          {(isStaff ? STAFF_BOTTOM_NAV : (isManager && !isOwner) ? MANAGER_BOTTOM_NAV : BOTTOM_NAV).map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.dispatchEvent(new Event('play-navigation'))}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black transition-colors ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <Menu size={20} />
            <span>Plus</span>
          </button>
        </div>
      </nav>
    </main>
  )
})

export default AppShell
