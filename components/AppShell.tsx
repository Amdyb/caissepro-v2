'use client'

import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import TutorialTour from '@/components/TutorialTour'
import DarkModeToggle from '@/components/DarkModeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { supabase } from '@/lib/supabaseClient'
import {
  AlertTriangle,
  ChevronDown,
  Plus,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Package,
  QrCode,
  Receipt,
  ReceiptText,
  RotateCcw,
  Scissors,
  Settings,
  Share2,
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
  items: { label: string; href: string; icon: any; tourId?: string }[]
}

const PROFILE_SECTION: SectionConfig = {
  key: 'profil',
  title: 'PROFIL & PARAMETRES',
  borderColor: 'border-slate-400',
  bgColor: 'bg-slate-100 dark:bg-slate-700',
  textColor: 'text-slate-700 dark:text-slate-200',
  headerColor: 'text-slate-500 dark:text-slate-400',
  defaultOpen: false,
  items: [
    { label: 'Profil', href: '/profile', icon: User },
    { label: 'Parametres', href: '/settings', icon: Settings },
    { label: 'Modes de paiement', href: '/payment-methods', icon: CreditCard },
    { label: 'Langue', href: '/language', icon: Globe },
    { label: 'Mentions legales', href: '/legal', icon: FileText },
    { label: 'Aide', href: '/help', icon: HelpCircle },
  ],
}

const SECURITY_SECTION: SectionConfig = {
  key: 'securite',
  title: 'ZONE DE SECURITE',
  borderColor: 'border-red-500',
  bgColor: 'bg-red-50 dark:bg-red-900/30',
  textColor: 'text-red-700 dark:text-red-400',
  headerColor: 'text-red-600 dark:text-red-400',
  defaultOpen: false,
  items: [
    { label: 'Reinitialiser produits', href: '/reset-products', icon: Trash2 },
    { label: 'Supprimer boutique', href: '/delete-store', icon: AlertTriangle },
  ],
}

const RETAIL_SECTIONS: SectionConfig[] = [
  {
    key: 'caisse',
    title: 'CAISSE',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    headerColor: 'text-emerald-600 dark:text-emerald-400',
    defaultOpen: true,
    items: [
      { label: 'Vendre', href: '/pos', icon: ShoppingCart },
      { label: 'Historique des ventes', href: '/sales', icon: ReceiptText, tourId: 'tour-nav-sales' },
      { label: 'Remboursements', href: '/refunds', icon: RotateCcw },
      { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet },
    ],
  },
  {
    key: 'gestion',
    title: 'GESTION',
    borderColor: 'border-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
    textColor: 'text-violet-700 dark:text-violet-400',
    headerColor: 'text-violet-600 dark:text-violet-400',
    defaultOpen: false,
    items: [
      { label: 'Produits', href: '/products', icon: Package, tourId: 'tour-nav-products' },
      { label: 'Clients', href: '/customers', icon: Users },
      { label: 'Employes', href: '/employees', icon: UserCog },
      { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
      { label: 'Categories', href: '/categories', icon: Tag },
    ],
  },
  {
    key: 'boutique',
    title: 'BOUTIQUE EN LIGNE',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    headerColor: 'text-orange-600 dark:text-orange-400',
    defaultOpen: false,
    items: [
      { label: 'Ma boutique en ligne', href: '/storefront', icon: Globe, tourId: 'tour-nav-storefront' },
      { label: 'Commandes clients', href: '/orders', icon: ShoppingBag },
      { label: 'QR Code boutique', href: '/storefront/qr', icon: QrCode },
      { label: 'Partager boutique', href: '/storefront/share', icon: Share2 },
    ],
  },
  {
    key: 'rapports',
    title: 'RAPPORTS',
    borderColor: 'border-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-400',
    headerColor: 'text-teal-600 dark:text-teal-400',
    defaultOpen: false,
    items: [
      { label: 'Rapports', href: '/reports', icon: TrendingUp },
      { label: 'Depenses', href: '/expenses', icon: Receipt },
      { label: 'Finances', href: '/finances', icon: DollarSign },
    ],
  },
]

function getNavSections(businessType: string): SectionConfig[] {
  let typeSections: SectionConfig[]

  switch (businessType) {
    case 'restaurant':
      typeSections = [
        {
          key: 'restaurant',
          title: 'RESTAURANT',
          borderColor: 'border-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-400',
          headerColor: 'text-orange-600 dark:text-orange-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Commandes', href: '/orders', icon: ShoppingBag },
            { label: 'Produits/Menu', href: '/products', icon: Package },
            { label: 'Clients', href: '/customers', icon: Users },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'beauty':
      typeSections = [
        {
          key: 'beauty',
          title: 'SALON & BEAUTE',
          borderColor: 'border-pink-500',
          bgColor: 'bg-pink-50 dark:bg-pink-900/30',
          textColor: 'text-pink-700 dark:text-pink-400',
          headerColor: 'text-pink-600 dark:text-pink-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Services', href: '/products', icon: Scissors },
            { label: 'Clients', href: '/customers', icon: Users },
            { label: 'Employes', href: '/employees', icon: UserCog },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'pharmacy':
      typeSections = [
        {
          key: 'pharmacy',
          title: 'PHARMACIE',
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-400',
          headerColor: 'text-blue-600 dark:text-blue-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Medicaments', href: '/products', icon: Package },
            { label: 'Stock critique', href: '/products', icon: AlertTriangle },
            { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'garage':
      typeSections = [
        {
          key: 'garage',
          title: 'GARAGE & AUTO',
          borderColor: 'border-slate-500',
          bgColor: 'bg-slate-100 dark:bg-slate-700',
          textColor: 'text-slate-700 dark:text-slate-300',
          headerColor: 'text-slate-600 dark:text-slate-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Pieces detachees', href: '/products', icon: Package },
            { label: 'Clients', href: '/customers', icon: Users },
            { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'btp':
      typeSections = [
        {
          key: 'btp',
          title: 'BTP & SERVICES',
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          headerColor: 'text-yellow-600 dark:text-yellow-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Produits & Materiaux', href: '/products', icon: Package },
            { label: 'Clients', href: '/customers', icon: Users },
            { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'tontine':
      typeSections = [
        {
          key: 'tontine',
          title: 'TONTINE',
          borderColor: 'border-violet-500',
          bgColor: 'bg-violet-50 dark:bg-violet-900/30',
          textColor: 'text-violet-700 dark:text-violet-400',
          headerColor: 'text-violet-600 dark:text-violet-400',
          defaultOpen: true,
          items: [
            { label: 'Tontines', href: '/tontines', icon: Users },
            { label: 'Membres', href: '/employees', icon: UserCog },
            { label: 'Historique', href: '/activity', icon: ReceiptText },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'rental':
      typeSections = [
        {
          key: 'rental',
          title: 'LOCATION & IMMOBILIER',
          borderColor: 'border-emerald-500',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          headerColor: 'text-emerald-600 dark:text-emerald-400',
          defaultOpen: true,
          items: [
            { label: 'Proprietes', href: '/real-estate', icon: Store },
            { label: 'Locataires', href: '/customers', icon: Users },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'wholesale':
      typeSections = [
        {
          key: 'wholesale',
          title: 'GROSSISTE',
          borderColor: 'border-teal-500',
          bgColor: 'bg-teal-50 dark:bg-teal-900/30',
          textColor: 'text-teal-700 dark:text-teal-400',
          headerColor: 'text-teal-600 dark:text-teal-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Stock', href: '/products', icon: Package },
            { label: 'Commandes', href: '/orders', icon: ShoppingBag },
            { label: 'Clients revendeurs', href: '/customers', icon: Users },
            { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    case 'laundry':
      typeSections = [
        {
          key: 'laundry',
          title: 'LAVERIE & PRESSING',
          borderColor: 'border-cyan-500',
          bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
          textColor: 'text-cyan-700 dark:text-cyan-400',
          headerColor: 'text-cyan-600 dark:text-cyan-400',
          defaultOpen: true,
          items: [
            { label: 'Caisse', href: '/pos', icon: ShoppingCart },
            { label: 'Tarifs', href: '/products', icon: Package },
            { label: 'Clients', href: '/customers', icon: Users },
            { label: 'Depenses', href: '/expenses', icon: Receipt },
            { label: 'Rapports', href: '/reports', icon: TrendingUp },
          ],
        },
      ]
      break

    default:
      typeSections = RETAIL_SECTIONS
      break
  }

  return [...typeSections, PROFILE_SECTION, SECURITY_SECTION]
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
  const [businessName, setBusinessName] = useState('CaissePro')
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState('retail')
  const [ready, setReady] = useState(false)
  const [subscription, setSubscription] = useState<{ plan: string; expires_at: string | null } | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadBranding() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setReady(true); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name, logo_url, business_type)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership
      if (member?.businesses) {
        setBusinessName(member.businesses.name || 'CaissePro')
        setBusinessLogo(member.businesses.logo_url || null)
        setBusinessType(member.businesses.business_type || 'retail')
      }

      if (member?.business_id) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, expires_at')
          .eq('business_id', member.business_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (sub) setSubscription({ plan: sub.plan, expires_at: sub.expires_at })
      }

      setReady(true)
    }
    loadBranding()
  }, [])

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-black text-slate-600 dark:text-slate-400">Chargement...</p>
      </main>
    )
  }

  const navSections = getNavSections(businessType)

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
          <h1 className="truncate text-lg font-black text-slate-950 dark:text-white">{businessName}</h1>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Propulse par CaissePro</p>
        </div>
      </div>

      {/* Subscription status */}
      <div className="px-4 pt-3">
        {(() => {
          const planName = subscription?.plan
          const exp = subscription?.expires_at
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
                Upgrader
              </Link>
            </div>
          )
        })()}
      </div>

      {/* VENDRE button */}
      <div className="px-4 pt-4">
        <Link
          href="/pos"
          onClick={() => setMobileMenuOpen(false)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95"
        >
          <ShoppingCart size={20} />
          VENDRE
        </Link>
      </div>

      {/* ACCUEIL */}
      <div className="px-4 pt-3">
        <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ACCUEIL</p>
        <Link
          href="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
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

      {/* Collapsible sections */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {navSections.map((section) => {
          const isOpen = openSections[section.key] ?? (section.defaultOpen ?? false)
          const itemHeight = 48

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
                style={{ maxHeight: isOpen ? `${section.items.length * itemHeight}px` : '0px' }}
              >
                <div className="space-y-0.5 px-2 pb-2">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href

                    return (
                      <Link
                        key={`${section.key}-${item.href}-${item.label}`}
                        href={item.href}
                        id={item.tourId}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                          active
                            ? `${section.bgColor} ${section.textColor}`
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

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
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
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
