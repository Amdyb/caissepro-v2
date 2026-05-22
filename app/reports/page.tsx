'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CreditCard,
  HandCoins,
  Package,
  Printer,
  ReceiptText,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Sale = {
  id: string
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_method: string | null
  status: string | null
  created_at: string
}

type Expense = {
  id: string
  amount: number | null
  category: string | null
  expense_date: string | null
}

type Product = {
  id: string
  name: string
  stock: number | null
  sell_price: number | null
}

type Customer = {
  id: string
  debt_balance: number | null
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function startOfWeekISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function paymentLabel(method: string | null) {
  switch (method) {
    case 'cash':
      return 'Espèces'
    case 'wave':
      return 'Wave'
    case 'orange_money':
      return 'Orange Money'
    case 'card':
      return 'Carte'
    case 'credit':
      return 'Client Doit'
    default:
      return method || 'Non précisé'
  }
}

export default function ReportsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const periodStart = useMemo(() => {
    if (period === 'today') return todayISO()
    if (period === 'week') return startOfWeekISO()
    return startOfMonthISO()
  }, [period])

  const report = useMemo(() => {
    const periodSales = sales.filter((sale) => sale.created_at.slice(0, 10) >= periodStart)
    const periodExpenses = expenses.filter((expense) => (expense.expense_date || '') >= periodStart)

    const totalSales = periodSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const totalPaid = periodSales.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0)
    const totalRemaining = periodSales.reduce((sum, sale) => sum + Number(sale.remaining_amount || 0), 0)
    const totalExpenses = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const netProfit = totalSales - totalExpenses

    const paymentBreakdown = periodSales.reduce<Record<string, number>>((acc, sale) => {
      const key = sale.payment_method || 'unknown'
      acc[key] = (acc[key] || 0) + Number(sale.total || 0)
      return acc
    }, {})

    const expenseBreakdown = periodExpenses.reduce<Record<string, number>>((acc, expense) => {
      const key = expense.category || 'Autre'
      acc[key] = (acc[key] || 0) + Number(expense.amount || 0)
      return acc
    }, {})

    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5)
    const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)

    return {
      periodSales,
      periodExpenses,
      totalSales,
      totalPaid,
      totalRemaining,
      totalExpenses,
      netProfit,
      paymentBreakdown,
      expenseBreakdown,
      lowStock,
      totalDebt
    }
  }, [sales, expenses, products, customers, periodStart])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadSales(member.business_id),
        loadExpenses(member.business_id),
        loadProducts(member.business_id),
        loadCustomers(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, total, paid_amount, remaining_amount, payment_method, status, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as Sale[])
  }

  async function loadExpenses(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('id, amount, category, expense_date')
      .eq('business_id', id)
      .order('expense_date', { ascending: false })
      .limit(1000)

    if (error) {
      setMessage(error.message)
      return
    }

    setExpenses((data || []) as Expense[])
  }

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock, sell_price')
      .eq('business_id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, debt_balance')
      .eq('business_id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as Customer[])
  }

  function printReport() {
    window.print()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des rapports...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Rapports
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={printReport}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <Printer size={16} />
              Imprimer
            </button>

            <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            background: white !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950">
              Centre de rapports
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Résumé des ventes, dépenses, profits, paiements et alertes stock.
            </p>
          </div>

          <div className="no-print rounded-2xl border border-slate-200 bg-white p-2">
            <button
              onClick={() => setPeriod('today')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'today' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Jour
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'week' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`rounded-xl px-4 py-3 text-sm font-black ${period === 'month' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Mois
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Ventes</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {report.totalSales.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {report.periodSales.length} vente(s)
            </p>
          </div>

          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dépenses</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {report.totalExpenses.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {report.periodExpenses.length} dépense(s)
            </p>
          </div>

          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <TrendingUp className={report.netProfit >= 0 ? 'text-brand-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Net</p>
            <p className={`mt-2 text-3xl font-black ${report.netProfit >= 0 ? 'text-slate-950' : 'text-red-700'}`}>
              {report.netProfit.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              ventes - dépenses
            </p>
          </div>

          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <HandCoins className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Client Doit</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {report.totalDebt.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              dette totale clients
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Paiements</h3>
                <p className="text-sm text-slate-500">Répartition par méthode.</p>
              </div>
              <CreditCard className="text-brand-600" />
            </div>

            <div className="space-y-3">
              {Object.keys(report.paymentBreakdown).length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  Aucune vente sur cette période.
                </p>
              ) : (
                Object.entries(report.paymentBreakdown).map(([method, total]) => (
                  <div key={method} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <Banknote className="text-brand-600" size={18} />
                      <p className="font-black text-slate-950">{paymentLabel(method)}</p>
                    </div>
                    <p className="font-black text-slate-950">{Number(total).toLocaleString('fr-FR')} CFA</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Dépenses par catégorie</h3>
                <p className="text-sm text-slate-500">Où part l’argent.</p>
              </div>
              <CalendarDays className="text-red-600" />
            </div>

            <div className="space-y-3">
              {Object.keys(report.expenseBreakdown).length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  Aucune dépense sur cette période.
                </p>
              ) : (
                Object.entries(report.expenseBreakdown).map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between rounded-2xl bg-red-50 p-4">
                    <p className="font-black text-slate-950">{category}</p>
                    <p className="font-black text-red-700">{Number(total).toLocaleString('fr-FR')} CFA</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Résumé encaissement</h3>
                <p className="text-sm text-slate-500">Payé vs restant.</p>
              </div>
              <Wallet className="text-brand-600" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-brand-50 p-5">
                <p className="text-sm font-bold text-brand-700">Montant payé</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {report.totalPaid.toLocaleString('fr-FR')} CFA
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-sm font-bold text-red-700">Reste à payer</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {report.totalRemaining.toLocaleString('fr-FR')} CFA
                </p>
              </div>
            </div>
          </div>

          <div className="print-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Stock bas</h3>
                <p className="text-sm text-slate-500">Produits à réapprovisionner.</p>
              </div>
              <AlertTriangle className="text-red-600" />
            </div>

            {report.lowStock.length === 0 ? (
              <p className="rounded-2xl bg-brand-50 p-5 text-sm font-bold text-brand-700">
                Aucun stock bas.
              </p>
            ) : (
              <div className="space-y-3">
                {report.lowStock.slice(0, 8).map((product) => (
                  <Link key={product.id} href="/products" className="flex items-center justify-between rounded-2xl bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                      <Package className="text-red-600" size={18} />
                      <p className="font-black text-slate-950">{product.name}</p>
                    </div>
                    <p className="font-black text-red-700">Stock: {product.stock || 0}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
