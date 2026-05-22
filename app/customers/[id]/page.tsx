'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Gift, HandCoins, Phone, ReceiptText, UserRound, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Customer = {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  email: string | null
  points: number | null
  total_spent: number | null
  debt_balance: number | null
  created_at: string
}

type SaleItem = {
  id: string
  quantity: number | null
  price: number | null
  total: number | null
  products?: {
    name: string
  } | null
}

type Sale = {
  id: string
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_method: string | null
  status: string | null
  created_at: string
  sale_items?: SaleItem[]
}

type Payment = {
  id: string
  amount: number | null
  note: string | null
  created_at: string
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

export default function CustomerProfilePage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const analytics = useMemo(() => {
    const salesCount = sales.length
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const paidTotal = sales.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0)
    const remainingTotal = sales.reduce((sum, sale) => sum + Number(sale.remaining_amount || 0), 0)
    const paymentsTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    return {
      salesCount,
      totalSales,
      paidTotal,
      remainingTotal,
      paymentsTotal
    }
  }, [sales, payments])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      await Promise.all([
        loadCustomer(),
        loadSales(),
        loadPayments()
      ])

      setLoading(false)
    }

    init()
  }, [router, customerId])

  async function loadCustomer() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomer(data as Customer)
  }

  async function loadSales() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        total,
        paid_amount,
        remaining_amount,
        payment_method,
        status,
        created_at,
        sale_items (
          id,
          quantity,
          price,
          total,
          products (
            name
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as unknown as Sale[])
  }

  async function loadPayments() {
    const { data, error } = await supabase
      .from('customer_payments')
      .select('id, amount, note, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return
    }

    setPayments((data || []) as Payment[])
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement du client...</p>
      </main>
    )
  }

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound className="mx-auto text-slate-400" size={44} />
          <h1 className="mt-4 text-2xl font-black text-slate-950">Client introuvable</h1>
          <p className="mt-2 text-slate-500">{message || 'Ce client est introuvable.'}</p>
          <Link href="/customers" className="mt-6 inline-block rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">
            Retour aux clients
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Clients
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Profil client
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              Historique, fidélité et dettes
            </p>
          </div>

          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-700">
                <UserRound size={34} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950">{customer.full_name}</h2>

                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                  {customer.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone size={15} />
                      {customer.phone}
                    </span>
                  )}

                  {customer.email && <span>{customer.email}</span>}
                </div>
              </div>
            </div>

            <Link
              href="/pos"
              className="rounded-2xl bg-brand-600 px-6 py-4 text-center text-sm font-black text-white hover:bg-brand-700"
            >
              Nouvelle vente
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total dépensé</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {Number(customer.total_spent || analytics.totalSales || 0).toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Gift className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Points fidélité</p>
            <p className="mt-2 text-3xl font-black text-brand-700">
              {customer.points || 0}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <HandCoins className={Number(customer.debt_balance || 0) > 0 ? 'text-red-600' : 'text-brand-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Dette actuelle</p>
            <p className={`mt-2 text-3xl font-black ${Number(customer.debt_balance || 0) > 0 ? 'text-red-700' : 'text-slate-950'}`}>
              {Number(customer.debt_balance || 0).toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Achats</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {analytics.salesCount}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">Historique d’achats</h2>
              <p className="text-sm text-slate-500">Toutes les ventes liées à ce client.</p>
            </div>

            {sales.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <ReceiptText className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun achat</h3>
                <p className="mt-2 text-slate-500">Les achats du client apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => {
                  const date = new Date(sale.created_at)

                  return (
                    <div key={sale.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <Link href={`/sales/${sale.id}`} className="font-black text-slate-950 hover:text-brand-700">
                            Vente #{sale.id.slice(0, 8)}
                          </Link>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {paymentLabel(sale.payment_method)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-black text-slate-950">
                            {Number(sale.total || 0).toLocaleString('fr-FR')} CFA
                          </p>
                          {Number(sale.remaining_amount || 0) > 0 && (
                            <p className="text-sm font-bold text-red-700">
                              Reste: {Number(sale.remaining_amount || 0).toLocaleString('fr-FR')} CFA
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(sale.sale_items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                            <span className="font-bold text-slate-700">
                              {item.products?.name || 'Produit supprimé'} x{item.quantity || 0}
                            </span>
                            <span className="font-black text-slate-950">
                              {Number(item.total || 0).toLocaleString('fr-FR')} CFA
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">Paiements dette</h2>
              <p className="text-sm text-slate-500">Paiements reçus pour réduire la dette.</p>
            </div>

            {payments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <HandCoins className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun paiement</h3>
                <p className="mt-2 text-slate-500">Les paiements apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const date = new Date(payment.created_at)

                  return (
                    <div key={payment.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">
                            {Number(payment.amount || 0).toLocaleString('fr-FR')} CFA
                          </p>
                          <p className="text-sm font-semibold text-slate-500">
                            {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {payment.note && (
                        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                          {payment.note}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <Link
              href="/debts"
              className="mt-6 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white hover:bg-slate-800"
            >
              Enregistrer un paiement
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
