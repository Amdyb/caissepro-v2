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
  UserRoundCog,
  Wallet,
  WalletCards
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

type Expense = {
  id: string
  title: string
  amount: number | null
  category: string | null
  expense_date: string | null
  created_at: string
}

type Shift = {
  id: string
  status: string | null
  opening_cash: number | null
  opened_at: string
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
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
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

    const todayExpenses = expenses.filter((expense) => new Date(expense.expense_date || expense.created_at) >= todayStart)
    const weekExpenses = expenses.filter((expense) => new Date(expense.expense_date || expense.created_at) >= weekStart)
    const monthExpenses = expenses.filter((expense) => new Date(expense.expense_date || expense.created_at) >= monthStart)

    const sumSales = (items: Sale[]) => items.reduce((total, sale) => total + Number(sale.total || 0), 0)
    const sumExpenses = (items: Expense[]) => items.reduce((total, expense) => total + Number(expense.amount || 0), 0)

    const todayRevenue = sumSales(todaySales)
    const weekRevenue = sumSales(weekSales)
    const monthRevenue = sumSales(monthSales)

    const todayExpenseTotal = sumExpenses(todayExpenses)
    const weekExpenseTotal = sumExpenses(weekExpenses)
    const monthExpenseTotal = sumExpenses(monthExpenses)

    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5)
    const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)
    const customersWithDebt = customers.filter((customer) => Number(customer.debt_balance || 0) > 0)
    const openShift = shifts.find((shift) => shift.status === 'open') || null

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
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todayExpenseTotal,
      weekExpenseTotal,
      monthExpenseTotal,
      todayNet: todayRevenue - todayExpenseTotal,
      weekNet: weekRevenue - weekExpenseTotal,
      monthNet: monthRevenue - monthExpenseTotal,
      todayCount: todaySales.length,
      weekCount: weekSales.length,
      monthCount: monthSales.length,
      lowStock,
      totalDebt,
      customersWithDebt,
      openShift,
      topProducts
    }
  }, [sales, products, customers, expenses, shifts])

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
        loadExpenses(member.business_id),
        loadShifts(member.business_id),
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

  async function loadExpenses(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('id, title, amount, category, expense_date, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMessage(error.message)
      return
    }

    setExpenses((data || []) as Expense[])
  }

  async function loadShifts(id: string) {
    const { data, error } = await supabase
      .from('cash_register_shifts')
      .select('id, status, opening_cash, opened_at')
      .eq('business_id', id)
      .order('opened_at', { ascending: false })
      .limit(10)

    if (error) {
      setMessage(error.message)
      return
    }

    setShifts((data || []) as Shift[])
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
      text: 'Stock, images, prix et code-barres.',
      href: '/products',
      icon: Package,
      value: `${products.length} produit(s)`
    },
    {
      title: 'Ventes',
      text: 'Historique, reçus et WhatsApp.',
      href: '/sales',
      icon: ReceiptText,
      value: `${sales.length} vente(s)`
    },
    {
      title: 'Clients',
      text: 'Fidélité et base clients.',
      href: '/customers',
      icon: Users,
      value: `${customers.length} client(s)`
    },
    {
      title: 'Client Doit',
      text: 'Crédits et paiements clients.',
      href: '/debts',
      icon: HandCoins,
      value: `${analytics.totalDebt.toLocaleString('fr-FR')} CFA dû`
    },
    {
      title: 'Dépenses',
      text: 'Charges, achats et profits.',
      href: '/expenses',
      icon: Wallet,
      value: `${analytics.monthExpenseTotal.toLocaleString('fr-FR')} CFA/mois`
    },
    {
      title: 'Caisse journalière',
      text: 'Ouverture et fermeture caisse.',
      href: '/register-shifts',
      icon: WalletCards,
      value: analytics.openShift ? 'Ouverte' : 'Fermée'
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
              <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Centre de contrôle</p>
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
            <h2 className="text-4xl font-black tracking-tight text-slate-950">Command Center</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Suivez vos ventes, vos dépenses, vos dettes clients, votre caisse et votre stock en un seul endroit.
            </p>
          </div>

          <Link href="/pos" className="rounded-2xl bg-brand-600 px-6 py-4 text-center text-sm font-black text-white hover:bg-brand-700">
            Ouvrir la caisse
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Ventes aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.todayRevenue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{analytics.todayCount} vente(s)</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dépenses aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.todayExpenseTotal.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">net: {analytics.todayNet.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <TrendingUp className={analytics.monthNet >= 0 ? 'text-brand-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Profit net du mois</p>
            <p className={`mt-2 text-3xl font-black ${analytics.monthNet >= 0 ? 'text-slate-950' : 'text-red-700'}`}>
              {analytics.monthNet.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              ventes - dépenses
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <HandCoins className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Client Doit</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.totalDebt.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-red-600">{analytics.customersWithDebt.length} client(s)</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
                  <h2 className="text-2xl font-black text-slate-950">Résumé business</h2>
                  <p className="text-sm text-slate-500">Situation actuelle.</p>
                </div>
                <CalendarDays className="text-brand-600" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-600">Caisse journalière</span>
                  <span className={`font-black ${analytics.openShift ? 'text-brand-700' : 'text-slate-500'}`}>
                    {analytics.openShift ? 'Ouverte' : 'Fermée'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-600">Stock bas</span>
                  <span className="font-black text-red-600">{analytics.lowStock.length}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-600">Dépenses du mois</span>
                  <span className="font-black text-slate-950">{analytics.monthExpenseTotal.toLocaleString('fr-FR')} CFA</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-600">Ventes du mois</span>
                  <span className="font-black text-slate-950">{analytics.monthRevenue.toLocaleString('fr-FR')} CFA</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Alertes</h2>
                  <p className="text-sm text-slate-500">Points à surveiller.</p>
                </div>
                <AlertTriangle className="text-red-600" />
              </div>

              <div className="space-y-3">
                {analytics.lowStock.length > 0 && (
                  <Link href="/products" className="block rounded-2xl bg-red-50 p-4">
                    <p className="font-black text-red-700">Stock bas</p>
                    <p className="text-sm font-semibold text-red-600">{analytics.lowStock.length} produit(s) à réapprovisionner.</p>
                  </Link>
                )}

                {analytics.totalDebt > 0 && (
                  <Link href="/debts" className="block rounded-2xl bg-yellow-50 p-4">
                    <p className="font-black text-yellow-800">Client Doit</p>
                    <p className="text-sm font-semibold text-yellow-700">{analytics.totalDebt.toLocaleString('fr-FR')} CFA en attente.</p>
                  </Link>
                )}

                {!analytics.openShift && (
                  <Link href="/register-shifts" className="block rounded-2xl bg-slate-50 p-4">
                    <p className="font-black text-slate-950">Caisse fermée</p>
                    <p className="text-sm font-semibold text-slate-500">Ouvrir la caisse avant de commencer la journée.</p>
                  </Link>
                )}

                {analytics.lowStock.length === 0 && analytics.totalDebt === 0 && analytics.openShift && (
                  <p className="rounded-2xl bg-brand-50 p-4 font-bold text-brand-700">Tout semble en ordre.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
