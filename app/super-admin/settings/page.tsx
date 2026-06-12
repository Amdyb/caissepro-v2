'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext } from '@/lib/superAdmin'
import { refreshPlatformSettings } from '@/lib/usePlatformSettings'
import { Settings, Save, Percent, CreditCard, MessageCircle, Wrench, Megaphone, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

const KEYS = [
  'commission_target_signups',
  'commission_amount_xof',
  'plan_price_starter',
  'plan_price_business',
  'plan_price_premium',
  'whatsapp_notifications_enabled',
  'maintenance_mode',
  'announcement_banner',
] as const

type SettingsMap = Record<string, string>

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [values, setValues] = useState<SettingsMap>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const ctx = await getAdminContext()
    const ok = ctx?.role === 'super_admin'
    setAllowed(ok)
    if (ok) {
      const { data } = await supabase.from('platform_settings').select('key, value')
      const map: SettingsMap = {}
      for (const row of data || []) map[(row as any).key] = (row as any).value ?? ''
      setValues(map)
    }
    setLoading(false)
  }

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function toggle(key: string) {
    setValues((prev) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))
  }

  async function save() {
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const rows = KEYS.map((key) => ({
      key,
      value: values[key] ?? '',
      updated_by: userData.user?.id || null,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' })
    if (error) {
      setSaving(false)
      flash(`Erreur: ${error.message}`)
      return
    }
    // Bust the cache so the change propagates instantly instead of after the 5min TTL.
    await refreshPlatformSettings()
    setSaving(false)
    flash('Paramètres enregistrés.')
  }

  if (loading) {
    return <div className="px-5 py-10 font-black text-white/70">Chargement...</div>
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
          <Lock className="mx-auto text-amber-400" size={48} />
          <h1 className="mt-4 text-2xl font-black">Réservé aux founders</h1>
          <p className="mt-2 text-sm font-semibold text-white/50">Les paramètres plateforme sont réservés aux founders.</p>
        </div>
      </div>
    )
  }

  const maintenanceOn = values['maintenance_mode'] === 'true'
  const whatsappOn = values['whatsapp_notifications_enabled'] === 'true'

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/15 p-3">
            <Settings className="text-emerald-300" size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black">Paramètres</h1>
            <p className="text-sm font-semibold text-white/50">Configuration globale de la plateforme.</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">{message}</div>
      )}

      <div className="space-y-6">
        {/* Commission */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Percent className="text-emerald-300" size={20} />
            <h2 className="text-xl font-black">Commission agents</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Objectif inscriptions / mois"
              value={values['commission_target_signups'] || ''}
              onChange={(v) => set('commission_target_signups', v)}
              type="number"
            />
            <Field
              label="Montant commission (XOF)"
              value={values['commission_amount_xof'] || ''}
              onChange={(v) => set('commission_amount_xof', v)}
              type="number"
            />
          </div>
        </section>

        {/* Plan prices */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-3">
            <CreditCard className="text-emerald-300" size={20} />
            <h2 className="text-xl font-black">Prix des abonnements (XOF / mois)</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Starter" value={values['plan_price_starter'] || ''} onChange={(v) => set('plan_price_starter', v)} type="number" />
            <Field label="Business" value={values['plan_price_business'] || ''} onChange={(v) => set('plan_price_business', v)} type="number" />
            <Field label="Premium" value={values['plan_price_premium'] || ''} onChange={(v) => set('plan_price_premium', v)} type="number" />
          </div>
        </section>

        {/* Toggles */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <Toggle
            icon={MessageCircle}
            title="Notifications WhatsApp"
            description="Activer l'envoi des notifications WhatsApp (reçus, rappels, commandes)."
            on={whatsappOn}
            onToggle={() => toggle('whatsapp_notifications_enabled')}
          />
          <div className="my-5 h-px bg-white/10" />
          <Toggle
            icon={Wrench}
            title="Mode maintenance"
            description="Affiche une page de maintenance aux marchands."
            on={maintenanceOn}
            onToggle={() => toggle('maintenance_mode')}
            danger
          />
        </section>

        {/* Announcement */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Megaphone className="text-emerald-300" size={20} />
            <h2 className="text-xl font-black">Bannière d&apos;annonce</h2>
          </div>
          <textarea
            value={values['announcement_banner'] || ''}
            onChange={(e) => set('announcement_banner', e.target.value)}
            rows={3}
            placeholder="Message affiché à tous les marchands (laisser vide pour masquer)."
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
          />
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="text-sm font-bold text-white/60">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white outline-none focus:border-emerald-400/50"
      />
    </div>
  )
}

function Toggle({
  icon: Icon,
  title,
  description,
  on,
  onToggle,
  danger,
}: {
  icon: typeof Settings
  title: string
  description: string
  on: boolean
  onToggle: () => void
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className={danger ? 'text-red-300' : 'text-emerald-300'} size={20} />
        <div>
          <p className="font-black">{title}</p>
          <p className="text-sm font-semibold text-white/40">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? (danger ? 'bg-red-500' : 'bg-emerald-500') : 'bg-white/15'}`}
        aria-pressed={on}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}
