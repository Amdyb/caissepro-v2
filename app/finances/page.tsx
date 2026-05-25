'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { ArrowDown, ArrowUp, DollarSign, Package, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Summary = {
  totalRevenue: number
  totalExpenses: number
  stockValue: number
  netProfit: number
  capitalGlobal: number
  totalDebt: number
}

function cfa(v: number) {
  return v.toLocaleString('fr-FR') + ' CFA'
}

function startOf(period: 'today' | 'week' | 'month' | 'all'): string | null {
  const d = new Date()
  if (period === 'today') { d.setHours(0, 0, 0, 0); return d.toISOString() }
  if (period === 'week') {
    const diff = d.getDay() === 0 ? 6 : d.getDay() - 1
    d.setDate(d.getDate() - diff); d.setHours(0, 0, 0, 0); return d.toISOString()
  }
  if (period === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString() }
  return null
}

export default function FinancesPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalExpenses: 0, stockValue: 0, netProfit: 0, capitalGlobal: 0, totalDebt: 0 })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) { setLoading(false); return }
      setBusinessId(membership.business_id)
      await loadSummary(membership.business_id, period)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (businessId) loadSummary(businessId, period)
  }, [period, businessId])

  async function loadSummary(id: string, p: typeof period) {
    const from = startOf(p)

    const salesQuery = supabase.from('sales').select('total, paid_amount').eq('business_id', id)
    const expQuery = supabase.from('expenses').select('amount').eq('business_id', id)

    if (from) {
      salesQuery.gte('created_at', from)
      expQuery.gte('expense_date', from.slice(0, 10))
    }

    const [salesRes, expRes, productsRes, debtRes] = await Promise.all([
      salesQuery,
      expQuery,
      supabase.from('products').select('cost_price, stock').eq('business_id', id),
      supabase.from('customers').select('debt_balance').eq('business_id', id)
    ])

    const totalRevenue = (salesRes.data || []).reduce((s, x) => s + Number(x.total || 0), 0)
    const totalExpenses = (expRes.data || []).reduce((s, x) => s + Number(x.amount || 0), 0)
    const stockValue = (productsRes.data || []).reduce((s, x) => s + Number(x.cost_price || 0) * Number(x.stock || 0), 0)
    const totalDebt = (debtRes.data || []).reduce((s, x) => s + Number(x.debt_balance || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    const capitalGlobal = stockValue + totalRevenue - totalExpenses

    setSummary({ totalRevenue, totalExpenses, stockValue, netProfit, capitalGlobal, totalDebt })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-bold text-slate-600 dark:text-slate-400">Chargement finances...</p>
      </main>
    )
  }

  const periodLabel = period === 'today' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'tout'

  return (
    <AppShell title="Finances" subtitle="Capital global, profits et vue financière complète.">
      <div className="mx-auto max-w-4xl">

        {/* Period filter */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {(['today', 'week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-xl px-5 py-3 text-sm font-black transition ${period === p ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
              >
                {p === 'today' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Tout'}
              </button>
            ))}
          </div>
        </div>

        {/* Capital global hero */}
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-white/60">Capital Global</p>
              <p className="text-xs font-semibold text-white/40">Stock + Revenus - Dépenses ({periodLabel})</p>
            </div>
          </div>
          <p className="mt-5 text-5xl font-black tracking-tight">
            {cfa(summary.capitalGlobal)}
          </p>
          <div className="mt-4 flex gap-4 text-sm font-bold text-white/60">
            <span>Stock: {cfa(summary.stockValue)}</span>
            <span>•</span>
            <span>Revenus: {cfa(summary.totalRevenue)}</span>
            <span>•</span>
            <span>Charges: {cfa(summary.totalExpenses)}</span>
          </div>
        </div>

        {/* KPI grid */}
        <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <TrendingUp className="text-emerald-600" />
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/40">
                <ArrowUp size={11} /> Revenus
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Chiffre d'affaires</p>
            <p className="mt-1 text-3xl font-black text-emerald-700">{cfa(summary.totalRevenue)}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">Ventes encaissées sur la période</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <TrendingDown className="text-red-500" />
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-900/40">
                <ArrowDown size={11} /> Charges
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Dépenses</p>
            <p className="mt-1 text-3xl font-black text-red-700">{cfa(summary.totalExpenses)}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">Transport, salaires, loyer...</p>
          </div>

          <div className={`rounded-3xl border p-6 shadow-sm dark:bg-slate-800 ${summary.netProfit >= 0 ? 'border-emerald-200 bg-white dark:border-emerald-900' : 'border-red-200 bg-white dark:border-red-900'}`}>
            <div className="flex items-center justify-between">
              <Wallet className={summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${summary.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40' : 'bg-red-50 text-red-700 dark:bg-red-900/40'}`}>
                {summary.netProfit >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {summary.netProfit >= 0 ? 'Bénéfice' : 'Déficit'}
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Profit net</p>
            <p className={`mt-1 text-3xl font-black ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {summary.netProfit >= 0 ? '+' : ''}{cfa(summary.netProfit)}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">Revenus - Dépenses</p>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm dark:border-violet-900 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <Package className="text-violet-600" />
              <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700 dark:bg-violet-900/40">
                Stock actuel
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Valeur du stock</p>
            <p className="mt-1 text-3xl font-black text-violet-700">{cfa(summary.stockValue)}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">Coût d'achat × quantité en stock</p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <Receipt className="text-amber-600" />
              {summary.totalDebt > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/40">
                  <ArrowUp size={11} /> À récupérer
                </span>
              )}
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Créances clients</p>
            <p className="mt-1 text-3xl font-black text-amber-700">{cfa(summary.totalDebt)}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">Soldes impayés — tous clients</p>
          </div>

          <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-sm dark:border-teal-900 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <DollarSign className="text-teal-600" />
              {summary.totalRevenue > 0 && (
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${summary.netProfit >= 0 ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40' : 'bg-red-50 text-red-700'}`}>
                  {summary.netProfit >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {summary.totalRevenue > 0 ? Math.round((summary.netProfit / summary.totalRevenue) * 100) + '%' : '—'}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Marge brute</p>
            <p className="mt-1 text-3xl font-black text-teal-700">
              {summary.totalRevenue > 0
                ? Math.round((summary.netProfit / summary.totalRevenue) * 100) + '%'
                : '—'}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">Profit net / Chiffre d'affaires</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
