'use client'

import { useEffect, useState } from 'react'
import { Bell, Share, X } from 'lucide-react'
import {
  isPushSupported,
  iosNeedsInstall,
  getPermission,
  requestPushPermission,
  subscribeToPush,
} from '@/lib/push'

const SNOOZE_KEY = 'push_prompt_snoozed_until'
const SNOOZE_DAYS = 3

function snoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY) || 0)
    return Date.now() < until
  } catch {
    return false
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400000))
  } catch {}
}

/**
 * Friendly, non-nagging push opt-in. Renders nothing unless we should ask.
 * - Already granted → silently (re)subscribes this device, shows nothing.
 * - iOS Safari (not installed) → shows an "install to home screen" hint.
 * - Otherwise → shows the enable prompt, snoozed for a few days if dismissed.
 */
export default function PushPermissionPrompt({ businessId }: { businessId?: string | null }) {
  const [mode, setMode] = useState<'hidden' | 'ask' | 'ios'>('hidden')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) {
      // iOS Safari before install exposes no PushManager — guide them to install.
      if (iosNeedsInstall() && !snoozed()) setMode('ios')
      return
    }

    const perm = getPermission()
    if (perm === 'granted') {
      // Keep the device subscription fresh; no UI.
      subscribeToPush(businessId)
      return
    }
    if (perm === 'default' && !snoozed()) setMode('ask')
    // 'denied' → never nag; they can re-enable in settings.
  }, [businessId])

  async function enable() {
    setBusy(true)
    const perm = await requestPushPermission()
    if (perm === 'granted') {
      await subscribeToPush(businessId)
    } else {
      snooze()
    }
    setBusy(false)
    setMode('hidden')
  }

  function later() {
    snooze()
    setMode('hidden')
  }

  if (mode === 'hidden') return null

  return (
    <div className="mb-6 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-900/20 dark:to-slate-800">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <Bell size={22} />
        </div>

        <div className="min-w-0 flex-1">
          {mode === 'ask' ? (
            <>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Activer les notifications ?</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Recevez une alerte pour chaque nouvelle commande, paiement et stock bas.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={enable}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Bell size={16} /> {busy ? 'Activation...' : 'Activer'}
                </button>
                <button
                  onClick={later}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  Plus tard
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Notifications sur iPhone</h3>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Installez l&apos;app sur votre écran d&apos;accueil pour activer les notifications : appuyez sur
                <Share size={15} className="inline text-emerald-700" /> puis « Sur l&apos;écran d&apos;accueil ».
              </p>
            </>
          )}
        </div>

        <button
          onClick={later}
          aria-label="Fermer"
          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
