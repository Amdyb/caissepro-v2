'use client'

import AppShell from '@/components/AppShell'
import FreePlanAd from '@/components/FreePlanAd'
import { getBusinessTemplate } from '@/lib/businessTemplates'
import { getDashboardCards } from '@/lib/dashboardCards'
import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, Bell, CalendarDays, CreditCard, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Sale = { id: string; total: number | null; created_at: string }
type Product = { id: string; name: string; stock: number | null }
type Customer = { id: string; full_name: string; debt_balance: number | null }

type BusinessInfo = {
  id: string
  name?: string | null
  slogan?: string | null
  banner_url?: string | null
  logo_url?: string | null
  business_type?: string | null
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
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plan, setPlan] = useState('free')
  const [businessType, setBusinessType] = useState('retail')
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(*)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const member: any = membership
      const businessId = member.business_id
      const businessData = member.businesses as BusinessInfo

      setBusinessType(businessData?.business_type || 'retail')
      setBusiness(businessData)

      const [salesResult, productsResult, customersResult, subscriptionResult] = await Promise.all([
        supabase.from('sales').select('id,total,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('id,name,stock').eq('business_id', businessId).order('stock', { ascending: true }).limit(200),
        supabase.from('customers').select('id,full_name,debt_balance').eq('business_id', businessId).limit(200),
        supabase.from('subscriptions').select('plan,status').eq('business_id', businessId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
      ])

      if (salesResult.error) setMessage(salesResult.error.message)
      if (productsResult.error) setMessage(productsResult.error.message)
      if (customersResult.error) setMessage(customersResult.error.message)

      setPlan(subscriptionResult.data?.plan || 'free')
      setSales((salesResult.data || []) as Sale[])
      setProducts((productsResult.data || []) as Product[])
      setCustomers((customersResult.data || []) as Customer[])
      setLoading(false)
    }

    init()
  }, [router])

  const template = getBusinessTemplate(businessType)
  const cards = getDashboardCards(businessType)

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = getWeekStart()

    const todayTotal = sales
      .filter((sale) => new Date(sale.created_at) >= today)
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0)

    const weekTotal = sales
      .filter((sale) => new Date(sale.created_at) >= weekStart)
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0)

    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5)

    const totalDebt = customers.reduce(
      (sum, customer) => sum + Number(customer.debt_balance || 0),
      0
    )

    return { todayTotal, weekTotal, lowStock, totalDebt }
  }, [sales, products, customers])

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
    <AppShell
      title="Gestion commerciale"
      subtitle={`Template: ${template.label}`}
    >
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

          <div className="relative flex flex-col gap-8 p-6 md:p-10 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white backdrop-blur-xl">
                <Sparkles size={14} />
                Dashboard Premium
              </div>

              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
                  {business?.logo_url ? (
                    <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store size={40} className="text-slate-400" />
                  )}
                </div>

                <div>
                  <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                    {business?.name || template.dashboardTitle}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold text-white/70 md:text-lg">
                    {business?.slogan || 'Pilotez votre activité avec une vue claire sur vos ventes, votre stock et vos performances.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-wide text-white/60">
                  Plan actuel
                </p>
                <p className="mt-1 text-lg font-black uppercase">
                  {plan}
                </p>
              </div>

              <Link
                href={actionHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                Action rapide
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/sales" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Ventes aujourd’hui
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {cfa(stats.todayTotal)}
                </p>
              </div>
              <CalendarDays className="text-emerald-600" size={24} />
            </div>
          </Link>

          <Link href="/sales" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Performance semaine
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {cfa(stats.weekTotal)}
                </p>
              </div>
              <Sparkles className="text-emerald-600" size={24} />
            </div>
          </Link>

          <Link href="/products" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Stock critique
                </p>
                <p className="mt-2 text-3xl font-black text-amber-600">
                  {stats.lowStock.length}
                </p>
              </div>
              <Bell className="text-amber-500" size={24} />
            </div>
          </Link>

          <Link href="/debts" className="rounded-[2rem] border border-red-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Paiements à récupérer
                </p>
                <p className="mt-2 text-3xl font-black text-red-600">
                  {cfa(stats.totalDebt)}
                </p>
              </div>
              <CreditCard className="text-red-500" size={24} />
            </div>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <Link
                key={card.href + card.title}
                href={card.href}
                className={`group rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${card.primary
                  ? 'border-emerald-200 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white text-slate-950'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`mb-4 inline-flex rounded-2xl p-3 ${card.primary
                      ? 'bg-white/15 text-white'
                      : 'bg-emerald-50 text-emerald-700'
                      }`}>
                      <Icon size={24} />
                    </div>

                    <h3 className="text-xl font-black">
                      {card.title}
                    </h3>

                    <p className={`mt-2 text-sm font-semibold ${card.primary ? 'text-white/80' : 'text-slate-500'}`}>
                      {card.text}
                    </p>
                  </div>

                  <ArrowRight className={`${card.primary ? 'text-white/70' : 'text-slate-400'} transition group-hover:translate-x-1`} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
