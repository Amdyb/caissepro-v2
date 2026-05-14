'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarClock,
  HandCoins,
  LinkIcon,
  Package,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet
} from 'lucide-react'

type Sale = {
  id: string
  total: number | null
  created_at: string
}

type Product = {
  id: string
  name: string
  stock: number | null
}

type Customer = {
  id: string
  full_name: string
  debt_balance: number | null
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
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const cards = [
    { title: 'Caisse POS', text: 'Ouvrir la caisse et vendre.', href: '/pos', icon: ShoppingCart, primary: true },
    { title: 'Produits', text: 'Inventaire, photos, prix et stock.', href: '/products', icon: Package },
    { title: 'Ventes', text: 'Historique, reçus et factures.', href: '/sales', icon: ReceiptText },
    { title: 'Clients', text: 'Fidélité, contacts et achats.', href: '/customers', icon: Users },
    { title: 'Client Doit', text: 'Dettes clients et remboursements.', href: '/debts', icon: HandCoins },
    { title: 'Liens paiement', text: 'Wave, Orange Money, carte et paiements manuels.', href: '/payment-links', icon: LinkIcon },
    { title: 'Fournisseurs', text: 'Contacts et soldes fournisseurs.', href: '/suppliers', icon: Truck },
    { title: 'Achats / Réassort', text: 'Réapprovisionnement du stock.', href: '/purchases', icon: PackagePlus },
    { title: 'Dépenses', text: 'Charges et profits réels.', href: '/expenses', icon: Wallet },
    { title: 'Analytics', text: 'Performance commerciale.', href: '/analytics', icon: BarChart3 },
    { title: 'Ouverture caisse', text: 'Cash journalier et fermeture.', href: '/register-shifts', icon: CalendarClock },
    { title: 'Paramètres', text: 'Branding, logo et informations.', href: '/settings', icon: Settings }
  ]

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const businessId = membership.business_id

      const [salesResult, productsResult, customersResult] = await Promise.all([
        supabase.from('sales').select('id,total,created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('id,name,stock').eq('business_id', businessId).order('stock', { ascending: true }).limit(200),
        supabase.from('customers').select('id,full_name,debt_balance').eq('business_id', businessId).limit(200)
      ])

      if (salesResult.error) setMessage(salesResult.error.message)
      if (productsResult.error) setMessage(productsResult.error.message)
      if (customersResult.error) setMessage(customersResult.error.message)

      setSales((salesResult.data || []) as Sale[])
      setProducts((productsResult.data || []) as Product[])
      setCustomers((customersResult.data || []) as Customer[])
      setLoading(false)
    }

    init()
  }, [router])

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
    const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)

    return {
      todayTotal,
      weekTotal,
      lowStock,
      totalDebt,
      recentSales: sales.slice(0, 5),
      debtCustomers: customers.filter((customer) => Number(customer.debt_balance || 0) > 0).slice(0, 5)
    }
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
      title="Centre de contrôle"
      subtitle="Vue rapide de votre boutique en temps réel."
      action={
        <Link
          href="/pos"
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Ouvrir la caisse
        </Link>
      }
    >
      <div className="mx-auto max-w-[1600px]">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/sales" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <p className="text-sm font-bold text-slate-500">Aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{cfa(stats.todayTotal)}</p>
          </Link>

          <Link href="/sales" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <p className="text-sm font-bold text-slate-500">Cette semaine</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{cfa(stats.weekTotal)}</p>
          </Link>

          <Link href="/products" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <p className="text-sm font-bold text-slate-500">Stock bas</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{stats.lowStock.length}</p>
          </Link>

          <Link href="/debts" className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <p className="text-sm font-bold text-slate-500">Client Doit</p>
            <p className="mt-2 text-3xl font-black text-red-600">{cfa(stats.totalDebt)}</p>
          </Link>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Ventes récentes</h3>
            <div className="mt-5 space-y-3">
              {stats.recentSales.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Aucune vente récente.</p>
              ) : stats.recentSales.map((sale) => (
                <Link key={sale.id} href={`/sales/${sale.id}`} className="flex justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold transition hover:bg-emerald-50">
                  <span>#{sale.id.slice(0, 8)}</span>
                  <span>{cfa(Number(sale.total || 0))}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Stock faible</h3>
            <div className="mt-5 space-y-3">
              {stats.lowStock.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Stock correct.</p>
              ) : stats.lowStock.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between rounded-2xl bg-amber-50 p-4 text-sm font-bold">
                  <span>{product.name}</span>
                  <span>{product.stock || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Clients qui doivent</h3>
            <div className="mt-5 space-y-3">
              {stats.debtCustomers.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Aucune dette.</p>
              ) : stats.debtCustomers.map((customer) => (
                <Link key={customer.id} href={`/customers/${customer.id}`} className="flex justify-between rounded-2xl bg-red-50 p-4 text-sm font-bold transition hover:bg-red-100">
                  <span>{customer.full_name}</span>
                  <span>{cfa(Number(customer.debt_balance || 0))}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  card.primary
                    ? 'border-emerald-200 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-950'
                }`}
              >
                <div className={`mb-6 inline-flex rounded-2xl p-4 ${
                  card.primary ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <Icon size={26} />
                </div>

                <h3 className="text-2xl font-black">{card.title}</h3>
                <p className={`mt-2 text-sm font-semibold ${
                  card.primary ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {card.text}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
