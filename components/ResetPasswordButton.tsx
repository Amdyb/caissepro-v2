'use client'

import { supabase } from '@/lib/supabaseClient'
import { Check, Copy, KeyRound, Loader2, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  // Provide either an email (admins/agents) or a businessId (resolves the owner).
  email?: string | null
  businessId?: string | null
  name?: string
  phone?: string | null
  className?: string
}

const SUPPORT_LOGIN_URL = 'caissepro.app'

export default function ResetPasswordButton({ email, businessId, name, phone, className }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function doReset() {
    setLoading(true)
    setError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: email || undefined, businessId: businessId || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Échec de la réinitialisation.')
        setLoading(false)
        return
      }
      setResult({ email: data.email, tempPassword: data.tempPassword })
      setConfirming(false)
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  function copyPassword() {
    if (!result) return
    navigator.clipboard.writeText(result.tempPassword).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => null)
  }

  function sendWhatsApp() {
    if (!result) return
    const msg = `Bonjour ${name || ''}, votre mot de passe temporaire CaissePro est : ${result.tempPassword}\nConnectez-vous sur ${SUPPORT_LOGIN_URL} et changez-le immédiatement.`
    const digits = (phone || '').replace(/\D/g, '')
    const url = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  function close() {
    setResult(null)
    setError('')
    setCopied(false)
  }

  return (
    <>
      <button
        onClick={() => { setConfirming(true); setError('') }}
        className={className || 'flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white/70 hover:bg-white/10'}
      >
        <KeyRound size={15} /> Réinitialiser mot de passe
      </button>

      {/* Confirm */}
      {confirming && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => !loading && setConfirming(false)}>
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white">Réinitialiser le mot de passe ?</h2>
            <p className="mt-2 text-sm font-bold text-white/50">
              {name || email || 'Cet utilisateur'} recevra un mot de passe temporaire et devra le changer à la prochaine connexion.
            </p>
            {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={doReset}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Réinitialisation...</> : 'Confirmer'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="flex-1 rounded-2xl border border-white/10 py-3 font-black text-white/70 hover:bg-white/10 disabled:opacity-60"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Mot de passe réinitialisé</h2>
              <button onClick={close} className="rounded-xl border border-white/10 p-2 text-white/50 hover:bg-white/10"><X size={16} /></button>
            </div>
            <p className="text-sm font-bold text-white/50">{result.email}</p>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
              <code className="text-lg font-black tracking-wider text-emerald-300">{result.tempPassword}</code>
              <button
                onClick={copyPassword}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500"
              >
                {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
              </button>
            </div>

            <p className="mt-3 text-xs font-bold text-white/40">
              L&apos;utilisateur devra changer ce mot de passe à la première connexion.
            </p>

            <button
              onClick={sendWhatsApp}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-500"
            >
              <MessageCircle size={16} /> Envoyer par WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  )
}
