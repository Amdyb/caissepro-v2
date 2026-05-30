'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, CheckCircle2, MessageCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type WhatsAppSettings = {
  whatsapp_business_number: string
  whatsapp_api_token: string
  whatsapp_phone_id: string
  whatsapp_auto_receipt: boolean
  whatsapp_auto_orders: boolean
  whatsapp_payment_reminders: boolean
  whatsapp_low_stock_alerts: boolean
}

export default function WhatsAppSettingsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [form, setForm] = useState<WhatsAppSettings>({
    whatsapp_business_number: '',
    whatsapp_api_token: '',
    whatsapp_phone_id: '',
    whatsapp_auto_receipt: false,
    whatsapp_auto_orders: false,
    whatsapp_payment_reminders: false,
    whatsapp_low_stock_alerts: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fallback' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) { setLoading(false); return }
      setBusinessId(membership.business_id)

      const { data: biz } = await supabase
        .from('businesses')
        .select('whatsapp_business_number,whatsapp_api_token,whatsapp_phone_id,whatsapp_auto_receipt,whatsapp_auto_orders,whatsapp_payment_reminders,whatsapp_low_stock_alerts')
        .eq('id', membership.business_id)
        .maybeSingle()

      if (biz) {
        setForm({
          whatsapp_business_number: biz.whatsapp_business_number || '',
          whatsapp_api_token:       biz.whatsapp_api_token || '',
          whatsapp_phone_id:        biz.whatsapp_phone_id || '',
          whatsapp_auto_receipt:        !!biz.whatsapp_auto_receipt,
          whatsapp_auto_orders:         !!biz.whatsapp_auto_orders,
          whatsapp_payment_reminders:   !!biz.whatsapp_payment_reminders,
          whatsapp_low_stock_alerts:    !!biz.whatsapp_low_stock_alerts,
        })
      }
      setLoading(false)
    }
    init()
  }, [router])

  async function handleSave() {
    if (!businessId) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('businesses')
      .update(form)
      .eq('id', businessId)
    setMessage(error ? error.message : 'Parametres sauvegardes.')
    setSaving(false)
  }

  async function handleTest() {
    if (!form.whatsapp_business_number) {
      setMessage('Entrez un numero WhatsApp Business avant de tester.')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.whatsapp_business_number,
          message: 'Test de connexion CaissePro WhatsApp — configuration reussie.',
        }),
      })
      const data = await res.json()
      setTestResult(data.method === 'api' ? 'success' : 'fallback')
      if (data.method === 'fallback' && data.url) window.open(data.url, '_blank')
    } catch {
      setTestResult('fallback')
    }
    setTesting(false)
  }

  const hasToken = !!form.whatsapp_api_token

  const toggles: { key: keyof WhatsAppSettings; label: string }[] = [
    { key: 'whatsapp_auto_receipt',        label: 'Recus automatiques' },
    { key: 'whatsapp_auto_orders',         label: 'Nouvelles commandes' },
    { key: 'whatsapp_payment_reminders',   label: 'Rappels paiement' },
    { key: 'whatsapp_low_stock_alerts',    label: 'Alertes stock faible' },
  ]

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Chargement...</p>
      </main>
    )
  }

  return (
    <AppShell title="WhatsApp" subtitle="Configuration et notifications">
      <div className="mx-auto max-w-xl space-y-6">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Retour aux parametres
        </Link>

        {/* Status */}
        <div className={`flex items-center gap-3 rounded-2xl border p-4 ${hasToken ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
          <MessageCircle size={20} className={hasToken ? 'text-emerald-600' : 'text-slate-400'} />
          <div>
            <p className={`text-sm font-black ${hasToken ? 'text-emerald-700' : 'text-slate-600'}`}>
              {hasToken ? 'Mode API active' : 'Mode lien direct (wa.me)'}
            </p>
            <p className="text-xs font-semibold text-slate-400">
              {hasToken
                ? 'Les messages sont envoyes via l\'API WhatsApp Business.'
                : 'Ajoutez un token API pour activer l\'envoi automatique.'}
            </p>
          </div>
        </div>

        {/* Credentials */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-950">Identifiants API</h2>

          <div>
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">Numero WhatsApp Business</label>
            <input
              type="tel"
              value={form.whatsapp_business_number}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_business_number: e.target.value }))}
              placeholder="+221 77 000 00 00"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">Phone Number ID (Meta)</label>
            <input
              type="text"
              value={form.whatsapp_phone_id}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_phone_id: e.target.value }))}
              placeholder="123456789012345"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">Token d'acces API</label>
            <input
              type="password"
              value={form.whatsapp_api_token}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_api_token: e.target.value }))}
              placeholder="EAAxxxxxxxxxxxxx..."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Notifications toggles */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-950">Notifications automatiques</h2>
          {toggles.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">{label}</span>
              <button
                onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form[key] ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Test + feedback */}
        {testResult && (
          <div className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${testResult === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {testResult === 'success'
              ? <><CheckCircle2 size={16} /> Message envoye via API WhatsApp.</>
              : <><XCircle size={16} /> Token absent — lien wa.me ouvert en fallback.</>}
          </div>
        )}

        {message && (
          <p className={`rounded-2xl p-3 text-sm font-bold ${message.includes('sauvegardes') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 rounded-2xl border border-slate-300 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
