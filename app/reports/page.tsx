'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Banknote, Boxes, CalendarDays, CreditCard, HandCoins, Layers, Lightbulb, Package, Printer, ReceiptText, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { resolveSelectedBusiness } from '@/lib/storefront'

type Sale = {
  id: string
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_method: string | null
  created_at: string
}

type Expense = {
  id: string
  amount: number | null
  category: string | null
  expense_date: string | null
}

type Product = {
  id: string
  name: string
  stock: number | null
  cost_price: number | null
  sell_price: number | null
}

type Shift = {
  id: string
  opening_cash: number | null
  cash_sales: number | null
  status: string | null
}

// Flattened sale line used to compute cost of goods sold for the period.
type CogsItem = { created_at: string; product_id: string | null; quantity: number | null }

type Customer = {
  id: string
  debt_balance: number | null
}

type DailyReport = {
  id: string
  report_date: string
  total_sales: number | null
  total_transactions: number | null
  total_expenses: number | null
  total_dispenses: number | null
  net_revenue: number | null
  cash_sales: number | null
  wave_sales: number | null
  orange_money_sales: number | null
  other_sales: number | null
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

function startOfWeekISO() {
  const d = new Date()
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - diff)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function startOfYearISO() {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
}

function paymentLabel(method: string | null) {
  switch (method) {
    case 'cash': return 'Espèces'
    case 'wave': return 'Wave'
    case 'orange_money': return 'Orange Money'
    case 'card': return 'Carte'
    case 'credit': return 'Client Doit'
    default: return method || 'Non précisé'
  }
}

function BarChart({ data, color = 'emerald' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    sky: 'bg-sky-500'
  }
  const bar = colorMap[color] || 'bg-emerald-500'

  return (
    <div className="flex h-36 items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <p className="truncate text-[9px] font-bold text-slate-400" style={{ maxWidth: '100%' }}>
            {d.value > 0 ? `${Math.round(d.value / 1000)}k` : ''}
          </p>
          <div
            className={`w-full rounded-t-lg ${bar} transition-all`}
            style={{ height: `${Math.max((d.value / max) * 112, d.value > 0 ? 4 : 0)}px` }}
          />
          <p className="truncate text-[9px] font-black text-slate-500" style={{ maxWidth: '100%' }}>{d.label}</p>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [cogsItems, setCogsItems] = useState<CogsItem[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const periodStart = useMemo(() => {
    if (period === 'today') return todayISO()
    if (period === 'week') return startOfWeekISO()
    if (period === 'month') return startOfMonthISO()
    return startOfYearISO()
  }, [period])

  const report = useMemo(() => {
    const periodSales = sales.filter((s) => s.created_at.slice(0, 10) >= periodStart)
    const periodExpenses = expenses.filter((e) => (e.expense_date || '') >= periodStart)

    const totalSales = periodSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const totalPaid = periodSales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0)
    const totalRemaining = periodSales.reduce((sum, s) => sum + Number(s.remaining_amount || 0), 0)
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const netProfit = totalSales - totalExpenses

    const paymentBreakdown = periodSales.reduce<Record<string, number>>((acc, s) => {
      const key = s.payment_method || 'unknown'
      acc[key] = (acc[key] || 0) + Number(s.total || 0)
      return acc
    }, {})

    const expenseBreakdown = periodExpenses.reduce<Record<string, number>>((acc, e) => {
      const key = e.category || 'Autre'
      acc[key] = (acc[key] || 0) + Number(e.amount || 0)
      return acc
    }, {})

    const lowStock = products.filter((p) => Number(p.stock || 0) <= 5)
    const totalDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance || 0), 0)

    // Stock valuation (current stock, not period-dependent)
    const stockCostValue = products.reduce((sum, p) => sum + Number(p.cost_price || 0) * Number(p.stock || 0), 0)
    const stockRetailValue = products.reduce((sum, p) => sum + Number(p.sell_price || 0) * Number(p.stock || 0), 0)

    // Cash at hand: open shift(s) opening cash + cash sales; fallback to period cash sales
    const cashFromShifts = shifts.reduce((sum, s) => sum + Number(s.opening_cash || 0) + Number(s.cash_sales || 0), 0)
    const periodCashSales = periodSales.filter((s) => s.payment_method === 'cash').reduce((sum, s) => sum + Number(s.paid_amount || s.total || 0), 0)
    const cashAtHand = shifts.length > 0 ? cashFromShifts : periodCashSales

    // Cost of goods sold for the period (sum of qty × product cost)
    const costMap = new Map(products.map((p) => [p.id, Number(p.cost_price || 0)]))
    const cogs = cogsItems
      .filter((it) => (it.created_at || '').slice(0, 10) >= periodStart)
      .reduce((sum, it) => sum + Number(it.quantity || 0) * (costMap.get(it.product_id || '') || 0), 0)

    const revenue = totalSales
    const netProfitFull = revenue - totalExpenses - cogs

    // Most profitable product over the period (units sold × unit margin)
    const sellMap = new Map(products.map((p) => [p.id, Number(p.sell_price || 0)]))
    const nameMap = new Map(products.map((p) => [p.id, p.name]))
    const profitByProduct = new Map<string, number>()
    cogsItems
      .filter((it) => (it.created_at || '').slice(0, 10) >= periodStart && it.product_id)
      .forEach((it) => {
        const margin = (sellMap.get(it.product_id!) || 0) - (costMap.get(it.product_id!) || 0)
        profitByProduct.set(it.product_id!, (profitByProduct.get(it.product_id!) || 0) + margin * Number(it.quantity || 0))
      })
    let topPid = ''
    let topProfit = -Infinity
    Array.from(profitByProduct.entries()).forEach(([pid, profit]) => {
      if (profit > topProfit) { topProfit = profit; topPid = pid }
    })
    const topProduct: { name: string; profit: number } | null = topPid ? { name: nameMap.get(topPid) || 'Produit', profit: topProfit } : null

    // Rule-based recommendations (mirrors the AI coach, always available)
    const recommendations: string[] = []
    if (totalDebt > 0 && revenue > 0) {
      const pct = Math.round((totalDebt / revenue) * 100)
      if (pct >= 20) recommendations.push(`Vos dettes clients représentent ${pct}% de votre chiffre d'affaires — pensez à relancer vos clients débiteurs.`)
    }
    if (lowStock.length > 0) {
      recommendations.push(`${lowStock.length} produit(s) en stock bas — réapprovisionnez avant la rupture : ${lowStock.slice(0, 3).map((p) => p.name).join(', ')}.`)
    }
    if (revenue > 0 && totalExpenses > 0) {
      const pct = Math.round((totalExpenses / revenue) * 100)
      if (pct >= 50) recommendations.push(`Vos dépenses représentent ${pct}% de votre chiffre d'affaires — identifiez les postes à optimiser.`)
    }
    if (topProduct && topProduct.profit > 0) {
      recommendations.push(`Votre produit le plus rentable sur cette période est « ${topProduct.name} » — mettez-le en avant.`)
    }
    if (netProfitFull < 0) {
      recommendations.push(`Votre bénéfice net est négatif sur cette période — réduisez les dépenses ou augmentez vos marges.`)
    }

    return { periodSales, periodExpenses, totalSales, totalPaid, totalRemaining, totalExpenses, netProfit, paymentBreakdown, expenseBreakdown, lowStock, totalDebt, stockCostValue, stockRetailValue, cashAtHand, cogs, revenue, netProfitFull, topProduct, recommendations }
  }, [sales, expenses, products, customers, shifts, cogsItems, periodStart])

  const chartData = useMemo(() => {
    const periodReports = dailyReports.filter((r) => r.report_date >= periodStart)

    if (periodReports.length === 0) return { salesBars: [], expenseBars: [], netBars: [] }

    let grouped: { label: string; sales: number; expenses: number; net: number }[] = []

    if (period === 'today' || period === 'week') {
      grouped = periodReports.slice(0, 7).reverse().map((r) => ({
        label: new Date(r.report_date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        sales: Number(r.total_sales || 0),
        expenses: Number(r.total_expenses || 0),
        net: Number(r.net_revenue || 0)
      }))
    } else if (period === 'month') {
      grouped = periodReports.slice(0, 31).reverse().map((r) => ({
        label: new Date(r.report_date).getDate().toString(),
        sales: Number(r.total_sales || 0),
        expenses: Number(r.total_expenses || 0),
        net: Number(r.net_revenue || 0)
      }))
    } else {
      const byMonth: Record<string, { sales: number; expenses: number; net: number }> = {}
      periodReports.forEach((r) => {
        const m = r.report_date.slice(0, 7)
        if (!byMonth[m]) byMonth[m] = { sales: 0, expenses: 0, net: 0 }
        byMonth[m].sales += Number(r.total_sales || 0)
        byMonth[m].expenses += Number(r.total_expenses || 0)
        byMonth[m].net += Number(r.net_revenue || 0)
      })
      grouped = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([m, v]) => ({
        label: new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
        ...v
      }))
    }

    return {
      salesBars: grouped.map((g) => ({ label: g.label, value: g.sales })),
      expenseBars: grouped.map((g) => ({ label: g.label, value: g.expenses })),
      netBars: grouped.map((g) => ({ label: g.label, value: Math.max(g.net, 0) }))
    }
  }, [dailyReports, period, periodStart])

  useEffect(() => {
    async function init() {
      // Respect the shop selected in the dashboard / storefront switcher.
      const { userId, businessId } = await resolveSelectedBusiness()
      if (!userId) { router.push('/login'); return }
      if (!businessId) { setMessage('Aucune boutique trouvée.'); setLoading(false); return }

      setBusinessId(businessId)

      await Promise.all([
        loadSales(businessId),
        loadExpenses(businessId),
        loadProducts(businessId),
        loadCustomers(businessId),
        loadShifts(businessId),
        loadCogs(businessId),
        loadDailyReports(businessId)
      ])

      setLoading(false)
    }
    init()
  }, [router])

  async function loadSales(id: string) {
    const { data } = await supabase.from('sales').select('id,total,paid_amount,remaining_amount,payment_method,created_at').eq('business_id', id).order('created_at', { ascending: false }).limit(1000)
    setSales((data || []) as Sale[])
  }

  async function loadExpenses(id: string) {
    const { data } = await supabase.from('expenses').select('id,amount,category,expense_date').eq('business_id', id).order('expense_date', { ascending: false }).limit(1000)
    setExpenses((data || []) as Expense[])
  }

  async function loadProducts(id: string) {
    const { data } = await supabase.from('products').select('id,name,stock,cost_price,sell_price').eq('business_id', id).is('deleted_at', null)
    setProducts((data || []) as Product[])
  }

  async function loadCustomers(id: string) {
    const { data } = await supabase.from('customers').select('id,debt_balance').eq('business_id', id)
    setCustomers((data || []) as Customer[])
  }

  async function loadShifts(id: string) {
    const { data } = await supabase.from('cash_register_shifts').select('id,opening_cash,cash_sales,status').eq('business_id', id).eq('status', 'open')
    setShifts((data || []) as Shift[])
  }

  // Cost of goods sold: sale_items joined to their sale (for date + scoping).
  // Wrapped defensively — if the embedded query is unavailable, COGS falls to 0.
  async function loadCogs(id: string) {
    try {
      const { data } = await supabase
        .from('sale_items')
        .select('quantity, product_id, sales!inner(created_at, business_id)')
        .eq('sales.business_id', id)
        .limit(8000)
      const items: CogsItem[] = (data || []).map((row: any) => ({
        created_at: row.sales?.created_at || '',
        product_id: row.product_id ?? null,
        quantity: row.quantity ?? 0,
      }))
      setCogsItems(items)
    } catch {
      setCogsItems([])
    }
  }

  async function loadDailyReports(id: string) {
    const yearAgo = new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()).toISOString().slice(0, 10)
    const { data } = await supabase.from('daily_reports').select('*').eq('business_id', id).gte('report_date', yearAgo).order('report_date', { ascending: false }).limit(400)
    setDailyReports((data || []) as DailyReport[])
  }

  const action = (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
      <Printer size={16} /> Imprimer
    </button>
  )

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des rapports...</p>
      </main>
    )
  }

  const hasDailyData = chartData.salesBars.length > 0

  return (
    <AppShell title="Rapports" subtitle="Ventes, dépenses, profits et alertes stock." action={action}>
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
      <div className="mx-auto max-w-[1600px]">
        {message && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Centre de rapports</h2>
            <p className="mt-1 text-slate-500">Résumé des ventes, dépenses, profits et paiements.</p>
          </div>
          <div className="no-print rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-xl px-4 py-3 text-sm font-black ${period === p ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {p === 'today' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Chiffre d&apos;affaires</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{report.revenue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{report.periodSales.length} vente(s)</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <TrendingUp className={report.netProfitFull >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Bénéfice Net</p>
            <p className={`mt-2 text-3xl font-black ${report.netProfitFull >= 0 ? 'text-slate-950' : 'text-red-700'}`}>{report.netProfitFull.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">CA − dépenses − coût marchandise</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Banknote className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Cash en Caisse</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{report.cashAtHand.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{shifts.length > 0 ? 'caisse ouverte' : 'ventes espèces (période)'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dépenses</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{report.totalExpenses.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{report.periodExpenses.length} dépense(s)</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Boxes className="text-sky-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Valeur Marchandise</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{report.stockCostValue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">coût d&apos;achat du stock</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Layers className="text-violet-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Valeur Estimée</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{report.stockRetailValue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">valeur de vente du stock</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <HandCoins className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dettes Clients</p>
            <p className="mt-2 text-3xl font-black text-red-700">{report.totalDebt.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">dette totale clients</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Package className="text-amber-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Coût Marchandise Vendue</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{report.cogs.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">coût des produits vendus</p>
          </div>
        </div>

        {hasDailyData && (
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Ventes</h3>
                  <p className="text-xs font-semibold text-slate-400">par période</p>
                </div>
                <ReceiptText className="text-emerald-600" size={20} />
              </div>
              <BarChart data={chartData.salesBars} color="emerald" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Dépenses</h3>
                  <p className="text-xs font-semibold text-slate-400">par période</p>
                </div>
                <Wallet className="text-red-600" size={20} />
              </div>
              <BarChart data={chartData.expenseBars} color="red" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Revenu net</h3>
                  <p className="text-xs font-semibold text-slate-400">par période</p>
                </div>
                <TrendingUp className="text-sky-600" size={20} />
              </div>
              <BarChart data={chartData.netBars} color="sky" />
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Paiements</h3>
                <p className="text-sm text-slate-500">Répartition par méthode.</p>
              </div>
              <CreditCard className="text-emerald-600" />
            </div>
            <div className="space-y-3">
              {Object.keys(report.paymentBreakdown).length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Aucune vente sur cette période.</p>
              ) : (
                Object.entries(report.paymentBreakdown).map(([method, total]) => {
                  const pct = report.totalSales > 0 ? Math.round((Number(total) / report.totalSales) * 100) : 0
                  return (
                    <div key={method} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Banknote className="text-emerald-600" size={18} />
                          <p className="font-black text-slate-950">{paymentLabel(method)}</p>
                        </div>
                        <p className="font-black text-slate-950">{Number(total).toLocaleString('fr-FR')} CFA</p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Dépenses par catégorie</h3>
                <p className="text-sm text-slate-500">Où part l'argent.</p>
              </div>
              <CalendarDays className="text-red-600" />
            </div>
            <div className="space-y-3">
              {Object.keys(report.expenseBreakdown).length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Aucune dépense sur cette période.</p>
              ) : (
                Object.entries(report.expenseBreakdown).map(([category, total]) => {
                  const pct = report.totalExpenses > 0 ? Math.round((Number(total) / report.totalExpenses) * 100) : 0
                  return (
                    <div key={category} className="rounded-2xl bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-slate-950">{category}</p>
                        <p className="font-black text-red-700">{Number(total).toLocaleString('fr-FR')} CFA</p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-red-100">
                        <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Résumé encaissement</h3>
                <p className="text-sm text-slate-500">Payé vs restant.</p>
              </div>
              <Wallet className="text-emerald-600" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm font-bold text-emerald-700">Montant payé</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{report.totalPaid.toLocaleString('fr-FR')} CFA</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-sm font-bold text-red-700">Reste à payer</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{report.totalRemaining.toLocaleString('fr-FR')} CFA</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Stock bas</h3>
                <p className="text-sm text-slate-500">Produits à réapprovisionner.</p>
              </div>
              <AlertTriangle className="text-red-600" />
            </div>
            {report.lowStock.length === 0 ? (
              <p className="rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">Aucun stock bas.</p>
            ) : (
              <div className="space-y-3">
                {report.lowStock.slice(0, 8).map((product) => (
                  <Link key={product.id} href="/products" className="flex items-center justify-between rounded-2xl bg-red-50 p-4 hover:bg-red-100">
                    <div className="flex items-center gap-3">
                      <Package className="text-red-600" size={18} />
                      <p className="font-black text-slate-950">{product.name}</p>
                    </div>
                    <p className="font-black text-red-700">Stock: {product.stock || 0}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations summary + Coach IA */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Lightbulb /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-950">Recommandations</h3>
                <p className="text-sm text-slate-500">Conseils générés à partir de vos données.</p>
              </div>
            </div>
            <Link href="/coach" className="no-print inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Sparkles size={16} /> Coach IA
            </Link>
          </div>
          {report.recommendations.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">Tout va bien — aucune alerte particulière sur cette période.</p>
          ) : (
            <div className="space-y-3">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                  <Lightbulb className="mt-0.5 shrink-0 text-amber-600" size={18} />
                  <p className="text-sm font-semibold text-slate-700">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
