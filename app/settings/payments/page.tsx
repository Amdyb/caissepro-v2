'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CreditCard, Landmark, Save, Smartphone, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSettingsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    wave_enabled: true,
    wave_number: '',
    wave_link: '',
    orange_enabled: true,
    orange_number: '',
    orange_link: '',
    cash_enabled: true,
    card_enabled: false,
    bank_enabled: false,
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    instructions: ''
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
        .maybeSingle()

      if (!membership) {
        setMessage('Aucun business trouvé.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)

      const { data } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('business_id', membership.business_id)
        .maybeSingle()

      if (data) {
        setForm({
          wave_enabled: data.wave_enabled ?? true,
          wave_number: data.wave_number || '',
          wave_link: data.wave_link || '',
          orange_enabled: data.orange_enabled ?? true,
          orange_number: data.orange_number || '',
          orange_link: data.orange_link || '',
          cash_enabled: data.cash_enabled ?? true,
          card_enabled: data.card_enabled ?? false,
          bank_enabled: data.bank_enabled ?? false,
          bank_name: data.bank_name || '',
          bank_account_name: data.bank_account_name || '',
          bank_account_number: data.bank_account_number || '',
          instructions: data.instructions || ''
        })
      }

      setLoading(false)
    }

    init()
  }, [router])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('payment_settings').upsert({
      business_id: businessId,
      ...form,
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id' })

    setSaving(false)
    setMessage(error ? error.message : 'Paramètres de paiement enregistrés.')
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement paiements...</p></main>

  return (
    <AppShell title="Paiements" subtitle="Configurez vos moyens d’encaissement.">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8">
          <h1 className="text-5xl font-black tracking-tight text-slate-950">Recevez vos paiements directement.</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">CaissePro ne garde pas votre argent. Les clients paient directement sur vos comptes Wave, Orange Money, cash ou banque.</p>
        </div>

        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <form onSubmit={saveSettings} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4"><div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700"><Smartphone size={28}/></div><div><h2 className="text-3xl font-black">Wave</h2><p className="text-sm font-semibold text-slate-500">Paiements mobiles rapides.</p></div></div>
            <label className="mb-4 flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={form.wave_enabled} onChange={(e) => setForm({ ...form, wave_enabled: e.target.checked })}/> Activer Wave</label>
            <div className="grid gap-4"><input value={form.wave_number} onChange={(e) => setForm({ ...form, wave_number: e.target.value })} placeholder="Numéro Wave" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/><input value={form.wave_link} onChange={(e) => setForm({ ...form, wave_link: e.target.value })} placeholder="Lien Wave (optionnel)" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/></div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4"><div className="rounded-2xl bg-orange-100 p-4 text-orange-600"><Wallet size={28}/></div><div><h2 className="text-3xl font-black">Orange Money</h2><p className="text-sm font-semibold text-slate-500">Paiement mobile local.</p></div></div>
            <label className="mb-4 flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={form.orange_enabled} onChange={(e) => setForm({ ...form, orange_enabled: e.target.checked })}/> Activer Orange Money</label>
            <div className="grid gap-4"><input value={form.orange_number} onChange={(e) => setForm({ ...form, orange_number: e.target.value })} placeholder="Numéro Orange Money" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/><input value={form.orange_link} onChange={(e) => setForm({ ...form, orange_link: e.target.value })} placeholder="Lien Orange Money (optionnel)" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/></div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4"><div className="rounded-2xl bg-sky-100 p-4 text-sky-700"><Landmark size={28}/></div><div><h2 className="text-3xl font-black">Banque</h2><p className="text-sm font-semibold text-slate-500">Virement bancaire.</p></div></div>
            <label className="mb-4 flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={form.bank_enabled} onChange={(e) => setForm({ ...form, bank_enabled: e.target.checked })}/> Activer banque</label>
            <div className="grid gap-4"><input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Nom de la banque" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/><input value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} placeholder="Nom du compte" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/><input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} placeholder="Numéro de compte" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold"/></div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4"><div className="rounded-2xl bg-slate-100 p-4 text-slate-700"><CreditCard size={28}/></div><div><h2 className="text-3xl font-black">Options</h2><p className="text-sm font-semibold text-slate-500">Cash, carte et instructions.</p></div></div>
            <div className="mb-4 grid gap-3"><label className="flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={form.cash_enabled} onChange={(e) => setForm({ ...form, cash_enabled: e.target.checked })}/> Accepter cash</label><label className="flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={form.card_enabled} onChange={(e) => setForm({ ...form, card_enabled: e.target.checked })}/> Carte / lien externe</label></div>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Merci pour votre commande. Après paiement, envoyez votre reçu WhatsApp." rows={8} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold" />
          </div>

          <button disabled={saving} className="lg:col-span-2 rounded-2xl bg-emerald-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"><Save className="mr-2 inline" size={20}/>{saving ? 'Sauvegarde...' : 'Sauvegarder les paiements'}</button>
        </form>
      </div>
    </AppShell>
  )
}
