'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import {
  getPermission,
  iosNeedsInstall,
  isPushSupported,
  isSubscribed,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push'
import { Bell, BellOff, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

type Prefs = {
  new_orders: boolean
  low_stock: boolean
  daily_summary: boolean
  subscription_reminders: boolean
  ticket_replies: boolean
  payment_confirmations: boolean
}

const DEFAULT_PREFS: Prefs = {
  new_orders: true,
  low_stock: true,
  daily_summary: true,
  subscription_reminders: true,
  ticket_replies: true,
  payment_confirmations: true,
}

const TOGGLES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: 'new_orders', label: 'Nouvelles commandes', desc: 'Alerte à chaque commande en ligne.' },
  { key: 'low_stock', label: 'Stock bas', desc: 'Quand un produit atteint 5 unités ou moins.' },
  { key: 'payment_confirmations', label: 'Paiements', desc: 'Confirmations de paiement reçues.' },
  { key: 'subscription_reminders', label: 'Abonnement', desc: 'Activation et rappels d’expiration.' },
  { key: 'ticket_replies', label: 'Réponses support', desc: 'Quand le support répond à votre ticket.' },
  { key: 'daily_summary', label: 'Résumé quotidien', desc: 'Bilan des ventes de la journée.' },
]

export default function NotificationSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [permission, setPermission] = useState<string>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [deviceBusy, setDeviceBusy] = useState(false)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3500)
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) { setLoading(false); return }
      setUserId(uid)

      const { data } = await supabase
        .from('notification_preferences')
        .select('new_orders, low_stock, daily_summary, subscription_reminders, ticket_replies, payment_confirmations')
        .eq('user_id', uid)
        .maybeSingle()

      if (data) setPrefs({ ...DEFAULT_PREFS, ...data })

      setPermission(getPermission())
      setSubscribed(await isSubscribed())
      setLoading(false)
    }
    init()
  }, [])

  function toggle(key: keyof Prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  async function save() {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setSaving(false)
    flash(error ? `Erreur : ${error.message}` : 'Préférences enregistrées.')
  }

  async function enableDevice() {
    setDeviceBusy(true)
    const perm = await requestPushPermission()
    setPermission(perm)
    if (perm === 'granted') {
      const ok = await subscribeToPush()
      setSubscribed(ok)
      flash(ok ? 'Notifications activées sur cet appareil.' : 'Activation impossible.')
    } else {
      flash('Permission refusée.')
    }
    setDeviceBusy(false)
  }

  async function disableDevice() {
    setDeviceBusy(true)
    await unsubscribeFromPush()
    setSubscribed(false)
    setDeviceBusy(false)
    flash('Notifications désactivées sur cet appareil.')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-black text-slate-600 dark:text-slate-300">Chargement...</p>
      </main>
    )
  }

  return (
    <AppShell title="Notifications" subtitle="Choisissez les alertes que vous recevez.">
      <div className="mx-auto max-w-2xl space-y-6 pb-20">
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            {message}
          </div>
        )}

        {/* This-device push state */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
            <Bell size={18} /> Cet appareil
          </h2>
          {!isPushSupported() ? (
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {iosNeedsInstall()
                ? "Installez l'app sur votre écran d'accueil (Partager → Sur l'écran d'accueil) pour activer les notifications."
                : "Cet appareil ou navigateur ne supporte pas les notifications push."}
            </p>
          ) : subscribed && permission === 'granted' ? (
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Notifications actives sur cet appareil.</p>
              <button
                onClick={disableDevice}
                disabled={deviceBusy}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <BellOff size={15} /> Désactiver
              </button>
            </div>
          ) : permission === 'denied' ? (
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Les notifications sont bloquées dans les réglages de votre navigateur. Réautorisez-les puis revenez ici.
            </p>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Activez les notifications sur cet appareil.</p>
              <button
                onClick={enableDevice}
                disabled={deviceBusy}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Bell size={15} /> {deviceBusy ? 'Activation...' : 'Activer'}
              </button>
            </div>
          )}
        </div>

        {/* Per-type preferences */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Types d&apos;alertes</h2>
          <div className="mt-4 space-y-2">
            {TOGGLES.map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:bg-slate-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[key] ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${prefs[key] ? 'left-[22px]' : 'left-0.5'}`} />
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
