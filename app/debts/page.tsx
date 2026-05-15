'use client'

import AppShell from '@/components/AppShell'
import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, HandCoins, Plus, Search, Send, UserPlus, WalletCards } from 'lucide-react'
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
  customers?: { full_name: string } | null
}

export default function DebtsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('Ma Boutique')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [schemaWarning, setSchemaWarning] = useState('')
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', debt_balance: '' })

  const customersWithDebt = useMemo(() => {
    const q = search.toLowerCase().trim()
    return customers
      .filter((customer) => Number(customer.debt_balance || 0) > 0)
      .filter((customer) => !q || customer.full_name.toLowerCase().includes(q) || (customer.phone || '').includes(q))
      .sort((a, b) => Number(b.debt_balance || 0) - Number(a.debt_balance || 0))
  }, [customers, search])

  const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null
  const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      await loadCustomers(member.business_id)
      await loadPayments(member.business_id)
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

    if (error) {
      setMessage(error.message)
      return
    }
    setCustomers((data || []) as Customer[])
  }

  async function loadPayments(id: string) {
    const { data, error } = await supabase
      .from('customer_payments')
      .select('id,business_id,customer_id,amount,note,created_at,customers(full_name)')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      setSchemaWarning('Historique paiements pas encore actif. Lancez client_doit_schema.sql dans Supabase.')
      setPayments([])
      return
    }
    setPayments((data || []) as unknown as Payment[])
  }

  async function addCustomerWithDebt(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('customers').insert({
      business_id: businessId,
      full_name: newCustomer.full_name,
      phone: newCustomer.phone || null,
      debt_balance: Number(newCustomer.debt_balance || 0),
      total_spent: 0,
      points: 0
    })

    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }

    setNewCustomer({ full_name: '', phone: '', debt_balance: '' })
    setMessage('Client débiteur ajouté avec succès.')
    await loadCustomers(businessId)
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

    const { error: paymentError } = await supabase.from('customer_payments').insert({
      business_id: businessId,
      customer_id: selectedCustomer.id,
      amount: paymentAmount,
      note: note || null
    })

    if (paymentError) {
      setSchemaWarning('Paiement non sauvegardé dans historique: lancez client_doit_schema.sql dans Supabase.')
    }

    const { error: updateError } = await supabase.from('customers').update({ debt_balance: newDebt }).eq('id', selectedCustomer.id)

    setSaving(false)
    if (updateError) {
      setMessage(updateError.message)
      return
    }

    setMessage('Paiement enregistré et dette réduite.')
    setAmount('')
    setNote('')
    setSelectedCustomerId('')
    await loadCustomers(businessId)
    await loadPayments(businessId)
  }

  function whatsappReminder(customer: Customer) {
    const phone = (customer.phone || '').replace(/\D/g, '')
    const text = encodeURIComponent(`Bonjour ${customer.full_name}, vous avez un solde restant de ${Number(customer.debt_balance || 0).toLocaleString('fr-FR')} CFA chez ${businessName}. Merci.`)
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement Client Doit...</p></main>

  return (
    <AppShell title="Client Doit" subtitle="Suivi intelligent des crédits clients.">
      <div className="mx-auto max-w-7xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}
        {schemaWarning && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800"><AlertTriangle className="mr-2 inline" size={17} />{schemaWarning}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><WalletCards className="text-red-600" /><p className="mt-5 text-sm font-bold text-slate-500">Dette totale</p><p className="mt-2 text-3xl font-black text-slate-950">{totalDebt.toLocaleString('fr-FR')} CFA</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><UserPlus className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Clients débiteurs</p><p className="mt-2 text-3xl font-black text-slate-950">{customersWithDebt.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><HandCoins className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Paiements reçus</p><p className="mt-2 text-3xl font-black text-slate-950">{totalPayments.toLocaleString('fr-FR')} CFA</p></div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="space-y-8">
            <form onSubmit={addCustomerWithDebt} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-slate-950"><Plus /> Ajouter dette client</h2>
              <div className="space-y-4">
                <input required value={newCustomer.full_name} onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })} placeholder="Nom client" className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                <input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Téléphone" className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                <input required type="number" value={newCustomer.debt_balance} onChange={(e) => setNewCustomer({ ...newCustomer, debt_balance: e.target.value })} placeholder="Montant dû" className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                <button disabled={saving} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white disabled:opacity-60">Ajouter dette</button>
              </div>
            </form>

            <form onSubmit={recordPayment} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-slate-950"><HandCoins /> Enregistrer paiement</h2>
              <div className="space-y-4">
                <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"><option value="">Sélectionner client</option>{customersWithDebt.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name} — {Number(customer.debt_balance || 0).toLocaleString('fr-FR')} CFA</option>)}</select>
                <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant payé" className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                <button disabled={saving} className="w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:opacity-60">Enregistrer paiement</button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><h2 className="text-2xl font-black text-slate-950">Clients débiteurs</h2><p className="text-sm font-semibold text-slate-500">Clients avec solde impayé.</p></div>
              <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-emerald-500 md:w-72" /></div>
            </div>

            <div className="space-y-4">
              {customersWithDebt.map((customer) => (
                <div key={customer.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div><p className="text-lg font-black text-slate-950">{customer.full_name}</p><p className="mt-1 text-sm font-semibold text-slate-500">{customer.phone || 'Pas de téléphone'}</p></div>
                    <div className="text-right"><p className="text-xs font-bold text-red-600">Dette</p><p className="text-xl font-black text-red-700">{Number(customer.debt_balance || 0).toLocaleString('fr-FR')} CFA</p></div>
                  </div>
                  <a href={whatsappReminder(customer)} target="_blank" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"><Send size={16} /> Rappel WhatsApp</a>
                </div>
              ))}
              {customersWithDebt.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><WalletCards className="mx-auto text-slate-400" size={42} /><h3 className="mt-4 text-xl font-black text-slate-950">Aucune dette</h3></div>}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center"><AmdyLabsBrand /></div>
      </div>
    </AppShell>
  )
}
