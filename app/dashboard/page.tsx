'use client'

import AppShell from '@/components/AppShell'
import FreePlanAd from '@/components/FreePlanAd'
import { getBusinessTemplate } from '@/lib/businessTemplates'
import { getDashboardCards } from '@/lib/dashboardCards'
import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, Bell, CalendarDays, CreditCard, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Product = { id: string; name: string; stock: number | null }

type BusinessInfo = {
  id: string
  name?: string | null
  slogan?: string | null
  banner_url?: string | null
  logo_url?: string | null
  business_type?: string | null
  onboarding_completed?: boolean | null
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

function getWeekStart() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export default function DashboardPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [plan, setPlan] = useState('free')
  const [businessType, setBusinessType] = useState('retail')
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [todayTotal, setTodayTotal] = useState(0)
  const [weekTotal, setWeekTotal] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: memberships, error } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(*)')
        .eq('user_id', userData.user.id)

      if (error || !memberships || memberships.length === 0) {
        router.push('/onboarding')
        return
      }

      // Prioritize owner > admin over other roles
      const sorted = (memberships as any[]).sort((a, b) => {
        const p: Record<string, number> = { owner: 0, admin: 1 }
        return (p[a.role] ?? 2) - (p[b.role] ?? 2)
      })

      const member: any = sorted[0]
      const businessData = member.businesses as BusinessInfo

      if (!businessData?.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      const businessId = member.business_id

      setBusinessType(businessData?.business_type || 'retail')
      setBusiness(businessData)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const weekStart = getWeekStart()

      const [
        todaySalesResult,
        weekSalesResult,
        productsResult,
        debtsResult,
        subscriptionResult
      ] = await Promise.all([
        supabase
          .from('sales')
          .select('total')
          .eq('business_id', businessId)
          .gte('created_at', today.toISOString()),

        supabase
          .from('sales')
          .select('total')
          .eq('business_id', businessId)
          .gte('created_at', weekStart.toISOString()),

        supabase
          .from('products')
          .select('id,name,stock')
          .eq('business_id', businessId),

        supabase
          .from('customers')
          .select('debt_balance')
          .eq('business_id', businessId),

        supabase
          .from('subscriptions')
          .select('plan,status')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      const todayAmount = (todaySalesResult.data || []).reduce(
        (sum: number, sale: any) => sum + Number(sale.total || 0),
        0
      )

      const weekAmount = (weekSalesResult.data || []).reduce(
        (sum: number, sale: any) => sum + Number(sale.total || 0),
        0
      )

      const debtAmount = (debtsResult.data || []).reduce(
        (sum: number, customer: any) => sum + Number(customer.debt_balance || 0),
        0
      )

      const lowStock = (productsResult.data || []).filter(
        (product: any) => Number(product.stock || 0) <= 5
      )

      setTodayTotal(todayAmount)
      setWeekTotal(weekAmount)
      setTotalDebt(debtAmount)
      setLowStockCount(lowStock.length)

      setPlan(subscriptionResult.data?.plan || 'free')
      setProducts((productsResult.data || []) as Product[])

      setLoading(false)
    }

    init()
  }, [router])

  const template = getBusinessTemplate(businessType)
  const cards = getDashboardCards(businessType)

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement dashboard...</p>
      </main>
    )
  }

  const actionHref =
    businessType === 'tontine'
      ? '/tontines'
      : businessType === 'rental'
        ? '/properties'
        : '/pos'

  return (
    <AppShell title="Tableau de bord" subtitle={business?.name ? `Bienvenue sur ${business.name}` : 'Vue d\'ensemble de votre activité'}>
      <div className="mx-auto max-w-[1600px]">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 shadow-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage: `url(${business?.banner_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop'})`
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />

          <div className="relative flex flex-col gap-5 p-5 md:p-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-white backdrop-blur-xl">
                <Sparkles size={13} /> Dashboard Premium
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-white shadow-2xl">
                  {business?.logo_url ? (
                    <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store size={34} className="text-slate-400" />
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                    {business?.name || template.dashboardTitle}
                  </h1>

                  <p className="mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-white/70 md:text-base">
                    {business?.slogan || 'Pilotez votre activité avec une vue claire sur vos ventes, votre stock et vos performances.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-wide text-white/60">Plan actuel</p>
                <p className="mt-1 text-base font-black uppercase">{plan}</p>
              </div>

              <Link href={actionHref} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-600">
                Action rapide
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/sales" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Ventes aujourd’hui</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{cfa(todayTotal)}</p>
              </div>
              <CalendarDays className="text-emerald-600" size={24} />
            </div>
          </Link>

          <Link href="/sales" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Performance semaine</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{cfa(weekTotal)}</p>
              </div>
              <Sparkles className="text-emerald-600" size={24} />
            </div>
          </Link>

          <Link href="/products" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Stock critique</p>
                <p className="mt-2 text-3xl font-black text-amber-600">{lowStockCount}</p>
              </div>
              <Bell className="text-amber-500" size={24} />
            </div>
          </Link>

          <Link href="/debts" className="rounded-[2rem] border border-red-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Paiements à récupérer</p>
                <p className="mt-2 text-3xl font-black text-red-600">{cfa(totalDebt)}</p>
              </div>
              <CreditCard className="text-red-500" size={24} />
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
