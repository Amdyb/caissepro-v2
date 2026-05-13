'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Eye,
  HandCoins,
  LayoutDashboard,
  Menu,
  Package,
  PackagePlus,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Sale = {
  id: string
  business_id: string
  customer_id: string | null
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_method: string | null
  status: string | null
  created_at: string
  customers?: {
    full_name: string | null
    phone: string | null
  } | null
}

function paymentLabel(method: string | null) {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'wave':
      return 'Wave'
    case 'orange_money':
      return 'Orange Money'
    case 'card':
      return 'Carte'
    case 'credit':
      return 'Client Doit'
    default:
      return method || 'Non précisé'
  }
}

function paymentBadge(method: string | null) {
  switch (method) {
    case 'cash':
      return 'bg-emerald-50 text-emerald-700'
    case 'wave':
      return 'bg-sky-50 text-sky-700'
    case 'orange_money':
      return 'bg-orange-50 text-orange-700'
    case 'card':
      return 'bg-slate-100 text-slate-700'
    case 'credit':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function SalesPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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

  const filteredSales = useMemo(() => {
    const q = search.toLowerCase().trim()

    const now = new Date()
    const start = new Date()

    if (period === 'today') {
      start.setHours(0, 0, 0, 0)
    }

    if (period === 'week') {
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(start.getDate() - diff)
      start.setHours(0, 0, 0, 0)
    }

    if (period === 'month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
    }

    return sales.filter((sale) => {
      const dateOk = period === 'all' || new Date(sale.created_at) >= start
      const searchOk =
        !q ||
        sale.id.toLowerCase().includes(q) ||
        (sale.customers?.full_name || '').toLowerCase().includes(q) ||
        (sale.customers?.phone || '').toLowerCase().includes(q) ||
        (sale.payment_method || '').toLowerCase().includes(q)

      return dateOk && searchOk
    })
  }, [sales, search, period])

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const totalPaid = filteredSales.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0)
  const totalRemaining = filteredSales.reduce((sum, sale) => sum + Number(sale.remaining_amount || 0), 0)
  const averageSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name, logo_url)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      setBusinessLogo(member.businesses?.logo_url || null)

      await loadSales(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        business_id,
        customer_id,
        total,
        paid_amount,
        remaining_amount,
        payment_method,
        status,
        created_at,
        customers (
          full_name,
          phone
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as unknown as Sale[])
  }

  async function refresh() {
    if (!businessId) return
    await loadSales(businessId)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des ventes...</p>
      </main>
    )
  }

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
                  <img src={businessLogo} alt={businessName} className="h-full w-full object-contain bg-white p-1" />
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
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon size={21} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={logout}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              {sidebarOpen ? 'Déconnexion' : 'X'}
            </button>
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

              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Historique des ventes</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Suivez les ventes, paiements et reçus.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={refresh}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Actualiser
              </button>

              <Link
                href="/pos"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Nouvelle vente
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-5 py-8">
          {message && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <ReceiptText className="text-emerald-600" />
              <p className="mt-5 text-sm font-bold text-slate-500">Ventes</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{filteredSales.length}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Wallet className="text-emerald-600" />
              <p className="mt-5 text-sm font-bold text-slate-500">Chiffre d’affaires</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{totalRevenue.toLocaleString('fr-FR')} CFA</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <CreditCard className="text-emerald-600" />
              <p className="mt-5 text-sm font-bold text-slate-500">Payé</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{totalPaid.toLocaleString('fr-FR')} CFA</p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <HandCoins className="text-red-600" />
              <p className="mt-5 text-sm font-bold text-slate-500">Reste à payer</p>
              <p className="mt-2 text-3xl font-black text-red-700">{totalRemaining.toLocaleString('fr-FR')} CFA</p>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-lg flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                placeholder="Rechercher par client, téléphone, paiement ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {(['today', 'week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-xl px-4 py-3 text-sm font-black ${
                    period === p
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p === 'today' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Tout'}
                </button>
              ))}
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
              <ReceiptText className="mx-auto text-slate-400" size={48} />
              <h3 className="mt-4 text-2xl font-black">Aucune vente</h3>
              <p className="mt-2 text-slate-500">Les ventes apparaîtront ici après encaissement.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden grid-cols-[1.2fr_.9fr_.8fr_.8fr_.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 lg:grid">
                <div>Vente</div>
                <div>Client</div>
                <div>Paiement</div>
                <div>Total</div>
                <div>Reste</div>
                <div></div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const date = new Date(sale.created_at)

                  return (
                    <div key={sale.id} className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_.9fr_.8fr_.8fr_.8fr_auto] lg:items-center">
                      <div>
                        <p className="font-black text-slate-950">Vente #{sale.id.slice(0, 8)}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-slate-950">{sale.customers?.full_name || 'Client comptoir'}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{sale.customers?.phone || 'Sans téléphone'}</p>
                      </div>

                      <div>
                        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${paymentBadge(sale.payment_method)}`}>
                          {paymentLabel(sale.payment_method)}
                        </span>
                      </div>

                      <div>
                        <p className="text-lg font-black text-slate-950">{Number(sale.total || 0).toLocaleString('fr-FR')} CFA</p>
                      </div>

                      <div>
                        <p className={`text-lg font-black ${Number(sale.remaining_amount || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {Number(sale.remaining_amount || 0).toLocaleString('fr-FR')} CFA
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
                        >
                          <Eye size={16} />
                          Voir
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Panier moyen</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{averageSale.toLocaleString('fr-FR')} CFA</p>
          </div>
        </section>
      </section>
    </main>
  )
}
