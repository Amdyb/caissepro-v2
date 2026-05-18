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

  return (
    <AppShell
      title="Gestion commerciale"
      subtitle={`Template: ${template.label}`}
    >
      <div className="mx-auto max-w-[1600px]">
        Dashboard upgraded successfully.
      </div>
    </AppShell>
  )
}
