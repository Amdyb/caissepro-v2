'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, BarChart3, Boxes, Crown, Package, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { resolveSelectedBusiness } from '@/lib/storefront'

type Product = {
  id: string
  name: string
  stock: number | null
  cost_price: number | null
  sell_price: number | null
}

// Flattened sale line used to compute per-product sales over the period.
// unit_price is the real price charged at sale time (captures POS discounts /
// price overrides) — written by every sale path (POS, checkout, vente rapide).
type SoldItem = { created_at: string; product_id: string | null; quantity: number | null; unit_price: number | null }

type Row = {
  id: string
  name: string
  unitsSold: number
  revenue: number
  profit: number
  marginPct: number
  stock: number
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

export default function ProductPerformancePage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [soldItems, setSoldItems] = useState<SoldItem[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const periodStart = useMemo(() => {
    if (period === 'today') return todayISO()
    if (period === 'week') return startOfWeekISO()
    if (period === 'month') return startOfMonthISO()
    return startOfYearISO()
  }, [period])

  const rows = useMemo<Row[]>(() => {
    const costMap = new Map(products.map((p) => [p.id, Number(p.cost_price || 0)]))
    const nameMap = new Map(products.map((p) => [p.id, p.name]))
    const stockMap = new Map(products.map((p) => [p.id, Number(p.stock || 0)]))

    // Accumulate real units and revenue per product from the sale lines.
    // Revenue uses the price actually charged (unit_price), so historical
    // discounts/overrides are reflected — not the product's current sell_price.
    const unitsByProduct = new Map<string, number>()
    const revenueByProduct = new Map<string, number>()
    soldItems
      .filter((it) => it.product_id && (it.created_at || '').slice(0, 10) >= periodStart)
      .forEach((it) => {
        const qty = Number(it.quantity || 0)
        unitsByProduct.set(it.product_id!, (unitsByProduct.get(it.product_id!) || 0) + qty)
        revenueByProduct.set(it.product_id!, (revenueByProduct.get(it.product_id!) || 0) + qty * Number(it.unit_price || 0))
      })

    // Build one row per known product so slow movers (zero sales) are visible too.
    return products.map((p) => {
      const unitsSold = unitsByProduct.get(p.id) || 0
      const revenue = revenueByProduct.get(p.id) || 0
      // Cost is not snapshotted on sale_items, so the cost side uses the current
      // product cost_price (best available); revenue/margin still reflect the
      // real per-line sale price.
      const cost = unitsSold * (costMap.get(p.id) || 0)
      const profit = revenue - cost
      const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
      return {
        id: p.id,
        name: nameMap.get(p.id) || 'Produit',
        unitsSold,
        revenue,
        profit,
        marginPct,
        stock: stockMap.get(p.id) || 0,
      }
    }).sort((a, b) => b.unitsSold - a.unitsSold || b.profit - a.profit)
  }, [products, soldItems, periodStart])

  const summary = useMemo(() => {
    const totalUnits = rows.reduce((s, r) => s + r.unitsSold, 0)
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
    const totalProfit = rows.reduce((s, r) => s + r.profit, 0)
    const sellers = rows.filter((r) => r.unitsSold > 0)
    const bestSeller = sellers[0] || null
    const topProfit = [...sellers].sort((a, b) => b.profit - a.profit)[0] || null
    const slowMovers = rows.filter((r) => r.unitsSold === 0 && r.stock > 0)
    return { totalUnits, totalRevenue, totalProfit, bestSeller, topProfit, slowMovers, sellersCount: sellers.length }
  }, [rows])

  useEffect(() => {
    async function init() {
      // Respect the shop selected in the dashboard / storefront switcher.
      const { userId, businessId } = await resolveSelectedBusiness()
      if (!userId) { router.push('/login'); return }
      if (!businessId) { setMessage('Aucune boutique trouvée.'); setLoading(false); return }

      setBusinessId(businessId)

      await Promise.all([
        loadProducts(businessId),
        loadSoldItems(businessId),
      ])

      setLoading(false)
    }
    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data } = await supabase
      .from('products')
      .select('id,name,stock,cost_price,sell_price')
      .eq('business_id', id)
      .is('deleted_at', null)
    setProducts((data || []) as Product[])
  }

  // Sale lines joined to their sale (for date + business scoping).
  // Wrapped defensively — if the embedded query is unavailable, sales fall to 0.
  async function loadSoldItems(id: string) {
    try {
      const { data } = await supabase
        .from('sale_items')
        .select('quantity, unit_price, product_id, sales!inner(created_at, business_id)')
        .eq('sales.business_id', id)
        .limit(8000)
      const items: SoldItem[] = (data || []).map((row: any) => ({
        created_at: row.sales?.created_at || '',
        product_id: row.product_id ?? null,
        quantity: row.quantity ?? 0,
        unit_price: row.unit_price ?? 0,
      }))
      setSoldItems(items)
    } catch {
      setSoldItems([])
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-bold text-slate-600 dark:text-slate-300">Chargement des performances...</p>
      </main>
    )
  }

  const maxUnits = Math.max(...rows.map((r) => r.unitsSold), 1)

  return (
    <AppShell title="Performance produits" subtitle="Meilleures ventes, marges et produits dormants.">
      <div className="mx-auto max-w-[1600px]">
        {message && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300">{message}</div>}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Performance produits</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Quels produits se vendent le mieux et rapportent le plus.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-xl px-4 py-3 text-sm font-black ${period === p ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                {p === 'today' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Boxes className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Unités vendues</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{summary.totalUnits.toLocaleString('fr-FR')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{summary.sellersCount} produit(s) vendu(s)</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <BarChart3 className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Chiffre d&apos;affaires</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{summary.totalRevenue.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">sur la période</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <TrendingUp className={summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Bénéfice (marge)</p>
            <p className={`mt-2 text-3xl font-black ${summary.totalProfit >= 0 ? 'text-slate-950 dark:text-white' : 'text-red-700 dark:text-red-300'}`}>{summary.totalProfit.toLocaleString('fr-FR')} CFA</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">prix de vente − coût d&apos;achat</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Crown className="text-amber-500" />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Meilleure vente</p>
            <p className="mt-2 truncate text-2xl font-black text-slate-950 dark:text-white">{summary.bestSeller ? summary.bestSeller.name : '—'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{summary.bestSeller ? `${summary.bestSeller.unitsSold} unité(s)` : 'aucune vente'}</p>
          </div>
        </div>

        {/* Ranking table */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">Classement des produits</h3>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="text-slate-300" size={40} />
              <p className="font-bold text-slate-500 dark:text-slate-400">Aucun produit trouvé.</p>
              <Link href="/products/new" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">Ajouter un produit</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-400 dark:border-slate-700">
                    <th className="py-3 pr-3">Produit</th>
                    <th className="py-3 px-3 text-right">Vendus</th>
                    <th className="py-3 px-3 text-right">CA</th>
                    <th className="py-3 px-3 text-right">Bénéfice</th>
                    <th className="py-3 px-3 text-right">Marge</th>
                    <th className="py-3 pl-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/60">
                      <td className="py-3 pr-3">
                        <p className="font-black text-slate-900 dark:text-white">{r.name}</p>
                        <div className="mt-1.5 h-1.5 w-full max-w-[180px] rounded-full bg-slate-100 dark:bg-slate-700">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.round((r.unitsSold / maxUnits) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">{r.unitsSold.toLocaleString('fr-FR')}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700 dark:text-slate-200">{r.revenue.toLocaleString('fr-FR')}</td>
                      <td className={`py-3 px-3 text-right font-bold ${r.profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>{r.profit.toLocaleString('fr-FR')}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-500 dark:text-slate-400">{r.unitsSold > 0 ? `${r.marginPct}%` : '—'}</td>
                      <td className={`py-3 pl-3 text-right font-bold ${r.stock <= 5 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>{r.stock.toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Slow movers */}
        {summary.slowMovers.length > 0 && (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="text-amber-600" size={20} />
              <h3 className="text-lg font-black text-amber-900 dark:text-amber-200">Produits dormants ({summary.slowMovers.length})</h3>
            </div>
            <p className="mb-4 text-sm font-semibold text-amber-800/80 dark:text-amber-300/80">En stock mais aucune vente sur la période — pensez à une promotion ou à déstocker.</p>
            <div className="flex flex-wrap gap-2">
              {summary.slowMovers.slice(0, 30).map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm font-bold text-amber-900 dark:border-amber-900/50 dark:bg-slate-800 dark:text-amber-200">
                  <AlertTriangle size={13} className="text-amber-500" /> {r.name} · {r.stock} en stock
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
