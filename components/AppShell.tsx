'use client'

import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { supabase } from '@/lib/supabaseClient'
import {
  AlertTriangle,
  ChevronDown,
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
  items: { label: string; href: string; icon: any }[]
}

const NAV_SECTIONS: SectionConfig[] = [
  {
    key: 'caisse',
    title: 'CAISSE',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    headerColor: 'text-emerald-600',
    defaultOpen: true,
    items: [
      { label: 'Vendre', href: '/pos', icon: ShoppingCart },
      { label: 'Historique des ventes', href: '/sales', icon: ReceiptText },
      { label: 'Remboursements', href: '/refunds', icon: RotateCcw },
      { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet },
    ],
  },
  {
    key: 'gestion',
    title: 'GESTION',
    borderColor: 'border-violet-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    headerColor: 'text-violet-600',
    defaultOpen: false,
    items: [
      { label: 'Produits', href: '/products', icon: Package },
      { label: 'Clients', href: '/customers', icon: Users },
      { label: 'Employés', href: '/employees', icon: UserCog },
      { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
      { label: 'Catégories', href: '/categories', icon: Tag },
    ],
  },
  {
    key: 'boutique',
    title: 'BOUTIQUE EN LIGNE',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    headerColor: 'text-orange-600',
    defaultOpen: false,
    items: [
      { label: 'Ma boutique en ligne', href: '/storefront', icon: Globe },
      { label: 'Commandes clients', href: '/orders', icon: ShoppingBag },
      { label: 'QR Code boutique', href: '/storefront/qr', icon: QrCode },
      { label: 'Partager boutique', href: '/storefront/share', icon: Share2 },
    ],
  },
  {
    key: 'rapports',
    title: 'RAPPORTS',
    borderColor: 'border-teal-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    headerColor: 'text-teal-600',
    defaultOpen: false,
    items: [
      { label: 'Rapports', href: '/reports', icon: TrendingUp },
      { label: 'Dépenses', href: '/expenses', icon: Receipt },
      { label: 'Finances', href: '/finances', icon: DollarSign },
    ],
  },
  {
    key: 'profil',
    title: 'PROFIL & PARAMÈTRES',
    borderColor: 'border-slate-400',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    headerColor: 'text-slate-500',
    defaultOpen: false,
    items: [
      { label: 'Profil', href: '/profile', icon: User },
      { label: 'Paramètres', href: '/settings', icon: Settings },
      { label: 'Modes de paiement', href: '/payment-methods', icon: CreditCard },
      { label: 'Langue', href: '/language', icon: Globe },
      { label: 'Mentions légales', href: '/legal', icon: FileText },
      { label: 'Aide', href: '/help', icon: HelpCircle },
    ],
  },
  {
    key: 'securite',
    title: 'ZONE DE SÉCURITÉ',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    headerColor: 'text-red-600',
    defaultOpen: false,
    items: [
      { label: 'Réinitialiser produits', href: '/reset-products', icon: Trash2 },
      { label: 'Supprimer boutique', href: '/delete-store', icon: AlertTriangle },
    ],
  },
]

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
  const [ready, setReady] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.key, s.defaultOpen ?? false]))
  )

  useEffect(() => {
    async function loadBranding() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setReady(true); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('businesses(name, logo_url)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership
      if (member?.businesses) {
        setBusinessName(member.businesses.name || 'CaissePro')
        setBusinessLogo(member.businesses.logo_url || null)
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-600">Chargement...</p>
      </main>
    )
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Business header */}
      <div className="flex items-center gap-3 border-b border-slate-100 p-5">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white">
          {businessLogo
            ? <Image src={businessLogo} alt={businessName} fill className="bg-white object-contain p-1" />
            : <Store size={22} />}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black text-slate-950">{businessName}</h1>
          <p className="text-xs font-bold text-slate-400">Propulsé par CaissePro</p>
        </div>
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
        <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">ACCUEIL</p>
        <Link
          href="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
            pathname === '/dashboard'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard size={17} />
          Tableau de bord
        </Link>
      </div>

      {/* Collapsible sections */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.key]
          const itemHeight = 48

          return (
            <div
              key={section.key}
              className={`overflow-hidden rounded-2xl border-l-4 bg-white shadow-sm ${section.borderColor}`}
            >
              <button
                onClick={() => toggleSection(section.key)}
                className={`flex w-full items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-slate-50 ${section.headerColor}`}
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
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                          active
                            ? `${section.bgColor} ${section.textColor}`
                            : 'text-slate-600 hover:bg-slate-50'
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
      <div className="border-t border-slate-100 p-4">
        <button
          onClick={logout}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute right-4 top-4 rounded-xl bg-slate-100 p-2 text-slate-500 lg:hidden"
        >
          <X size={18} />
        </button>

        {sidebarContent}
      </aside>

      {/* Main content */}
      <section className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">{title}</h2>
                {subtitle && <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {action && <div>{action}</div>}
            </div>
          </div>
        </header>

        <div className="px-5 py-8 pb-28 lg:pb-8">{children}</div>

        <footer className="border-t border-slate-200 bg-white px-5 py-5">
          <div className="flex flex-col items-center gap-3">
            <AmdyLabsBrand />
            <div className="flex gap-4 text-xs font-bold text-slate-400">
              <Link href="/help" className="hover:text-slate-700">Aide</Link>
              <span>·</span>
              <Link href="/legal" className="hover:text-slate-700">Mentions légales</Link>
              <span>·</span>
              <Link href="/feedback" className="hover:text-slate-700">Feedback</Link>
            </div>
          </div>
        </footer>
      </section>

      {/* Fixed bottom nav (mobile only) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white lg:hidden">
        <div className="grid grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black transition-colors ${
                  active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600"
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
