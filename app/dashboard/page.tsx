'use client'

import AppShell from '@/components/AppShell'
import FreePlanAd from '@/components/FreePlanAd'
import { getBusinessTemplate } from '@/lib/businessTemplates'
import { getDashboardCards } from '@/lib/dashboardCards'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Sale = { id: string; total: number | null; created_at: string }
type Product = { id: string; name: string; stock: number | null }
type Customer = { id: string; full_name: string; debt_balance: number | null }

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
        .select('business_id, businesses(business_type)')
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
      setBusinessType(member.businesses?.business_type || 'retail')

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
    const todayTotal = sales.filter((sale) => new Date(sale.created_at) >= today).reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const weekTotal = sales.filter((sale) => new Date(sale.created_at) >= weekStart).reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5)
    const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)
    return { todayTotal, weekTotal, lowStock, totalDebt }
  }, [sales, products, customers])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement dashboard...</p></main>

  const actionHref = businessType === 'tontine' ? '/tontines' : businessType === 'rental' ? '/properties' : '/pos'

  return (
    <AppShell title={template.dashboardTitle} subtitle={`Template: ${template.label}`} action={<Link href={actionHref} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">Action rapide</Link>}>
      <div className="mx-auto max-w-[1600px]">
        {message && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}
        {plan === 'free' && <div className="mb-8"><FreePlanAd title="Votre business mérite plus" text="Passez à Business pour débloquer plus d’automatisations, de rapports et de templates premium." /></div>}

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/sales" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"><p className="text-sm font-bold text-slate-500">Aujourd’hui</p><p className="mt-2 text-3xl font-black text-slate-950">{cfa(stats.todayTotal)}</p></Link>
          <Link href="/sales" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"><p className="text-sm font-bold text-slate-500">Cette semaine</p><p className="mt-2 text-3xl font-black text-slate-950">{cfa(stats.weekTotal)}</p></Link>
          <Link href="/products" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"><p className="text-sm font-bold text-slate-500">Alertes</p><p className="mt-2 text-3xl font-black text-amber-600">{stats.lowStock.length}</p></Link>
          <Link href="/debts" className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm transition hover:shadow-lg"><p className="text-sm font-bold text-slate-500">À récupérer</p><p className="mt-2 text-3xl font-black text-red-600">{cfa(stats.totalDebt)}</p></Link>
        </div>

        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-2xl font-black text-slate-950">Modules actifs pour {template.label}</h3>
          <div className="mt-4 flex flex-wrap gap-2">{template.modules.map((module) => <span key={module} className="rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm">{module}</span>)}</div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return <Link key={card.href + card.title} href={card.href} className={`group rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${card.primary ? 'border-emerald-200 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-950'}`}><div className={`mb-6 inline-flex rounded-2xl p-4 ${card.primary ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'}`}><Icon size={26} /></div><h3 className="text-2xl font-black">{card.title}</h3><p className={`mt-2 text-sm font-semibold ${card.primary ? 'text-white/80' : 'text-slate-500'}`}>{card.text}</p></Link>
          })}
        </div>
      </div>
    </AppShell>
  )
}
