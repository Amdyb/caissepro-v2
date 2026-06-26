'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { resolveSelectedBusiness } from '@/lib/storefront'
import { AlertTriangle, Crown, Lightbulb, Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Metrics = {
  businessName: string
  period: string
  revenue: number
  expenses: number
  netProfit: number
  totalDebt: number
  debtRatioPct: number
  stockCostValue: number
  stockRetailValue: number
  cashAtHand: number
  salesCount: number
  lowStock: { name: string; stock: number }[]
  bestMarginProduct: { name: string; margin: number } | null
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

const cfa = (n: number) => `${Math.round(Number(n || 0)).toLocaleString('fr-FR')} CFA`

export default function CoachPage() {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string>('free')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [advice, setAdvice] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const { businessId, shops } = await resolveSelectedBusiness()
      if (!businessId) { setLoading(false); return }
      setBusinessId(businessId)

      const businessName = shops.find((s) => s.id === businessId)?.name || 'Ma boutique'

      // Plan (premium gate)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const currentPlan = sub?.plan || 'free'
      setPlan(currentPlan)

      if (currentPlan !== 'premium') { setLoading(false); return }

      const monthStart = startOfMonthISO()
      const [salesRes, expRes, prodRes, custRes, shiftRes] = await Promise.all([
        supabase.from('sales').select('total,paid_amount,payment_method,created_at').eq('business_id', businessId).gte('created_at', monthStart).limit(2000),
        supabase.from('expenses').select('amount,expense_date').eq('business_id', businessId).gte('expense_date', monthStart).limit(2000),
        supabase.from('products').select('name,stock,cost_price,sell_price').eq('business_id', businessId).is('deleted_at', null),
        supabase.from('customers').select('debt_balance').eq('business_id', businessId),
        supabase.from('cash_register_shifts').select('opening_cash,cash_sales,status').eq('business_id', businessId).eq('status', 'open'),
      ])

      const sales = salesRes.data || []
      const expenses = expRes.data || []
      const products = prodRes.data || []
      const customers = custRes.data || []
      const shifts = shiftRes.data || []

      const revenue = sales.reduce((s, r: any) => s + Number(r.total || 0), 0)
      const totalExpenses = expenses.reduce((s, r: any) => s + Number(r.amount || 0), 0)
      const totalDebt = customers.reduce((s, r: any) => s + Number(r.debt_balance || 0), 0)
      const stockCostValue = products.reduce((s, p: any) => s + Number(p.cost_price || 0) * Number(p.stock || 0), 0)
      const stockRetailValue = products.reduce((s, p: any) => s + Number(p.sell_price || 0) * Number(p.stock || 0), 0)
      const cashFromShifts = shifts.reduce((s, sh: any) => s + Number(sh.opening_cash || 0) + Number(sh.cash_sales || 0), 0)
      const cashSales = sales.filter((r: any) => r.payment_method === 'cash').reduce((s, r: any) => s + Number(r.paid_amount || r.total || 0), 0)
      const cashAtHand = shifts.length > 0 ? cashFromShifts : cashSales
      const lowStock = products.filter((p: any) => Number(p.stock || 0) <= 5).map((p: any) => ({ name: p.name, stock: Number(p.stock || 0) }))

      let bestMarginProduct: { name: string; margin: number } | null = null
      for (const p of products as any[]) {
        const margin = Number(p.sell_price || 0) - Number(p.cost_price || 0)
        if (Number(p.stock || 0) > 0 && (!bestMarginProduct || margin > bestMarginProduct.margin)) {
          bestMarginProduct = { name: p.name, margin }
        }
      }

      setMetrics({
        businessName,
        period: 'ce mois',
        revenue,
        expenses: totalExpenses,
        netProfit: revenue - totalExpenses,
        totalDebt,
        debtRatioPct: revenue > 0 ? Math.round((totalDebt / revenue) * 100) : 0,
        stockCostValue,
        stockRetailValue,
        cashAtHand,
        salesCount: sales.length,
        lowStock,
        bestMarginProduct,
      })
      setLoading(false)
    }
    init()
  }, [])

  async function analyze() {
    if (!metrics || analyzing) return
    setAnalyzing(true)
    setError('')
    setAdvice('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ ...metrics, businessId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Analyse impossible pour le moment.'); return }
      setAdvice(data.advice || 'Aucune recommandation générée.')
    } catch {
      setError('Connexion impossible. Réessayez.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Coach IA" subtitle="Votre conseiller d'affaires intelligent.">
        <div className="mx-auto max-w-3xl"><p className="font-bold text-slate-600">Chargement...</p></div>
      </AppShell>
    )
  }

  // Non-premium: upgrade prompt
  if (plan !== 'premium') {
    return (
      <AppShell title="Coach IA" subtitle="Votre conseiller d'affaires intelligent.">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Crown className="text-amber-600" size={30} />
            </div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              <Sparkles size={12} /> Premium
            </div>
            <h2 className="text-3xl font-black text-slate-950">Coach IA réservé au plan Premium</h2>
            <p className="mt-3 text-slate-600">
              Obtenez une analyse intelligente de votre boutique : ventes, stock, dettes et dépenses — avec des recommandations personnalisées générées par l&apos;IA.
            </p>
            <Link href="/upgrade" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white hover:bg-emerald-700">
              <Crown size={18} /> Passer au plan Premium
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Coach IA" subtitle="Votre conseiller d'affaires intelligent.">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white"><Sparkles size={22} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">{metrics?.businessName}</h2>
                <p className="text-sm font-semibold text-slate-500">Analyse de la performance — {metrics?.period}</p>
              </div>
            </div>
          </div>

          {metrics && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label="Chiffre d'affaires" value={cfa(metrics.revenue)} />
              <Stat label="Bénéfice net" value={cfa(metrics.netProfit)} accent={metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'} />
              <Stat label="Dettes clients" value={cfa(metrics.totalDebt)} accent="text-red-700" />
              <Stat label="Cash en caisse" value={cfa(metrics.cashAtHand)} />
              <Stat label="Valeur stock (coût)" value={cfa(metrics.stockCostValue)} />
              <Stat label="Stock bas" value={`${metrics.lowStock.length} produit(s)`} accent={metrics.lowStock.length > 0 ? 'text-amber-700' : 'text-slate-950'} />
            </div>
          )}

          <button
            onClick={analyze}
            disabled={analyzing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-base font-black text-white hover:bg-violet-700 disabled:opacity-60"
          >
            <Sparkles size={18} /> {analyzing ? 'Analyse en cours...' : 'Analyser ma boutique'}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={18} />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {advice && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600"><Lightbulb /></div>
              <h3 className="text-xl font-black text-slate-950">Recommandations du Coach IA</h3>
            </div>
            <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">{advice}</div>
          </div>
        )}

        <Link href="/reports" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
          <TrendingUp size={16} /> Voir le rapport détaillé
        </Link>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, accent = 'text-slate-950' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${accent}`}>{value}</p>
    </div>
  )
}
