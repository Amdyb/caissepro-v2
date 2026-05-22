'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, ChevronUp, HandCoins, Mail, MapPin, MessageCircle, Phone, Plus, Search, Trash2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Supplier = {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  balance: number | null
  note: string | null
  total_owed: number | null
  total_paid: number | null
  remaining_balance: number | null
  last_payment_date: string | null
  created_at: string
}

type SupplierPayment = {
  id: string
  supplier_id: string
  amount: number
  payment_type: string | null
  payment_method: string | null
  reference: string | null
  note: string | null
  paid_at: string
}

export default function SuppliersPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [payments, setPayments] = useState<Record<string, SupplierPayment[]>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [partialAmount, setPartialAmount] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', balance: '', note: '' })
  const [addingSupplier, setAddingSupplier] = useState(false)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return suppliers
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q)
    )
  }, [suppliers, search])

  const totalRemaining = suppliers.reduce((sum, s) => sum + Number(s.remaining_balance ?? s.balance ?? 0), 0)
  const totalPaid = suppliers.reduce((sum, s) => sum + Number(s.total_paid || 0), 0)
  const suppliersWithDebt = suppliers.filter((s) => Number(s.remaining_balance ?? s.balance ?? 0) > 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (error || !membership) { setMessage('Aucune boutique trouvée.'); setLoading(false); return }

      setBusinessId(membership.business_id)
      await loadSuppliers(membership.business_id)
      setLoading(false)
    }
    init()
  }, [router])

  async function loadSuppliers(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) { setMessage(error.message); return }
    setSuppliers((data || []) as Supplier[])
  }

  async function loadPayments(supplierId: string) {
    if (payments[supplierId]) return
    const { data, error } = await supabase
      .from('supplier_payments')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('paid_at', { ascending: false })
      .limit(20)

    if (!error) {
      setPayments((prev) => ({ ...prev, [supplierId]: (data || []) as SupplierPayment[] }))
    }
  }

  function toggleExpand(supplierId: string) {
    if (expandedId === supplierId) {
      setExpandedId(null)
    } else {
      setExpandedId(supplierId)
      loadPayments(supplierId)
    }
  }

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setAddingSupplier(true)

    const owed = Number(form.balance || 0)
    const { error } = await supabase.from('suppliers').insert({
      business_id: businessId,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      balance: owed,
      total_owed: owed,
      total_paid: 0,
      remaining_balance: owed,
      note: form.note || null
    })

    if (error) { flash(error.message); setAddingSupplier(false); return }

    setForm({ name: '', phone: '', email: '', address: '', balance: '', note: '' })
    await loadSuppliers(businessId)
    flash('Fournisseur ajouté avec succès.')
    setAddingSupplier(false)
  }

  async function deleteSupplier(id: string) {
    if (!businessId) return
    if (!confirm('Supprimer ce fournisseur ?')) return

    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) { flash(error.message); return }
    await loadSuppliers(businessId)
  }

  async function payFull(supplier: Supplier) {
    if (!businessId) return
    const remaining = Number(supplier.remaining_balance ?? supplier.balance ?? 0)
    if (remaining <= 0) return

    setSavingId(supplier.id)

    const { error: insertError } = await supabase.from('supplier_payments').insert({
      business_id: businessId,
      supplier_id: supplier.id,
      amount: remaining,
      payment_type: 'full',
      payment_method: 'cash',
      paid_at: new Date().toISOString()
    })

    if (insertError) { setSavingId(null); flash(insertError.message); return }

    const newTotalPaid = Number(supplier.total_paid || 0) + remaining
    const { error: updateError } = await supabase.from('suppliers').update({
      remaining_balance: 0,
      total_paid: newTotalPaid,
      last_payment_date: new Date().toISOString()
    }).eq('id', supplier.id)

    setSavingId(null)
    if (updateError) { flash(updateError.message); return }

    setPayments((prev) => {
      const prev_list = prev[supplier.id] || []
      const newPayment: SupplierPayment = {
        id: crypto.randomUUID(),
        supplier_id: supplier.id,
        amount: remaining,
        payment_type: 'full',
        payment_method: 'cash',
        reference: null,
        note: null,
        paid_at: new Date().toISOString()
      }
      return { ...prev, [supplier.id]: [newPayment, ...prev_list] }
    })
    await loadSuppliers(businessId)
    flash(`Paiement total de ${remaining.toLocaleString('fr-FR')} CFA enregistré.`)
  }

  async function payPartial(supplier: Supplier) {
    if (!businessId) return
    const remaining = Number(supplier.remaining_balance ?? supplier.balance ?? 0)
    const raw = Number(partialAmount[supplier.id] || 0)
    if (!raw || raw <= 0) { flash('Montant invalide.'); return }
    const amt = Math.min(raw, remaining)
    const newBalance = remaining - amt

    setSavingId(supplier.id)

    const { error: insertError } = await supabase.from('supplier_payments').insert({
      business_id: businessId,
      supplier_id: supplier.id,
      amount: amt,
      payment_type: 'partial',
      payment_method: 'cash',
      paid_at: new Date().toISOString()
    })

    if (insertError) { setSavingId(null); flash(insertError.message); return }

    const newTotalPaid = Number(supplier.total_paid || 0) + amt
    const { error: updateError } = await supabase.from('suppliers').update({
      remaining_balance: newBalance,
      total_paid: newTotalPaid,
      last_payment_date: new Date().toISOString()
    }).eq('id', supplier.id)

    setSavingId(null)
    if (updateError) { flash(updateError.message); return }

    setPartialAmount((prev) => ({ ...prev, [supplier.id]: '' }))
    setPayments((prev) => {
      const prev_list = prev[supplier.id] || []
      const newPayment: SupplierPayment = {
        id: crypto.randomUUID(),
        supplier_id: supplier.id,
        amount: amt,
        payment_type: 'partial',
        payment_method: 'cash',
        reference: null,
        note: null,
        paid_at: new Date().toISOString()
      }
      return { ...prev, [supplier.id]: [newPayment, ...prev_list] }
    })
    await loadSuppliers(businessId)
    flash(`Paiement partiel de ${amt.toLocaleString('fr-FR')} CFA enregistré.`)
  }

  function sendWhatsApp(supplier: Supplier) {
    if (!supplier.phone) { flash('Ce fournisseur n\'a pas de numéro de téléphone.'); return }
    const remaining = Number(supplier.remaining_balance ?? supplier.balance ?? 0)
    const phone = supplier.phone.replace(/\D/g, '')
    const text = encodeURIComponent(`Bonjour ${supplier.name}, nous vous rappelons qu'il vous reste ${remaining.toLocaleString('fr-FR')} CFA à recevoir de notre part. Merci.`)
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const action = (
    <button
      onClick={() => businessId && loadSuppliers(businessId)}
      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
    >
      Actualiser
    </button>
  )

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des fournisseurs...</p>
      </main>
    )
  }

  return (
    <AppShell title="Fournisseurs" subtitle="Gérez vos fournisseurs et suivez vos paiements." action={action}>
      <div className="mx-auto max-w-[1600px]">
        {message && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Building2 className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Fournisseurs</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{suppliers.length}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{suppliersWithDebt.length} avec solde dû</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <HandCoins className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Reste à payer</p>
            <p className="mt-2 text-3xl font-black text-red-700">{totalRemaining.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total payé</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{totalPaid.toLocaleString('fr-FR')} CFA</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Plus /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Ajouter un fournisseur</h2>
                <p className="text-sm text-slate-500">Contacts et soldes fournisseurs.</p>
              </div>
            </div>

            <form onSubmit={addSupplier} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Nom du fournisseur</label>
                <input required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600" placeholder="Ex: Grossiste Sandaga" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Téléphone</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600" placeholder="77 000 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Email</label>
                  <input type="email" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600" placeholder="contact@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Adresse</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600" placeholder="Adresse ou marché" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Solde dû (CFA)</label>
                <input type="number" min="0" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600" placeholder="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Note</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600" placeholder="Ex: livre le mardi, paiement Wave..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>

              <button disabled={addingSupplier} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-60">
                {addingSupplier ? 'Ajout...' : 'Ajouter fournisseur'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-lg font-black text-slate-950">{suppliers.length} fournisseur(s)</p>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 font-semibold outline-none focus:border-emerald-600 md:w-72" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {filteredSuppliers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Building2 className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun fournisseur</h3>
                <p className="mt-2 text-slate-500">Les fournisseurs ajoutés apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuppliers.map((supplier) => {
                  const remaining = Number(supplier.remaining_balance ?? supplier.balance ?? 0)
                  const paid = Number(supplier.total_paid || 0)
                  const owed = Number(supplier.total_owed ?? supplier.balance ?? 0)
                  const pct = owed > 0 ? Math.round((paid / owed) * 100) : remaining === 0 ? 100 : 0
                  const isExpanded = expandedId === supplier.id
                  const isSaving = savingId === supplier.id

                  return (
                    <div key={supplier.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <p className="text-lg font-black text-slate-950">{supplier.name}</p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
                            {supplier.phone && <span className="flex items-center gap-1"><Phone size={13} />{supplier.phone}</span>}
                            {supplier.email && <span className="flex items-center gap-1"><Mail size={13} />{supplier.email}</span>}
                            {supplier.address && <span className="flex items-center gap-1"><MapPin size={13} />{supplier.address}</span>}
                          </div>

                          {supplier.note && <p className="mt-2 text-xs font-semibold text-slate-400">{supplier.note}</p>}

                          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs font-bold">
                            <div className="rounded-xl bg-slate-50 p-2">
                              <p className="text-slate-400">Dû initial</p>
                              <p className="mt-1 font-black text-slate-700">{owed.toLocaleString('fr-FR')} CFA</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-2">
                              <p className="text-emerald-600">Payé</p>
                              <p className="mt-1 font-black text-emerald-700">{paid.toLocaleString('fr-FR')} CFA</p>
                            </div>
                            <div className={`rounded-xl p-2 ${remaining > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                              <p className={remaining > 0 ? 'text-red-500' : 'text-emerald-600'}>Restant</p>
                              <p className={`mt-1 font-black ${remaining > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{remaining.toLocaleString('fr-FR')} CFA</p>
                            </div>
                          </div>

                          {owed > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                <span>Progression</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => sendWhatsApp(supplier)} className="rounded-2xl border border-slate-200 p-3 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700">
                            <MessageCircle size={17} />
                          </button>
                          <button onClick={() => deleteSupplier(supplier.id)} className="rounded-2xl border border-slate-200 p-3 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      {remaining > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={() => payFull(supplier)}
                            disabled={isSaving}
                            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {isSaving ? 'En cours...' : `Tout payer (${remaining.toLocaleString('fr-FR')} CFA)`}
                          </button>

                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              className="w-36 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none focus:border-emerald-600"
                              placeholder="Montant..."
                              value={partialAmount[supplier.id] || ''}
                              onChange={(e) => setPartialAmount((prev) => ({ ...prev, [supplier.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => payPartial(supplier)}
                              disabled={isSaving || !partialAmount[supplier.id]}
                              className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                            >
                              Payer
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => toggleExpand(supplier.id)}
                        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                      >
                        <span>Historique des paiements</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {(payments[supplier.id] || []).length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-400">Aucun paiement enregistré.</p>
                          ) : (
                            (payments[supplier.id] || []).map((p) => (
                              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                                <div>
                                  <p className="text-sm font-black text-emerald-800">{Number(p.amount).toLocaleString('fr-FR')} CFA</p>
                                  <p className="text-xs font-semibold text-emerald-600">{new Date(p.paid_at).toLocaleDateString('fr-FR')} · {p.payment_type === 'full' ? 'Paiement total' : 'Partiel'}</p>
                                </div>
                                {p.payment_method && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{p.payment_method}</span>}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
