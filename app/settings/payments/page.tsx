'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSettingsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    wave_number: '',
    orange_money_number: '',
    card_payment_url: '',
    default_provider: 'wave',
    payment_instructions: ''
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

      const { data } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('business_id', membership.business_id)
        .maybeSingle()

      if (data) {
        setForm({
          wave_number: data.wave_number || '',
          orange_money_number: data.orange_money_number || '',
          card_payment_url: data.card_payment_url || '',
          default_provider: data.default_provider || 'wave',
          payment_instructions: data.payment_instructions || ''
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
      wave_number: form.wave_number || null,
      orange_money_number: form.orange_money_number || null,
      card_payment_url: form.card_payment_url || null,
      default_provider: form.default_provider,
      payment_instructions: form.payment_instructions || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id' })

    if (error) setMessage(error.message)
    else setMessage('Paramètres de paiement enregistrés.')

    setSaving(false)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement paiements...</p></main>
  }

  return (
    <AppShell title="Paramètres paiements" subtitle="Configurez Wave, Orange Money, carte et instructions client.">
      <div className="mx-auto max-w-3xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <form onSubmit={saveSettings} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Numéro Wave</label>
              <input value={form.wave_number} onChange={(e) => setForm({ ...form, wave_number: e.target.value })} placeholder="Ex: 77 000 00 00" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Numéro Orange Money</label>
              <input value={form.orange_money_number} onChange={(e) => setForm({ ...form, orange_money_number: e.target.value })} placeholder="Ex: 77 000 00 00" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Lien carte bancaire / externe</label>
              <input value={form.card_payment_url} onChange={(e) => setForm({ ...form, card_payment_url: e.target.value })} placeholder="https://..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Méthode par défaut</label>
              <select value={form.default_provider} onChange={(e) => setForm({ ...form, default_provider: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none">
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="card">Carte bancaire</option>
                <option value="manual">Manuel</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Instructions client</label>
              <textarea value={form.payment_instructions} onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })} placeholder="Ex: Envoyez le paiement puis confirmez sur WhatsApp avec votre référence." className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
            </div>

            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-60">
              <Save size={18} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
