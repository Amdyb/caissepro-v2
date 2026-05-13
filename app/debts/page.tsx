'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, HandCoins, ReceiptText, Search, WalletCards } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Customer = {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  email: string | null
  debt_balance: number | null
  points: number | null
  total_spent: number | null
}

type Payment = {
  id: string
  business_id: string
  customer_id: string
  amount: number
  note: string | null
  created_at: string
  customers?: {
    full_name: string
  } | null
}

export default function DebtsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const customersWithDebt = useMemo(() => {
    const q = search.toLowerCase().trim()
    return customers
      .filter((customer) => Number(customer.debt_balance || 0) > 0)
      .filter((customer) => {
        if (!q) return true
        return (
          customer.full_name.toLowerCase().includes(q) ||
          (customer.phone || '').toLowerCase().includes(q) ||
          (customer.email || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => Number(b.debt_balance || 0) - Number(a.debt_balance || 0))
  }, [customers, search])

  const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null
  const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

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
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadCustomers(member.business_id),
        loadPayments(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, business_id, full_name, phone, email, debt_balance, points, total_spent')
      .eq('business_id', id)
      .order('debt_balance', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as Customer[])
  }

  async function loadPayments(id: string) {
    const { data, error } = await supabase
      .from('customer_payments')
      .select(`
        id,
        business_id,
        customer_id,
        amount,
        note,
        created_at,
        customers (
          full_name
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      setMessage(error.message)
      return
    }

    setPayments((data || []) as unknown as Payment[])
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId || !selectedCustomer) return

    const paymentAmount = Number(amount || 0)

    if (paymentAmount <= 0) {
      setMessage('Le montant doit être supérieur à 0.')
      return
    }

    setSaving(true)
    setMessage('')

    const currentDebt = Number(selectedCustomer.debt_balance || 0)
    const newDebt = Math.max(currentDebt - paymentAmount, 0)

    const { error: paymentError } = await supabase
      .from('customer_payments')
      .insert({
        business_id: businessId,
        customer_id: selectedCustomer.id,
        amount: paymentAmount,
        note: note || null
      })

    if (paymentError) {
      setMessage(paymentError.message)
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        debt_balance: newDebt
      })
      .eq('id', selectedCustomer.id)

    if (updateError) {
      setMessage(updateError.message)
      setSaving(false)
      return
    }

    setMessage('Paiement enregistré avec succès.')
    setAmount('')
    setNote('')
    setSelectedCustomerId('')

    await Promise.all([
      loadCustomers(businessId),
      loadPayments(businessId)
    ])

    setSaving(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des dettes...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Client Doit
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <WalletCards className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dette totale</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {totalDebt.toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Clients qui doivent</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {customersWithDebt.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <CreditCard className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Paiements reçus</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {totalPayments.toLocaleString('fr-FR')} CFA
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <HandCoins />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Enregistrer un paiement
                </h2>

                <p className="text-sm text-slate-500">
                  Réduisez la dette d’un client.
                </p>
              </div>
            </div>

            <form onSubmit={recordPayment} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Client
                </label>

                <select
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Sélectionner un client</option>
                  {customersWithDebt.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} — {Number(customer.debt_balance || 0).toLocaleString('fr-FR')} CFA
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="font-black text-slate-950">
                    {selectedCustomer.full_name}
                  </p>

                  <p className="mt-1 text-sm font-bold text-red-700">
                    Dette actuelle: {Number(selectedCustomer.debt_balance || 0).toLocaleString('fr-FR')} CFA
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Montant payé
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Note
                </label>

                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: Paiement Wave, acompte..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer paiement'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Clients débiteurs
                </h2>

                <p className="text-sm text-slate-500">
                  Clients avec un solde impayé.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />

                <input
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-72"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {customersWithDebt.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <WalletCards className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucune dette
                </h3>
                <p className="mt-2 text-slate-500">
                  Les clients qui doivent de l’argent apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customersWithDebt.map((customer) => (
                  <div key={customer.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-950">
                          {customer.full_name}
                        </p>

                        {customer.phone && (
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {customer.phone}
                          </p>
                        )}

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Total dépensé: {Number(customer.total_spent || 0).toLocaleString('fr-FR')} CFA • Points: {customer.points || 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-red-50 px-5 py-4 text-center">
                        <p className="text-xs font-bold text-red-600">
                          Dette
                        </p>
                        <p className="text-xl font-black text-red-700">
                          {Number(customer.debt_balance || 0).toLocaleString('fr-FR')} CFA
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Paiements récents
          </h2>

          {payments.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Aucun paiement enregistré.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {payments.map((payment) => {
                const date = new Date(payment.created_at)

                return (
                  <div key={payment.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black text-slate-950">
                        {payment.customers?.full_name || 'Client'}
                      </p>
                      <p className="text-sm font-semibold text-slate-500">
                        {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {payment.note ? ` • ${payment.note}` : ''}
                      </p>
                    </div>

                    <p className="text-lg font-black text-brand-700">
                      {Number(payment.amount || 0).toLocaleString('fr-FR')} CFA
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
