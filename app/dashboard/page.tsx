'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  HandCoins,
  Package,
  ReceiptText,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  UserRoundCog
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Product = {
  id: string
  name: string
  stock: number | null
  sell_price: number | null
}

type SaleItem = {
  quantity: number | null
  total: number | null
  products?: {
    name: string
  } | null
}

type Sale = {
  id: string
  total: number | null
  payment_method: string | null
  status: string | null
  created_at: string
  sale_items?: SaleItem[]
}

type Customer = {
  id: string
  debt_balance: number | null
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
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

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [membersCount, setMembersCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const analytics = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    const todaySales = sales.filter((sale) => new Date(sale.created_at) >= todayStart)
    const weekSales = sales.filter((sale) => new Date(sale.created_at) >= weekStart)
    const monthSales = sales.filter((sale) => new Date(sale.created_at) >= monthStart)

    const sum = (items: Sale[]) => items.reduce((total, sale) => total + Number(sale.total || 0), 0)
    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5)
    const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)
    const customersWithDebt = customers.filter((customer) => Number(customer.debt_balance || 0) > 0)

    const topMap = new Map<string, { name: string; qty: number; total: number }>()

    sales.forEach((sale) => {
      ;(sale.sale_items || []).forEach((item) => {
        const name = item.products?.name || 'Produit supprimé'
        const current = topMap.get(name) || { name, qty: 0, total: 0 }
        current.qty += Number(item.quantity || 0)
        current.total += Number(item.total || 0)
        topMap.set(name, current)
      })
    })

    const topProducts = Array.from(topMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return {
      todayRevenue: sum(todaySales),
      weekRevenue: sum(weekSales),
      monthRevenue: sum(monthSales),
      todayCount: todaySales.length,
      weekCount: weekSales.length,
      monthCount: monthSales.length,
      lowStock,
      totalDebt,
      customersWithDebt,
      topProducts
    }
  }, [sales, products, customers])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setEmail(userData.user.email || null)

      const { data: membership, error: membershipError } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(name, currency)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (membershipError || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadProducts(member.business_id),
        loadSales(member.business_id),
        loadCustomers(member.business_id),
        loadMembersCount(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock, sell_price')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        total,
        payment_method,
        status,
        created_at,
        sale_items (
          quantity,
          total,
          products (
            name
          )
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as unknown as Sale[])
  }

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, debt_balance')
      .eq('business_id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as Customer[])
  }

  async function loadMembersCount(id: string) {
    const { count } = await supabase
      .from('business_members')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', id)

    setMembersCount(count || 1)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navCards = [
    {
      title: 'Caisse',
      text: 'Encaisser une vente rapidement.',
      href: '/pos',
      icon: ShoppingCart,
      value: `${analytics.todayRevenue.toLocaleString('fr-FR')} CFA aujourd’hui`,
      primary: true
    },
    {
      title: 'Produits',
      text: 'Gérer le stock, les images et les prix.',
      href: '/products',
      icon: Package,
      value: `${products.length} produit(s)`
    },
    {
      title: 'Ventes',
      text: 'Voir l’historique et les reçus.',
      href: '/sales',
      icon: ReceiptText,
      value: `${sales.length} vente(s)`
    },
    {
      title: 'Clients',
      text: 'Base clients et fidélité.',
      href: '/customers',
      icon: Users,
      value: `${customers.length} client(s)`
    },
    {
      title: 'Client Doit',
      text: 'Suivre les dettes et paiements.',
      href: '/debts',
      icon: HandCoins,
      value: `${analytics.totalDebt.toLocaleString('fr-FR')} CFA dû`
    },
    {
      title: 'Employés',
      text: 'Rôles et permissions.',
      href: '/staff',
      icon: UserRoundCog,
      value: `${membersCount} utilisateur(s)`
    }
  ]

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement du tableau de bord...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Store />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Tableau de bord</p>
              <h1 className="text-2xl font-black text-slate-950">{businessName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">{email}</span>
            <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950">Centre de contrôle</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Accédez rapidement aux modules essentiels de votre boutique.
            </p>
          </div>

          <Link href="/pos" className="rounded-2xl bg-brand-600 px-6 py-4 text-center text-sm font-black text-white hover:bg-brand-700">
            Ouvrir la caisse
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {navCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                  card.primary
                    ? 'border-brand-200 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-950'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`rounded-2xl p-3 ${card.primary ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-700'}`}>
                    <Icon />
                  </div>
                  <p className={`rounded-full px-3 py-1 text-xs font-black ${card.primary ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {card.value}
                  </p>
                </div>

                <h3 className="mt-6 text-2xl font-black">{card.title}</h3>
                <p className={`mt-2 text-sm font-semibold ${card.primary ? 'text-white/80' : 'text-slate-500'}`}>
                  {card.text}
                </p>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.todayRevenue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{analytics.todayCount} vente(s)</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <CalendarDays className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Cette semaine</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.weekRevenue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{analytics.weekCount} vente(s)</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <TrendingUp className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Ce mois</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.monthRevenue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{analytics.monthCount} vente(s)</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <HandCoins className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Client Doit</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.totalDebt.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-red-600">{analytics.customersWithDebt.length} client(s)</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Ventes récentes</h2>
                <p className="text-sm text-slate-500">Les dernières transactions enregistrées.</p>
              </div>
              <BarChart3 className="text-brand-600" />
            </div>

            {sales.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <ShoppingCart className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucune vente</h3>
                <p className="mt-2 text-slate-500">Les ventes apparaîtront ici après encaissement.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.slice(0, 6).map((sale) => {
                  const date = new Date(sale.created_at)
                  return (
                    <Link key={sale.id} href={`/sales/${sale.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                      <div>
                        <p className="font-black text-slate-950">Vente #{sale.id.slice(0, 8)}</p>
                        <p className="text-sm font-semibold text-slate-500">
                          {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {paymentLabel(sale.payment_method)}
                        </p>
                      </div>
                      <p className="text-lg font-black text-slate-950">{Number(sale.total || 0).toLocaleString('fr-FR')} CFA</p>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Top produits</h2>
                  <p className="text-sm text-slate-500">Classés par quantité vendue.</p>
                </div>
                <TrendingUp className="text-brand-600" />
              </div>

              {analytics.topProducts.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Aucune donnée pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topProducts.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                      <div>
                        <p className="font-black text-slate-950">#{index + 1} {item.name}</p>
                        <p className="text-sm font-semibold text-slate-500">{item.qty} vendu(s)</p>
                      </div>
                      <p className="font-black text-slate-950">{item.total.toLocaleString('fr-FR')} CFA</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Stock bas</h2>
                  <p className="text-sm text-slate-500">Produits à réapprovisionner.</p>
                </div>
                <AlertTriangle className="text-red-600" />
              </div>

              {analytics.lowStock.length === 0 ? (
                <p className="rounded-2xl bg-brand-50 p-5 text-sm font-bold text-brand-700">Aucun stock bas.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.lowStock.slice(0, 6).map((product) => (
                    <Link key={product.id} href="/products" className="flex items-center justify-between rounded-2xl bg-red-50 p-4">
                      <div>
                        <p className="font-black text-slate-950">{product.name}</p>
                        <p className="text-sm font-semibold text-red-600">Stock restant: {product.stock || 0}</p>
                      </div>
                      <p className="font-black text-slate-950">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
