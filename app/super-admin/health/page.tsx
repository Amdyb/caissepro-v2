'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext } from '@/lib/superAdmin'
import { Activity, AlertTriangle, Building2, Clock3, HeartPulse, Search, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Business = {
  id: string
  name: string | null
  slug: string | null
  business_type: string | null
  onboarding_completed: boolean | null
  online_store_enabled: boolean | null
  beta_access: boolean | null
  beta_plan: string | null
  beta_expires_at: string | null
  founding_member: boolean | null
  created_at: string
}

type MetricMap = Record<string, number>

function daysSince(date?: string | null) {
  if (!date) return 999
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function getHealthScore(business: Business, metrics: { products: number; sales: number; orders: number; feedback: number; backups: number }) {
  let score = 0
  if (business.onboarding_completed) score += 25
  if (business.online_store_enabled) score += 15
  if (business.beta_access || business.founding_member) score += 10
  if (metrics.products > 0) score += 15
  if (metrics.sales > 0 || metrics.orders > 0) score += 20
  if (metrics.feedback > 0) score += 5
  if (metrics.backups > 0) score += 10
  return Math.min(score, 100)
}

function getRiskLabel(score: number, business: Business) {
  if (!business.onboarding_completed) return { label: 'Setup incomplet', tone: 'bg-red-50 text-red-700 border-red-200' }
  if (score < 35) return { label: 'Risque élevé', tone: 'bg-red-50 text-red-700 border-red-200' }
  if (score < 65) return { label: 'À surveiller', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: 'Sain', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

function cfaDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MerchantHealthPage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [products, setProducts] = useState<MetricMap>({})
  const [sales, setSales] = useState<MetricMap>({})
  const [orders, setOrders] = useState<MetricMap>({})
  const [feedback, setFeedback] = useState<MetricMap>({})
  const [backups, setBackups] = useState<MetricMap>({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const ctx = await getAdminContext()
      if (!ctx?.allowed) {
        setAllowed(false)
        setLoading(false)
        return
      }

      setAllowed(true)

      const [businessResult, productResult, saleResult, orderResult, feedbackResult, backupResult] = await Promise.all([
        supabase.from('businesses').select('id,name,slug,business_type,onboarding_completed,online_store_enabled,beta_access,beta_plan,beta_expires_at,founding_member,created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('products').select('business_id'),
        supabase.from('sales').select('business_id'),
        supabase.from('orders').select('business_id'),
        supabase.from('merchant_feedback').select('business_id'),
        supabase.from('business_backups').select('business_id')
      ])

      if (businessResult.error) setMessage(businessResult.error.message)
      setBusinesses((businessResult.data || []) as Business[])
      setProducts(countByBusiness(productResult.data || []))
      setSales(countByBusiness(saleResult.data || []))
      setOrders(countByBusiness(orderResult.data || []))
      setFeedback(countByBusiness(feedbackResult.data || []))
      setBackups(countByBusiness(backupResult.data || []))
      setLoading(false)
    }

    init()
  }, [])

  function countByBusiness(rows: any[]) {
    return rows.reduce((acc: MetricMap, row: any) => {
      if (row.business_id) acc[row.business_id] = (acc[row.business_id] || 0) + 1
      return acc
    }, {})
  }

  const enriched = useMemo(() => {
    return businesses.map((business) => {
      const metrics = {
        products: products[business.id] || 0,
        sales: sales[business.id] || 0,
        orders: orders[business.id] || 0,
        feedback: feedback[business.id] || 0,
        backups: backups[business.id] || 0
      }
      const score = getHealthScore(business, metrics)
      return { business, metrics, score, risk: getRiskLabel(score, business) }
    })
  }, [businesses, products, sales, orders, feedback, backups])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return enriched.filter((item) => {
      const b = item.business
      const matchesQuery = !q || [b.name, b.slug, b.business_type, b.beta_plan].join(' ').toLowerCase().includes(q)
      const matchesFilter = filter === 'all'
        || (filter === 'risk' && item.score < 65)
        || (filter === 'healthy' && item.score >= 65)
        || (filter === 'incomplete' && !b.onboarding_completed)
        || (filter === 'founder' && (b.beta_access || b.founding_member))
      return matchesQuery && matchesFilter
    })
  }, [enriched, query, filter])

  const summary = useMemo(() => {
    const total = enriched.length
    const healthy = enriched.filter((item) => item.score >= 65).length
    const risk = enriched.filter((item) => item.score < 65).length
    const incomplete = enriched.filter((item) => !item.business.onboarding_completed).length
    const founder = enriched.filter((item) => item.business.beta_access || item.business.founding_member).length
    const avg = total ? Math.round(enriched.reduce((sum, item) => sum + item.score, 0) / total) : 0
    return { total, healthy, risk, incomplete, founder, avg }
  }, [enriched])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><p className="font-black">Chargement santé marchands...</p></main>

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <Shield className="mx-auto text-red-400" size={56} />
          <h1 className="mt-5 text-3xl font-black">Accès refusé</h1>
          <p className="mt-3 text-sm font-semibold text-white/60">Cette zone est réservée aux administrateurs CaissePro.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white">Retour</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 px-5 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <Link href="/super-admin" className="text-sm font-black text-emerald-300 hover:text-emerald-200">← Super Admin</Link>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-400">Intelligence Marchands</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">Tableau de Santé Marchands</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-emerald-300">Score moyen: {summary.avg}/100</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-black text-red-200">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-3 xl:grid-cols-6">
          <Stat icon={Building2} label="Boutiques" value={summary.total} />
          <Stat icon={HeartPulse} label="Sains" value={summary.healthy} tone="text-emerald-300" />
          <Stat icon={AlertTriangle} label="À risque" value={summary.risk} tone="text-red-300" />
          <Stat icon={Clock3} label="Setup incomplet" value={summary.incomplete} tone="text-amber-300" />
          <Stat icon={Shield} label="Fondateurs" value={summary.founder} tone="text-sky-300" />
          <Stat icon={TrendingUp} label="Score moyen" value={`${summary.avg}%`} tone="text-violet-300" />
        </div>

        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher marchand, slug, type..." className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-11 pr-4 font-semibold text-white outline-none placeholder:text-white/30" />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 font-black text-white outline-none">
              <option value="all">Tous marchands</option>
              <option value="risk">À risque</option>
              <option value="healthy">Sains</option>
              <option value="incomplete">Setup incomplet</option>
              <option value="founder">Fondateurs</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map(({ business, metrics, score, risk }) => (
            <div key={business.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black">{business.name || 'Boutique sans nom'}</h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${risk.tone}`}>{risk.label}</span>
                    {(business.beta_access || business.founding_member) && <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-300">Fondateur Bêta</span>}
                  </div>
                  <p className="mt-2 text-sm font-bold text-white/45">/{business.slug || 'no-slug'} · {business.business_type || 'retail'} · créé le {cfaDate(business.created_at)}</p>
                  {business.beta_expires_at && <p className="mt-1 text-xs font-black text-amber-300">Bêta expire : {cfaDate(business.beta_expires_at)}</p>}
                </div>

                <div className="min-w-[220px]">
                  <div className="mb-2 flex items-center justify-between text-xs font-black text-white/50"><span>Score Santé</span><span>{score}/100</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${score >= 65 ? 'bg-emerald-400' : score >= 35 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-5">
                <Mini label="Produits" value={metrics.products} />
                <Mini label="Ventes" value={metrics.sales} />
                <Mini label="Commandes" value={metrics.orders} />
                <Mini label="Retours" value={metrics.feedback} />
                <Mini label="Sauvegardes" value={metrics.backups} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!business.onboarding_completed && <Action label="Contacter: setup incomplet" tone="amber" />}
                {metrics.products === 0 && <Action label="Besoin d’ajouter produits" tone="red" />}
                {metrics.products > 0 && metrics.sales === 0 && metrics.orders === 0 && <Action label="Aider à faire première vente" tone="amber" />}
                {score >= 80 && <Action label="Candidat témoignage" tone="green" />}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center">
              <Activity className="mx-auto text-white/20" size={64} />
              <h2 className="mt-5 text-3xl font-black">Aucun marchand trouvé</h2>
              <p className="mt-2 text-sm font-semibold text-white/50">Essayez un autre filtre ou une autre recherche.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function Stat({ icon: Icon, label, value, tone = 'text-white' }: any) {
  return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5"><Icon className={tone} /><p className="mt-4 text-xs font-bold text-white/45">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p></div>
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs font-bold text-white/40">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>
}

function Action({ label, tone }: { label: string; tone: 'green' | 'amber' | 'red' }) {
  const colors = tone === 'green' ? 'bg-emerald-400/10 text-emerald-300 border-emerald-300/20' : tone === 'amber' ? 'bg-amber-400/10 text-amber-300 border-amber-300/20' : 'bg-red-400/10 text-red-300 border-red-300/20'
  return <span className={`rounded-full border px-4 py-2 text-xs font-black ${colors}`}>{label}</span>
}
