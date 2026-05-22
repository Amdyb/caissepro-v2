'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CreditCard,
  Package,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type SaleItem = {
  quantity: number | null
  total: number | null
  products?: {
    name: string
    cost_price: number | null
  } | null
}

type Sale = {
  id: string
  business_id: string
  cashier_id: string | null
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_method: string | null
  status: string | null
  created_at: string
  sale_items?: SaleItem[]
}

type Member = {
  user_id: string
  role: string | null
  profiles?: {
    full_name: string | null
    email: string | null
  } | null
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
      return 'Espèces'
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

function dateKey(dateString: string) {
  return dateString.slice(0, 10)
}

export default function AnalyticsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [sales, setSales] = useState<Sale[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const filteredSales = useMemo(() => {
    if (period === 'all') return sales

    const now = new Date()
    const start =
      period === 'today'
        ? startOfDay(now)
        : period === 'week'
          ? startOfWeek(now)
          : startOfMonth(now)

    return sales.filter((sale) => new Date(sale.created_at) >= start)
  }, [sales, period])

  const analytics = useMemo(() => {
    const revenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const paid = filteredSales.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0)
    const remaining = filteredSales.reduce((sum, sale) => sum + Number(sale.remaining_amount || 0), 0)
    const averageBasket = filteredSales.length > 0 ? revenue / filteredSales.length : 0

    let estimatedCost = 0
    let itemCount = 0

    const productMap = new Map<string, { name: string; qty: number; total: number }>()
    const paymentMap = new Map<string, number>()
    const cashierMap = new Map<string, { id: string; total: number; count: number }>()
    const dayMap = new Map<string, { date: string; total: number; count: number }>()

    filteredSales.forEach((sale) => {
      const payment = sale.payment_method || 'unknown'
      paymentMap.set(payment, (paymentMap.get(payment) || 0) + Number(sale.total || 0))

      const cashierId = sale.cashier_id || 'unknown'
      const cashierCurrent = cashierMap.get(cashierId) || { id: cashierId, total: 0, count: 0 }
      cashierCurrent.total += Number(sale.total || 0)
      cashierCurrent.count += 1
      cashierMap.set(cashierId, cashierCurrent)

      const dKey = dateKey(sale.created_at)
      const dayCurrent = dayMap.get(dKey) || { date: dKey, total: 0, count: 0 }
      dayCurrent.total += Number(sale.total || 0)
      dayCurrent.count += 1
      dayMap.set(dKey, dayCurrent)

      ;(sale.sale_items || []).forEach((item) => {
        const name = item.products?.name || 'Produit supprimé'
        const current = productMap.get(name) || { name, qty: 0, total: 0 }
        current.qty += Number(item.quantity || 0)
        current.total += Number(item.total || 0)
        productMap.set(name, current)

        itemCount += Number(item.quantity || 0)
        estimatedCost += Number(item.products?.cost_price || 0) * Number(item.quantity || 0)
      })
    })

    const estimatedProfit = revenue - estimatedCost

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)

    const paymentBreakdown = Array.from(paymentMap.entries())
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total)

    const cashierBreakdown = Array.from(cashierMap.values())
      .map((cashier) => {
        const member = members.find((m) => m.user_id === cashier.id)
        return {
          ...cashier,
          name: member?.profiles?.full_name || member?.profiles?.email || cashier.id.slice(0, 8)
        }
      })
      .sort((a, b) => b.total - a.total)

    const dailyRevenue = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.total), 1)

    return {
      revenue,
      paid,
      remaining,
      averageBasket,
      estimatedCost,
      estimatedProfit,
      itemCount,
      topProducts,
      paymentBreakdown,
      cashierBreakdown,
      dailyRevenue,
      maxDailyRevenue
    }
  }, [filteredSales, members])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
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

      await Promise.all([
        loadSales(member.business_id),
        loadMembers(member.business_id)
      ])

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
        cashier_id,
        total,
        paid_amount,
        remaining_amount,
        payment_method,
        status,
        created_at,
        sale_items (
          quantity,
          total,
          products (
            name,
            cost_price
          )
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as unknown as Sale[])
  }

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select(`
        user_id,
        role,
        profiles (
          full_name,
          email
        )
      `)
      .eq('business_id', id)

    if (error) {
      return
    }

    setMembers((data || []) as unknown as Member[])
  }

  async function refresh() {
    if (!businessId) return
    await Promise.all([
      loadSales(businessId),
      loadMembers(businessId)
    ])
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement analytics...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Analytics avancés
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Actualiser
            </button>

            <button
              onClick={logout}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
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
            <h2 className="text-4xl font-black tracking-tight text-slate-950">
              Intelligence commerciale
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Suivez vos ventes, profits, paiements, produits stars et performances employés.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            <button
              onClick={() => setPeriod('today')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'today' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Jour
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'week' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'month' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Mois
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'all' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Tout
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Chiffre d’affaires</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {analytics.revenue.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {filteredSales.length} vente(s)
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <TrendingUp className={analytics.estimatedProfit >= 0 ? 'text-brand-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Profit estimé</p>
            <p className={`mt-2 text-3xl font-black ${analytics.estimatedProfit >= 0 ? 'text-brand-700' : 'text-red-700'}`}>
              {analytics.estimatedProfit.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              CA - coût produits
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShoppingCart className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Panier moyen</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {analytics.averageBasket.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {analytics.itemCount} article(s) vendus
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <Wallet className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Reste à encaisser</p>
            <p className="mt-2 text-3xl font-black text-red-700">
              {analytics.remaining.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Client Doit / impayés
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-950">Revenus par jour</h3>
              <p className="text-sm text-slate-500">Graphique simple des ventes sur la période.</p>
            </div>
            <BarChart3 className="text-brand-600" />
          </div>

          {analytics.dailyRevenue.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <CalendarDays className="mx-auto text-slate-400" size={42} />
              <h3 className="mt-4 text-xl font-black text-slate-950">Aucune vente</h3>
              <p className="mt-2 text-slate-500">Les revenus apparaîtront ici après encaissement.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.dailyRevenue.map((day) => {
                const width = Math.max((day.total / analytics.maxDailyRevenue) * 100, 4)

                return (
                  <div key={day.date}>
                    <div className="mb-2 flex items-center justify-between text-sm font-bold">
                      <span className="text-slate-600">{new Date(day.date).toLocaleDateString('fr-FR')}</span>
                      <span className="text-slate-950">{day.total.toLocaleString('fr-FR')} CFA • {day.count} vente(s)</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Top produits</h3>
                <p className="text-sm text-slate-500">Les produits les plus vendus.</p>
              </div>
              <Package className="text-brand-600" />
            </div>

            {analytics.topProducts.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Aucun produit vendu sur cette période.
              </p>
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
                <h3 className="text-2xl font-black text-slate-950">Méthodes de paiement</h3>
                <p className="text-sm text-slate-500">Cash, Wave, Orange Money, carte, crédit.</p>
              </div>
              <CreditCard className="text-brand-600" />
            </div>

            {analytics.paymentBreakdown.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Aucun paiement sur cette période.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.paymentBreakdown.map((payment) => {
                  const percent = analytics.revenue > 0 ? (payment.total / analytics.revenue) * 100 : 0

                  return (
                    <div key={payment.method} className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-black text-slate-950">{paymentLabel(payment.method)}</p>
                        <p className="font-black text-slate-950">{payment.total.toLocaleString('fr-FR')} CFA</p>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">{percent.toFixed(1)}%</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-950">Performance employés</h3>
              <p className="text-sm text-slate-500">Ventes par caissier / utilisateur.</p>
            </div>
            <Users className="text-brand-600" />
          </div>

          {analytics.cashierBreakdown.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Aucune donnée employé.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {analytics.cashierBreakdown.map((cashier, index) => (
                <div key={cashier.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-950">#{index + 1} {cashier.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{cashier.count} vente(s)</p>
                    </div>
                    <p className="text-xl font-black text-brand-700">
                      {cashier.total.toLocaleString('fr-FR')} CFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
