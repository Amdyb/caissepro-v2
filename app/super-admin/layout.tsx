'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext, canAccess, type AdminContext, type AdminFeature } from '@/lib/superAdmin'
import {
  LayoutDashboard,
  Building2,
  Users,
  Gift,
  CreditCard,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  feature: AdminFeature
  exact?: boolean
}

const NAV: NavItem[] = [
  { label: 'Tableau de bord', href: '/super-admin', icon: LayoutDashboard, feature: 'dashboard', exact: true },
  { label: 'Businesses', href: '/super-admin/businesses', icon: Building2, feature: 'businesses' },
  { label: 'Agents', href: '/super-admin/agents', icon: Users, feature: 'agents' },
  { label: 'Parrainage', href: '/super-admin/parrainage', icon: Gift, feature: 'parrainage' },
  { label: 'Abonnements', href: '/super-admin/subscriptions', icon: CreditCard, feature: 'subscriptions' },
  { label: 'Admins', href: '/super-admin/admins', icon: ShieldCheck, feature: 'admins' },
  { label: 'Paramètres', href: '/super-admin/settings', icon: Settings, feature: 'settings' },
]

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Founder',
  admin: 'Admin',
  analyst: 'Analyste',
  agent_manager: 'Agent Manager',
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<AdminContext | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function gate() {
      const context = await getAdminContext()
      if (!active) return

      if (!context) {
        router.replace('/admin/login')
        return
      }
      if (!context.allowed) {
        router.replace('/dashboard')
        return
      }
      setCtx(context)
      setLoading(false)
    }
    gate()
    return () => {
      active = false
    }
  }, [router])

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (loading || !ctx) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Shield className="animate-pulse text-emerald-400" size={40} />
          <p className="font-black">Chargement Super Admin...</p>
        </div>
      </main>
    )
  }

  const items = NAV.filter((item) => canAccess(ctx.role, item.feature))

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">CaissePro</p>
        <h1 className="mt-1 text-2xl font-black">Super Admin</h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-black text-emerald-300">{ROLE_LABEL[ctx.role || ''] || ctx.role}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <p className="px-4 pb-2 text-[11px] font-bold text-white/30">{ctx.email}</p>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-slate-950 lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">CaissePro</p>
          <p className="text-lg font-black leading-none">Super Admin</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-slate-950">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-xl bg-white/5 p-2 text-white/70"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="lg:pl-64">{children}</div>
    </div>
  )
}
