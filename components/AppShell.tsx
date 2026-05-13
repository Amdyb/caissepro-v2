'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  Menu,
  Package,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type AppShellProps = {
  children: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function loadBranding() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      setEmail(userData.user.email || null)

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name, logo_url)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      const member: any = membership

      if (member?.businesses) {
        setBusinessName(member.businesses.name || 'CaissePro')
        setBusinessLogo(member.businesses.logo_url || null)
      }
    }

    loadBranding()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Caisse POS', href: '/pos', icon: ShoppingCart },
    { label: 'Produits', href: '/products', icon: Package },
    { label: 'Catégories', href: '/categories', icon: Boxes },
    { label: 'Ventes', href: '/sales', icon: ReceiptText },
    { label: 'Clients', href: '/customers', icon: Users },
    { label: 'Client Doit', href: '/debts', icon: HandCoins },
    { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
    { label: 'Achats', href: '/purchases', icon: PackagePlus },
    { label: 'Dépenses', href: '/expenses', icon: Wallet },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Rapports', href: '/reports', icon: CreditCard },
    { label: 'Caisse jour', href: '/register-shifts', icon: CalendarClock },
    { label: 'Multi-boutiques', href: '/branches', icon: Building2 },
    { label: 'Paramètres', href: '/settings', icon: Settings }
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-in-out lg:shadow-none ${
          sidebarOpen ? 'w-72' : 'w-24'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt={businessName}
                    className="h-full w-full object-contain bg-white p-1"
                  />
                ) : (
                  <Store size={24} />
                )}
              </div>

              {sidebarOpen && (
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black text-slate-950">CaissePro</h1>
                  <p className="truncate text-xs font-bold text-slate-500">{businessName}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:block"
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon size={21} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 ${sidebarOpen ? '' : 'p-2'}`}>
              <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white font-black text-emerald-700 shadow-sm">
                  {businessName.slice(0, 1)}
                </div>

                {sidebarOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{businessName}</p>
                    <p className="truncate text-xs font-bold text-slate-500">{email || 'Connecté'}</p>
                  </div>
                )}
              </div>

              {sidebarOpen && (
                <button
                  onClick={logout}
                  className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-3xl font-black tracking-tight text-slate-950">{title}</h2>
                {subtitle && <p className="mt-1 truncate text-sm font-semibold text-slate-500">{subtitle}</p>}
              </div>
            </div>

            {action && <div className="shrink-0">{action}</div>}
          </div>
        </header>

        <div className="px-5 py-8">{children}</div>
      </section>
    </main>
  )
}
