'use client'

import { supabase } from '@/lib/supabaseClient'
import { sendPaymentConfirmation } from '@/lib/whatsapp'
import { CheckCircle2, CreditCard, Loader2, X } from 'lucide-react'
import { useState } from 'react'

type Plan = { id: string; name: string; price: string; amount: number }

type Props = {
  plan: Plan
  businessId: string | null
  businessName: string
  userEmail: string
  onClose: () => void
}

export default function PaymentModal({ plan, businessId, businessName, userEmail, onClose }: Props) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [error, setError] = useState('')

  async function payOnline() {
    console.log('[PayDunya] payOnline clicked — businessId:', businessId, 'plan:', plan.name, 'amount:', plan.amount)
    if (!businessId) { setError('Boutique introuvable. Veuillez réessayer.'); return }
    setOnlineLoading(true)
    setError('')

    try {
      console.log('[PayDunya] calling /api/paydunya/checkout...')
      const res = await fetch('/api/paydunya/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.name, amount: plan.amount, businessId, businessName, email: userEmail }),
      })
      const data = await res.json()
      console.log('[PayDunya] response:', res.status, data)

      if (!res.ok || !data.payment_url) {
        const errMsg = data.error || "Erreur lors de l'initialisation du paiement."
        console.error('[PayDunya] no payment_url:', errMsg)
        setError(errMsg)
        setOnlineLoading(false)
        return
      }

      console.log('[PayDunya] redirecting to:', data.payment_url)
      window.location.href = data.payment_url
    } catch (err) {
      console.error('[PayDunya] fetch error:', err)
      setError('Erreur de connexion. Veuillez réessayer.')
      setOnlineLoading(false)
    }
  }

  async function confirmManualPayment() {
    setLoading(true)
    setError('')
    if (businessId) {
      try {
        await supabase.from('upgrade_requests').insert({
          business_id: businessId,
          business_name: businessName || 'Inconnu',
          user_email: userEmail,
          plan: plan.name,
          price: `${plan.price} XOF/mois`,
          status: 'pending',
          whatsapp_sent: true,
          duration_months: 2,
        })
      } catch { /* non-blocking */ }
    }
    await sendPaymentConfirmation(businessName, plan.name, plan.amount, userEmail)
    setDone(true)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Paiement</p>
            <h2 className="text-2xl font-black text-slate-950">{plan.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        {!done ? (
          <div className="p-6">
            {/* Price + promo */}
            <div className="mb-5 rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="text-5xl font-black text-slate-950">{plan.price} XOF</p>
              <p className="mt-1 text-xs font-black text-slate-400">par mois</p>
              <div className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white">
                Offre spéciale : Payez {plan.price} XOF pour 1 mois et bénéficiez de 2 mois d'utilisation gratuite !
              </div>
            </div>

            {/* Online payment — PayDunya */}
            <button
              onClick={payOnline}
              disabled={onlineLoading}
              className="mb-1 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {onlineLoading
                ? <><Loader2 size={18} className="animate-spin" /> Redirection...</>
                : <><CreditCard size={18} /> Payer en ligne — Rapide &amp; Sécurisé</>
              }
            </button>
            <p className="mb-5 text-center text-xs font-bold text-slate-400">
              Wave, Orange Money, Carte bancaire — Activation automatique
            </p>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs font-black text-slate-400">OU</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Manual Mobile Money */}
            <p className="mb-3 text-center text-sm font-bold text-slate-500">
              Envoyez le montant au numéro de votre choix
            </p>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-sm font-black text-blue-700">WAVE</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`wave://pay?to=+221784581111&amount=${plan.amount}`)}`}
                  alt="QR code Wave"
                  className="mx-auto mt-3 h-36 w-36 rounded-lg"
                />
                <p className="mt-2 text-[10px] font-bold text-blue-600">Scanner avec Wave</p>
                <p className="mt-1 text-sm font-black tracking-wide text-slate-950">+221 78 458 11 11</p>
              </div>
              <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
                <p className="text-sm font-black text-orange-700">ORANGE MONEY</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`orangemoney://pay?phone=+221789621111&amount=${plan.amount}`)}`}
                  alt="QR code Orange Money"
                  className="mx-auto mt-3 h-36 w-36 rounded-lg"
                />
                <p className="mt-2 text-[10px] font-bold text-orange-600">Scanner avec Orange Money</p>
                <p className="mt-1 text-sm font-black tracking-wide text-slate-950">+221 78 962 11 11</p>
              </div>
            </div>

            <p className="mb-4 text-center text-xs font-semibold text-slate-400">
              Après paiement mobile, cliquez ci-dessous pour confirmer votre demande.
            </p>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>
            )}

            <button
              onClick={confirmManualPayment}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {loading ? 'Envoi en cours...' : "J'ai effectué le paiement mobile"}
            </button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="text-emerald-600" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-950">Demande envoyée !</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              Votre demande est en cours de traitement. Vous serez contacté sous 24h.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-slate-950 py-4 font-black text-white transition hover:bg-slate-800"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
