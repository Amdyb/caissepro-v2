'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, Clock3, Copy, ExternalLink, Eye, Plus, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type PaymentLink = {
  id: string
  provider: string | null
  reference_type: string | null
  amount: number | null
  status: string | null
  payment_url: string | null
  note: string | null
  proof_image_url: string | null
  proof_note: string | null
  verified_at: string | null
  created_at: string
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function PaymentLinksPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({ provider: 'manual', reference_type: 'client_doit', amount: '', payment_url: '', note: '' })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      const { data: membership } = await supabase.from('business_members').select('business_id').eq('user_id', userData.user.id).limit(1).single()
      if (!membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }
      setBusinessId(membership.business_id)
      await loadLinks(membership.business_id)
      setLoading(false)
    }
    init()
  }, [router])

  async function loadLinks(id: string) {
    const { data, error } = await supabase
      .from('payment_links')
      .select('id, provider, reference_type, amount, status, payment_url, note, proof_image_url, proof_note, verified_at, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) setMessage(error.message)
    else setLinks((data || []) as PaymentLink[])
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('payment_links').insert({
      business_id: businessId,
      provider: form.provider,
      reference_type: form.reference_type,
      amount: Number(form.amount || 0),
      currency: 'XOF',
      status: 'pending',
      payment_url: form.payment_url || null,
      note: form.note || null
    })
    if (error) setMessage(error.message)
    else {
      setForm({ provider: 'manual', reference_type: 'client_doit', amount: '', payment_url: '', note: '' })
      await loadLinks(businessId)
      setMessage('Lien de paiement créé.')
    }
    setSaving(false)
  }

  async function verifyPayment(link: PaymentLink) {
    if (!businessId) return
    const verifiedAt = new Date().toISOString()
    const { error } = await supabase.from('payment_links').update({ status: 'paid', verified_at: verifiedAt }).eq('id', link.id)
    if (error) {
      setMessage(error.message)
      return
    }

    await supabase.from('reminders').update({ status: 'paid' }).eq('payment_link_id', link.id)
    await loadLinks(businessId)
    setMessage('Paiement vérifié et rappel associé fermé.')
  }

  async function rejectPayment(link: PaymentLink) {
    if (!businessId) return
    const { error } = await supabase.from('payment_links').update({ status: 'rejected' }).eq('id', link.id)
    if (error) setMessage(error.message)
    else {
      await supabase.from('reminders').update({ status: 'rejected' }).eq('payment_link_id', link.id)
      await loadLinks(businessId)
      setMessage('Paiement rejeté.')
    }
  }

  async function copyLink(link: PaymentLink) {
    await navigator.clipboard.writeText(link.payment_url || link.note || '')
    setMessage('Copié.')
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement liens...</p></main>

  return (
    <AppShell title="Liens & vérifications" subtitle="Créer, suivre et vérifier les paiements clients.">
      <div className="mx-auto max-w-[1300px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={addLink} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Créer un lien</h3>
            <div className="space-y-4">
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="manual">Manuel</option><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="card">Carte bancaire</option></select>
              <select value={form.reference_type} onChange={(e) => setForm({ ...form, reference_type: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="client_doit">Client Doit</option><option value="rent">Loyer</option><option value="tontine">Tontine</option><option value="order">Commande</option><option value="invoice">Facture</option></select>
              <input type="number" required placeholder="Montant" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input placeholder="Lien paiement externe" value={form.payment_url} onChange={(e) => setForm({ ...form, payment_url: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <textarea placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-60"><Plus size={18} />{saving ? 'Création...' : 'Créer lien'}</button>
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Vérifications</h3>
            <div className="space-y-5">
              {links.map((link) => (
                <div key={link.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{link.reference_type || 'paiement'}</span><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">{link.status || 'pending'}</span></div>
                      <h3 className="mt-4 text-2xl font-black text-slate-950">{cfa(Number(link.amount || 0))}</h3>
                      <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600"><p>Référence: #{link.id.slice(0, 8)}</p><p>Créé: {new Date(link.created_at).toLocaleString()}</p>{link.verified_at && <p>Vérifié: {new Date(link.verified_at).toLocaleString()}</p>}</div>
                      {link.note && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">{link.note}</div>}
                      {link.proof_note && <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm font-semibold text-sky-700">Preuve client: {link.proof_note}</div>}
                    </div>
                    <div className="w-full max-w-sm space-y-4">
                      {link.proof_image_url ? <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"><img src={link.proof_image_url} alt="preuve" className="h-64 w-full object-cover" /></div> : <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-400">Aucune preuve reçue</div>}
                      <div className="grid gap-3">
                        {link.payment_url && <a href={link.payment_url} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white"><ExternalLink size={18}/>Ouvrir lien</a>}
                        <button onClick={() => copyLink(link)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 text-sm font-black text-slate-700"><Copy size={18}/>Copier</button>
                        {link.proof_image_url && <a href={link.proof_image_url} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 text-sm font-black text-slate-700"><Eye size={18}/>Voir preuve</a>}
                        {link.status !== 'paid' && <button onClick={() => verifyPayment(link)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white"><CheckCircle size={18}/>Vérifier paiement</button>}
                        {link.status !== 'rejected' && <button onClick={() => rejectPayment(link)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-sm font-black text-white"><XCircle size={18}/>Rejeter</button>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {links.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Clock3 className="mx-auto text-slate-300" size={48}/><p className="mt-4 font-black text-slate-950">Aucun paiement</p></div>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
