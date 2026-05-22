'use client'

import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  HandCoins,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  RotateCcw,
  Settings,
  ShoppingCart,
  Store,
  Trash2,
  UserCog,
  Users,
  Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type AppShellProps = { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }
type NavItem = { label: string; href: string; icon: any }
type NavSection = { title: string; items: NavItem[] }

const employeeNav: NavSection[] = [
  {
    title: 'Tableau de bord',
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Clients', href: '/customers', icon: Users }
    ]
  },
  {
    title: 'Caisse du jour',
    items: [
      { label: 'Vendre', href: '/pos', icon: ShoppingCart },
      { label: 'Rapport du jour', href: '/reports', icon: ReceiptText },
      { label: 'Ma Boutique en ligne', href: '/storefront', icon: Globe }
    ]
  }
]

const adminNav: NavSection[] = [
  {
    title: 'Tableau de bord',
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Produits', href: '/products', icon: Package },
      { label: 'Clients', href: '/customers', icon: Users },
      { label: 'Employés', href: '/employees', icon: UserCog }
    ]
  },
  {
    title: 'Caisse du jour',
    items: [
      { label: 'Vendre', href: '/pos', icon: ShoppingCart },
      { label: 'Historique des ventes', href: '/sales', icon: ReceiptText },
      { label: 'Remboursements', href: '/refunds', icon: RotateCcw },
      { label: 'Caisse du jour', href: '/register-shifts', icon: Wallet },
      { label: 'Client Doit', href: '/debts', icon: HandCoins },
      { label: 'Ma Boutique en ligne', href: '/storefront', icon: Globe }
    ]
  },
  {
    title: 'Profil',
    items: [
      { label: 'Paramètres', href: '/settings/profile', icon: Settings },
      { label: 'Aide', href: '/help', icon: HelpCircle },
      { label: 'Reset Produits', href: '/settings/reset', icon: Trash2 },
      { label: 'Supprimer Boutique', href: '/settings/delete', icon: Trash2 }
    ]
  }
]

function getNavForRole(role: string) {
  const normalized = (role || 'admin').toLowerCase()

  if (
    normalized.includes('employee') ||
    normalized.includes('sales') ||
    normalized.includes('vendeur')
  ) {
    return employeeNav
  }

  return adminNav
}

export default function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const [role, setRole] = useState('admin')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function loadBranding() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setReady(true)
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('role, businesses(name, logo_url)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership

      if (member?.role) {
        setRole(member.role)
      } else {
        setRole('admin')
      }

      if (member?.businesses) {
        setBusinessName(member.businesses.name || 'CaissePro')
        setBusinessLogo(member.businesses.logo_url || null)
      }

      setReady(true)
    }

    loadBranding()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navSections = getNavForRole(role)

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-600">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-24'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white">
                {businessLogo ? <img src={businessLogo} alt={businessName} className="h-full w-full object-contain bg-white p-1" /> : <Store size={22} />}
              </div>
              {sidebarOpen && <div><h1 className="text-xl font-black text-slate-950">{businessName}</h1><p className="text-xs font-bold text-slate-500">Propulsé par CaissePro</p></div>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block">{sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {navSections.map((section) => (
              <div key={section.title}>
                {sidebarOpen && <p className="mb-2 px-3 text-xs font-black uppercase tracking-wider text-slate-400">{section.title}</p>}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href

                    return (
                      <Link
                        key={item.label + item.href}
                        href={item.href}
                        className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon size={20} />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-100 p-4 space-y-3">
            <button onClick={logout} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Déconnexion</button>
            {sidebarOpen && (
              <div className="flex justify-center gap-4 text-xs font-bold text-slate-400">
                <Link href="/help" className="hover:text-slate-700" onClick={() => setMobileMenuOpen(false)}>Aide</Link>
                <span>·</span>
                <Link href="/legal" className="hover:text-slate-700" onClick={() => setMobileMenuOpen(false)}>Mentions légales</Link>
                <span>·</span>
                <Link href="/feedback" className="hover:text-slate-700" onClick={() => setMobileMenuOpen(false)}>Feedback</Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="rounded-2xl border border-slate-200 bg-white p-3 lg:hidden"><Menu size={20} /></button>
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

        <div className="px-5 py-8">{children}</div>

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
    </main>
  )
}
