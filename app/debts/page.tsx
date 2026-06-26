'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  HandCoins,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Trash2,
  UserPlus,
  WalletCards
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
}

export default function DebtsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('Ma Boutique')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 6000)
  }

  // Add new customer with debt
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', debt_balance: '' })
  const [addingCustomer, setAddingCustomer] = useState(false)

  // Per-customer UI state
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())
  const [partialOpen, setPartialOpen] = useState<string | null>(null)
  const [partialAmount, setPartialAmount] = useState('')
  const [partialNote, setPartialNote] = useState('')

  const customersWithDebt = useMemo(() => {
    const q = search.toLowerCase().trim()
    return customers
      .filter((c) => Number(c.debt_balance || 0) > 0)
      .filter((c) => !q || c.full_name.toLowerCase().includes(q) || (c.phone || '').includes(q))
      .sort((a, b) => Number(b.debt_balance || 0) - Number(a.debt_balance || 0))
  }, [customers, search])

  const totalDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance || 0), 0)
  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Honour the user-selected business (multi-boutique) instead of an
      // arbitrary first membership.
      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)

      if (!memberships || memberships.length === 0) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      let member: any = memberships[0]
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('caissepro_selected_business_id') : null
      if (savedId) {
        const found = memberships.find((m: any) => m.business_id === savedId)
        if (found) member = found
      }
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadCustomers(member.business_id),
        loadPayments(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [])

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id,business_id,full_name,phone,email,debt_balance,points,total_spent')
      .eq('business_id', id)
      .order('debt_balance', { ascending: false })

    if (!error) setCustomers((data || []) as Customer[])
  }

  async function loadPayments(id: string) {
    const { data } = await supabase
      .from('customer_payments')
      .select('id,business_id,customer_id,amount,note,created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    setPayments((data || []) as Payment[])
  }

  async function addCustomerWithDebt(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setAddingCustomer(true)
    setMessage('')

    const { error } = await supabase.from('customers').insert({
      business_id: businessId,
      full_name: newCustomer.full_name,
      phone: newCustomer.phone || null,
      debt_balance: Number(newCustomer.debt_balance || 0),
      total_spent: 0,
      points: 0
    })

    setAddingCustomer(false)

    if (error) { setMessage(error.message); return }

    setNewCustomer({ full_name: '', phone: '', debt_balance: '' })
    flash('Client débiteur ajouté.')
    await loadCustomers(businessId)
  }

  async function payFull(customer: Customer) {
    if (!businessId) return
    const remaining = Number(customer.debt_balance || 0)
    if (remaining <= 0) return
    setSaving(customer.id)
    setMessage('')

    const { error: insertError } = await supabase.from('customer_payments').insert({
      business_id: businessId,
      customer_id: customer.id,
      amount: remaining,
      note: 'Paiement total'
    })

    if (insertError) { setSaving(null); flash(insertError.message); return }

    const { error: updateError } = await supabase
      .from('customers').update({ debt_balance: 0 }).eq('id', customer.id)

    setSaving(null)
    if (updateError) { flash(updateError.message); return }

    flash(`Paiement total de ${remaining.toLocaleString('fr-FR')} CFA enregistré.`)
    await Promise.all([loadCustomers(businessId), loadPayments(businessId)])
  }

  async function payPartial(customer: Customer) {
    if (!businessId) return
    const remaining = Number(customer.debt_balance || 0)
    const raw = Number(partialAmount || 0)
    if (raw <= 0) { flash('Le montant doit être supérieur à 0.'); return }

    const amt = Math.min(raw, remaining)
    const newBalance = remaining - amt

    setSaving(customer.id)

    const { error: insertError } = await supabase.from('customer_payments').insert({
      business_id: businessId,
      customer_id: customer.id,
      amount: amt,
      note: partialNote || 'Paiement partiel'
    })

    if (insertError) { setSaving(null); flash(insertError.message); return }

    const { error: updateError } = await supabase
      .from('customers').update({ debt_balance: newBalance }).eq('id', customer.id)

    setSaving(null)
    if (updateError) { flash(updateError.message); return }

    setPartialOpen(null)
    setPartialAmount('')
    setPartialNote('')
    flash(`Paiement de ${amt.toLocaleString('fr-FR')} CFA enregistré.`)
    await Promise.all([loadCustomers(businessId), loadPayments(businessId)])
  }

  async function clearDebt(customer: Customer) {
    if (!businessId) return
    const remaining = Number(customer.debt_balance || 0)
    if (remaining <= 0) return

    setSaving('clear-' + customer.id)

    const { error: insertError } = await supabase.from('customer_payments').insert({
      business_id: businessId,
      customer_id: customer.id,
      amount: remaining,
      note: 'Remise de dette'
    })

    if (insertError) { setSaving(null); flash(insertError.message); return }

    const { error: updateError } = await supabase
      .from('customers').update({ debt_balance: 0 }).eq('id', customer.id)

    setSaving(null)
    if (updateError) { flash(updateError.message); return }

    flash(`Dette de ${customer.full_name} effacée.`)
    await Promise.all([loadCustomers(businessId), loadPayments(businessId)])
  }

  function sendWhatsAppReminder(customer: Customer) {
    const phone = (customer.phone || '').replace(/\D/g, '')
    const debt = Number(customer.debt_balance || 0).toLocaleString('fr-FR')
    const text = encodeURIComponent(
      `Bonjour ${customer.full_name} 👋\n\nVous avez un solde restant de *${debt} CFA* chez *${businessName}*.\n\nMerci de régulariser votre situation dès que possible.\n\n_Message envoyé via CaissePro_`
    )
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  function toggleHistory(customerId: string) {
    setExpandedHistory((prev) => {
      const next = new Set(prev)
      next.has(customerId) ? next.delete(customerId) : next.add(customerId)
      return next
    })
  }

  function customerPayments(customerId: string) {
    return payments.filter((p) => p.customer_id === customerId)
  }

  function totalPaidByCustomer(customerId: string) {
    return customerPayments(customerId).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-600">Chargement Client Doit...</p>
      </main>
    )
  }

  return (
    <AppShell title="Client Doit" subtitle="Suivi des crédits et remboursements clients.">
      <div className="mx-auto max-w-7xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        )}

        {/* KPI cards */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
            <WalletCards className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dette totale restante</p>
            <p className="mt-2 text-3xl font-black text-red-700">{totalDebt.toLocaleString('fr-FR')} CFA</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <UserPlus className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Clients débiteurs</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{customersWithDebt.length}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <HandCoins className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total encaissé</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{totalReceived.toLocaleString('fr-FR')} CFA</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Add customer form */}
          <div>
            <form onSubmit={addCustomerWithDebt} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-slate-950">
                <Plus size={20} /> Ajouter dette client
              </h2>
              <div className="space-y-3">
                <input
                  required
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                  placeholder="Nom du client"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                />
                <input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Téléphone WhatsApp"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                />
                <input
                  required
                  type="number"
                  min="0"
                  value={newCustomer.debt_balance}
                  onChange={(e) => setNewCustomer({ ...newCustomer, debt_balance: e.target.value })}
                  placeholder="Montant dû (CFA)"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                />
                <button
                  disabled={addingCustomer}
                  className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white disabled:opacity-60 hover:bg-emerald-700"
                >
                  {addingCustomer ? 'Ajout...' : 'Ajouter dette'}
                </button>
              </div>
            </form>
          </div>

          {/* Debts list */}
          <div className="space-y-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 font-bold outline-none focus:border-emerald-500"
              />
            </div>

            {customersWithDebt.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
                <WalletCards className="mx-auto text-slate-300" size={48} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucune dette</h3>
                <p className="mt-2 text-sm text-slate-500">Tous les clients sont à jour.</p>
              </div>
            ) : (
              customersWithDebt.map((customer) => {
                const paidTotal = totalPaidByCustomer(customer.id)
                const remaining = Number(customer.debt_balance || 0)
                const original = remaining + paidTotal
                const isSaving = saving === customer.id || saving === 'clear-' + customer.id
                const historyVisible = expandedHistory.has(customer.id)
                const history = customerPayments(customer.id)
                const isPartialOpen = partialOpen === customer.id

                return (
                  <div key={customer.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 p-5">
                      <div>
                        <p className="text-xl font-black text-slate-950">{customer.full_name}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-500">
                          {customer.phone || 'Pas de téléphone'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-500">Solde dû</p>
                        <p className="text-2xl font-black text-red-700">{remaining.toLocaleString('fr-FR')} CFA</p>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50 text-center">
                      <div className="px-3 py-3 border-r border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dette initiale</p>
                        <p className="mt-1 text-sm font-black text-slate-700">{original.toLocaleString('fr-FR')} CFA</p>
                      </div>
                      <div className="px-3 py-3 border-r border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Déjà payé</p>
                        <p className="mt-1 text-sm font-black text-emerald-700">{paidTotal.toLocaleString('fr-FR')} CFA</p>
                      </div>
                      <div className="px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Restant</p>
                        <p className="mt-1 text-sm font-black text-red-700">{remaining.toLocaleString('fr-FR')} CFA</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {original > 0 && (
                      <div className="h-1.5 bg-slate-100">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.min((paidTotal / original) * 100, 100)}%` }}
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 p-5">
                      <button
                        onClick={() => payFull(customer)}
                        disabled={isSaving || remaining <= 0}
                        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        Paiement total
                      </button>

                      <button
                        onClick={() => {
                          setPartialOpen(isPartialOpen ? null : customer.id)
                          setPartialAmount('')
                          setPartialNote('')
                        }}
                        disabled={isSaving || remaining <= 0}
                        className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black disabled:opacity-50 ${isPartialOpen ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Minus size={16} />
                        Paiement partiel
                      </button>

                      <button
                        onClick={() => sendWhatsAppReminder(customer)}
                        className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle size={16} />
                        Rappel WhatsApp
                      </button>

                      <button
                        onClick={() => clearDebt(customer)}
                        disabled={isSaving || remaining <= 0}
                        className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Effacer dette
                      </button>
                    </div>

                    {/* Partial payment input */}
                    {isPartialOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-3">
                        <p className="text-sm font-black text-slate-700">Montant du paiement partiel</p>
                        <input
                          type="number"
                          min="1"
                          max={remaining}
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          placeholder={`Max : ${remaining.toLocaleString('fr-FR')} CFA`}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:border-emerald-500"
                        />
                        <input
                          value={partialNote}
                          onChange={(e) => setPartialNote(e.target.value)}
                          placeholder="Note (optionnel)"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-emerald-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => payPartial(customer)}
                            disabled={isSaving || !partialAmount}
                            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Enregistrement...' : 'Confirmer le paiement'}
                          </button>
                          <button
                            onClick={() => setPartialOpen(null)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Payment history toggle */}
                    {history.length > 0 && (
                      <div className="border-t border-slate-100">
                        <button
                          onClick={() => toggleHistory(customer.id)}
                          className="flex w-full items-center justify-between px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2">
                            <Clock size={14} />
                            {history.length} paiement{history.length > 1 ? 's' : ''} enregistré{history.length > 1 ? 's' : ''}
                          </span>
                          {historyVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {historyVisible && (
                          <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
                            {history.map((p) => {
                              const d = new Date(p.created_at)
                              return (
                                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
                                  <div>
                                    <p className="text-sm font-black text-slate-950">
                                      +{Number(p.amount).toLocaleString('fr-FR')} CFA
                                    </p>
                                    {p.note && <p className="text-xs font-semibold text-slate-500">{p.note}</p>}
                                  </div>
                                  <p className="text-xs font-bold text-slate-400">
                                    {d.toLocaleDateString('fr-FR')} à {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
