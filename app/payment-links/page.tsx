'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Copy, ExternalLink, LinkIcon, Plus } from 'lucide-react'
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

  const [form, setForm] = useState({
    provider: 'manual',
    reference_type: 'client_doit',
    amount: '',
    payment_url: '',
    note: ''
  })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

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
      .select('id, provider, reference_type, amount, status, payment_url, note, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMessage(error.message)
      return
    }

    setLinks((data || []) as PaymentLink[])
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

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({ provider: 'manual', reference_type: 'client_doit', amount: '', payment_url: '', note: '' })
    await loadLinks(businessId)
    setMessage('Lien de paiement créé.')
    setSaving(false)
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from('payment_links').update({ status: 'paid' }).eq('id', id)
    if (error) {
      setMessage(error.message)
      return
    }
    if (businessId) await loadLinks(businessId)
  }

  async function copyLink(link: PaymentLink) {
    await navigator.clipboard.writeText(link.payment_url || link.note || '')
    setMessage('Copié.')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement liens...</p></main>
  }

  return (
    <AppShell title="Liens de paiement" subtitle="Créer et suivre les liens Wave, Orange Money, carte ou manuel.">
      <div className="mx-auto max-w-[1200px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={addLink} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Créer un lien</h3>
            <div className="space-y-4">
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none">
                <option value="manual">Manuel</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="card">Carte bancaire</option>
              </select>

              <select value={form.reference_type} onChange={(e) => setForm({ ...form, reference_type: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none">
                <option value="client_doit">Client Doit</option>
                <option value="rent">Loyer</option>
                <option value="tontine">Tontine</option>
                <option value="order">Commande</option>
                <option value="invoice">Facture</option>
              </select>

              <input type="number" required placeholder="Montant" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input placeholder="Lien paiement externe" value={form.payment_url} onChange={(e) => setForm({ ...form, payment_url: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <textarea placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />

              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-60">
                <Plus size={18} />
                {saving ? 'Création...' : 'Créer lien'}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Historique</h3>
            <div className="space-y-4">
              {links.map((link) => (
                <div key={link.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">{link.status || 'pending'}</span>
                      <p className="mt-3 text-xl font-black text-slate-950">{cfa(Number(link.amount || 0))}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{link.provider || 'manual'} • {link.reference_type || 'paiement'}</p>
                      {link.note && <p className="mt-3 text-sm font-semibold text-slate-600">{link.note}</p>}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {link.payment_url && <a href={link.payment_url} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><ExternalLink size={18}/>Ouvrir</a>}
                      <button onClick={() => copyLink(link)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700"><Copy size={18}/>Copier</button>
                      <button onClick={() => markPaid(link.id)} className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Payé</button>
                    </div>
                  </div>
                </div>
              ))}

              {links.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><LinkIcon className="mx-auto text-slate-300" size={48}/><p className="mt-4 font-black text-slate-950">Aucun lien</p></div>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
