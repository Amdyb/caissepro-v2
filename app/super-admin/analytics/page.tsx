'use client'

import { supabase } from '@/lib/supabaseClient'
import { BarChart3, CreditCard, Store, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export default function SuperAdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const [businessResult, salesResult, subscriptionsResult] = await Promise.all([
      supabase.from('businesses').select('*').limit(500),
      supabase.from('sales').select('*').limit(5000),
      supabase.from('subscriptions').select('*').limit(1000)
    ])

    setBusinesses(businessResult.data || [])
    setSales(salesResult.data || [])
    setSubscriptions(subscriptionsResult.data || [])
    setLoading(false)
  }

  const stats = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)

    return {
      revenue,
      businesses: businesses.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
      totalSales: sales.length
    }
  }, [businesses, sales, subscriptions])

  if (loading) {
    return <div className="px-5 py-10 font-black text-white/70">Chargement statistiques...</div>
  }

  const cards = [
    { title: 'Revenus', value: `${Number(stats.revenue).toLocaleString('fr-FR')} CFA`, icon: CreditCard },
    { title: 'Boutiques', value: stats.businesses, icon: Store },
    { title: 'Abonnements', value: stats.activeSubscriptions, icon: Users },
    { title: 'Ventes', value: stats.totalSales, icon: TrendingUp }
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/15 p-3">
          <BarChart3 className="text-emerald-300" size={26} />
        </div>
        <div>
          <h1 className="text-3xl font-black">Statistiques</h1>
          <p className="text-sm font-semibold text-white/50">Vue globale de la plateforme.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <Icon className="text-emerald-300" />
              <p className="mt-5 text-sm font-black uppercase text-white/50">{card.title}</p>
              <p className="mt-2 text-4xl font-black text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-emerald-300" />
          <h2 className="text-3xl font-black text-white">Top Boutiques</h2>
        </div>

        <div className="mt-6 space-y-4">
          {businesses.slice(0, 10).map((business) => (
            <div key={business.id} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-white">{business.name}</p>
                  <p className="text-sm font-bold text-white/50">/{business.slug || 'no-slug'}</p>
                </div>

                <div className="rounded-2xl bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-300">
                  {business.status || 'active'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
