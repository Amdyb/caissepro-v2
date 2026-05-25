'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Camera, Check, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const ALL_METHODS = [
  { id: 'wave', label: 'Wave', emoji: '🌊', color: '#2563eb', description: 'Paiement mobile Wave' },
  { id: 'orange_money', label: 'Orange Money', emoji: '🟠', color: '#ea580c', description: 'Mobile money Orange' },
  { id: 'free_money', label: 'Free Money', emoji: '🔴', color: '#dc2626', description: 'Mobile money Free' },
  { id: 'mtn_money', label: 'MTN Money', emoji: '🟡', color: '#ca8a04', description: 'Mobile money MTN' },
  { id: 'cash', label: 'Espèces', emoji: '💵', color: '#16a34a', description: 'Paiement en liquide' },
  { id: 'card', label: 'Carte bancaire', emoji: '💳', color: '#7c3aed', description: 'Visa, Mastercard' },
]

type MethodState = {
  enabled: boolean
  qr_url: string | null
  qr_file?: File | null
  qr_preview?: string | null
}

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [methods, setMethods] = useState<Record<string, MethodState>>(() =>
    Object.fromEntries(ALL_METHODS.map((m) => [m.id, { enabled: m.id === 'wave' || m.id === 'cash', qr_url: null }]))
  )
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

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
        .select('payment_methods')
        .eq('id', membership.business_id)
        .maybeSingle()

      if (biz?.payment_methods) {
        const saved = biz.payment_methods as Record<string, any>
        setMethods((prev) => {
          const next = { ...prev }
          for (const id of ALL_METHODS.map((m) => m.id)) {
            if (saved[id]) {
              next[id] = { enabled: saved[id].enabled ?? false, qr_url: saved[id].qr_url ?? null }
            }
          }
          return next
        })
      }

      setLoading(false)
    }
    init()
  }, [])

  function toggle(id: string) {
    setMethods((prev) => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }))
  }

  function handleQrFile(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setMethods((prev) => ({ ...prev, [id]: { ...prev[id], qr_file: file, qr_preview: preview } }))
  }

  async function save() {
    if (!businessId) return
    setSaving(true)
    setMessage('')

    try {
      const payload: Record<string, any> = {}

      for (const method of ALL_METHODS) {
        const state = methods[method.id]
        let qrUrl = state.qr_url

        if (state.qr_file) {
          const ext = state.qr_file.name.split('.').pop()
          const path = `${businessId}/qr-${method.id}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('business-assets')
            .upload(path, state.qr_file, { upsert: true })
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('business-assets').getPublicUrl(path)
            qrUrl = urlData.publicUrl
          }
        }

        payload[method.id] = { enabled: state.enabled, qr_url: qrUrl }
      }

      const { error } = await supabase
        .from('businesses')
        .update({ payment_methods: payload })
        .eq('id', businessId)

      if (error) throw error

      setMethods((prev) => {
        const next = { ...prev }
        for (const id of ALL_METHODS.map((m) => m.id)) {
          next[id] = { ...next[id], qr_url: payload[id].qr_url, qr_file: null, qr_preview: null }
        }
        return next
      })

      setMessage('Modes de paiement sauvegardés.')
    } catch (err: any) {
      setMessage(err?.message || 'Erreur lors de la sauvegarde.')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <AppShell title="Modes de paiement" subtitle="Activez les modes de paiement acceptés.">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-200" />
        </div>
      </AppShell>
    )
  }

  const enabledCount = ALL_METHODS.filter((m) => methods[m.id]?.enabled).length
  const isError = message.startsWith('Erreur')

  return (
    <AppShell title="Modes de paiement" subtitle="Activez les modes de paiement acceptés par votre boutique.">
      <div className="mx-auto max-w-2xl">
        {message && (
          <div className={`mb-5 rounded-2xl border p-4 text-sm font-black ${
            isError
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
          }`}>
            {message}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <CreditCard className="text-emerald-600" size={22} />
            <div>
              <p className="font-black text-slate-950 dark:text-white">{enabledCount} mode{enabledCount > 1 ? 's' : ''} activé{enabledCount > 1 ? 's' : ''}</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">sur {ALL_METHODS.length} disponibles</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60"
          >
            {saving ? 'Sauvegarde...' : <><Check size={15} /> Sauvegarder</>}
          </button>
        </div>

        <div className="space-y-4">
          {ALL_METHODS.map((method) => {
            const state = methods[method.id]
            const isEnabled = state?.enabled ?? false
            const qrDisplay = state?.qr_preview || state?.qr_url

            return (
              <div
                key={method.id}
                className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition dark:bg-slate-800 ${
                  isEnabled ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4 p-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ backgroundColor: method.color + '18' }}
                  >
                    {method.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-950 dark:text-white">{method.label}</p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{method.description}</p>
                  </div>
                  <button onClick={() => toggle(method.id)} className="shrink-0">
                    {isEnabled
                      ? <ToggleRight size={36} style={{ color: method.color }} />
                      : <ToggleLeft size={36} className="text-slate-300 dark:text-slate-600" />
                    }
                  </button>
                </div>

                {isEnabled && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-700/50">
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">QR Code de paiement (optionnel)</p>
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => fileRefs.current[method.id]?.click()}
                        className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800"
                      >
                        {qrDisplay
                          ? <img src={qrDisplay} alt={`QR ${method.label}`} className="h-full w-full object-contain p-1" />
                          : <Camera size={22} className="text-slate-400 dark:text-slate-500" />
                        }
                      </div>
                      <div>
                        <button
                          onClick={() => fileRefs.current[method.id]?.click()}
                          className="text-sm font-black text-emerald-600 hover:text-emerald-700"
                        >
                          {qrDisplay ? 'Changer le QR code' : 'Ajouter un QR code'}
                        </button>
                        <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                          PNG ou JPG · Affiché lors du paiement au POS
                        </p>
                        {qrDisplay && (
                          <button
                            onClick={() => setMethods((prev) => ({ ...prev, [method.id]: { ...prev[method.id], qr_url: null, qr_file: null, qr_preview: null } }))}
                            className="mt-1 text-xs font-bold text-red-500 hover:text-red-600"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <input
                        ref={(el) => { fileRefs.current[method.id] = el }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleQrFile(method.id, e)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-60"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modes de paiement'}
        </button>
      </div>
    </AppShell>
  )
}
