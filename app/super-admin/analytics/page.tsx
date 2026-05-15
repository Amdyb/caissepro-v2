'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { BarChart3, CreditCard, Store, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAILS = ['infos@dakarvapes.com']

export default function SuperAdminAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      router.push('/login')
      return
    }

    if (!SUPER_ADMIN_EMAILS.includes(userData.user.email || '')) {
      router.push('/dashboard')
      return
    }

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
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement analytics...</p></main>
  }

  const cards = [
    { title: 'Revenue', value: `${Number(stats.revenue).toLocaleString('fr-FR')} CFA`, icon: CreditCard },
    { title: 'Businesses', value: stats.businesses, icon: Store },
    { title: 'Subscriptions', value: stats.activeSubscriptions, icon: Users },
    { title: 'Sales', value: stats.totalSales, icon: TrendingUp }
  ]

  return (
    <AppShell title="Analytics" subtitle="Vue globale de la plateforme.">
      <div className="mx-auto max-w-7xl pb-20">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="text-emerald-600" />
                <p className="mt-5 text-sm font-black uppercase text-slate-500">{card.title}</p>
                <p className="mt-2 text-4xl font-black text-slate-950">{card.value}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-emerald-600" />
            <h2 className="text-3xl font-black text-slate-950">Top Businesses</h2>
          </div>

          <div className="mt-6 space-y-4">
            {businesses.slice(0, 10).map((business) => (
              <div key={business.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{business.name}</p>
                    <p className="text-sm font-bold text-slate-500">/{business.slug || 'no-slug'}</p>
                  </div>

                  <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                    {business.status || 'active'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
