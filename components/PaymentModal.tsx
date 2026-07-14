'use client'

import { supabase } from '@/lib/supabaseClient'
import { usePlatformSettings } from '@/lib/usePlatformSettings'
import { PAYMENTS_CARD_ENABLED, PAYMENTS_PAYDUNYA_ENABLED, DEFAULT_PAYMENT_NUMBER } from '@/lib/paymentConfig'
import { Check, CheckCircle2, Copy, CreditCard, Loader2, X } from 'lucide-react'
import { memo, useState } from 'react'

type Plan = { id: string; name: string; price: string; amount: number }

type Props = {
  plan: Plan
  businessId: string | null
  businessName: string
  userEmail: string
  onClose: () => void
}

function PaymentModal({ plan, businessId, businessName, userEmail, onClose }: Props) {
  const settings = usePlatformSettings()
  const waveNumber = settings.payment_wave_number || DEFAULT_PAYMENT_NUMBER
  const orangeNumber = settings.payment_orange_number || DEFAULT_PAYMENT_NUMBER

  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [cardLoading, setCardLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [copied, setCopied] = useState('')

  function copyNumber(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    }).catch(() => null)
  }

  // ── Card (Stripe) — hidden behind feature flag, kept ready ──
  async function payByCard() {
    if (!businessId) { setError('Boutique introuvable. Veuillez réessayer.'); return }
    setCardLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId, plan: plan.id, amount: plan.amount,
          billingPeriod: 'monthly', businessName, email: userEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || "Erreur lors de l'initialisation du paiement par carte.")
        setCardLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
      setCardLoading(false)
    }
  }

  // ── PayDunya — hidden behind feature flag, kept ready ──
  async function payOnline() {
    if (!businessId) { setError('Boutique introuvable. Veuillez réessayer.'); return }
    setOnlineLoading(true)
    setError('')
    try {
      const res = await fetch('/api/paydunya/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.name, amount: plan.amount, businessId,
          businessName, email: userEmail, country: 'Sénégal',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.payment_url) {
        setError(data.error || "Erreur lors de l'initialisation du paiement.")
        setOnlineLoading(false)
        return
      }
      window.location.href = data.payment_url
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
      setOnlineLoading(false)
    }
  }

  // ── Manual Wave / Orange Money — PRIMARY billing method ──
  async function confirmManualPayment() {
    if (!paymentRef.trim()) {
      setError('Veuillez entrer le numéro de transaction ou le téléphone utilisé pour le paiement.')
      return
    }
    setLoading(true)
    setError('')

    let requestId: string | null = null

    if (businessId) {
      const { data } = await supabase.from('upgrade_requests').insert({
        business_id: businessId,
        business_name: businessName || 'Inconnu',
        user_email: userEmail,
        plan: plan.id,
        price: `${plan.price} XOF/mois`,
        amount: plan.amount,
        payment_reference: paymentRef.trim(),
        status: 'pending',
        whatsapp_sent: false,
      }).select('id').single()
      requestId = data?.id ?? null
    }

    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: DEFAULT_PAYMENT_NUMBER,
          body: `NOUVEAU PAIEMENT CAISSEPRO\nBoutique: ${businessName}\nPlan: ${plan.name}\nMontant: ${plan.amount.toLocaleString('fr-FR')} XOF\nRéférence: ${paymentRef.trim()}\nEmail: ${userEmail}\nApprouvez sur caissepro.app/super-admin/subscriptions`,
        }),
      })
      if (requestId) {
        await supabase.from('upgrade_requests').update({ whatsapp_sent: true }).eq('id', requestId)
      }
    } catch { /* non-blocking */ }

    setDone(true)
    setLoading(false)
  }

  const showOnlineSection = PAYMENTS_CARD_ENABLED || PAYMENTS_PAYDUNYA_ENABLED

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Paiement</p>
            <h2 className="text-2xl font-black text-slate-950">Plan {plan.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        {!done ? (
          <div className="p-6">
            {/* Plan + promo */}
            <div className="mb-5 rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Plan {plan.name}</p>
              <p className="mt-1 text-4xl font-black text-slate-950">{plan.price} XOF<span className="text-base font-black text-slate-400">/mois</span></p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white">
                1 mois offert pour les nouveaux inscrits
              </div>
            </div>

            {/* Card (Stripe) — feature-flagged */}
            {PAYMENTS_CARD_ENABLED && (
              <>
                <button
                  onClick={payByCard}
                  disabled={cardLoading}
                  className="mb-1 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {cardLoading
                    ? <><Loader2 size={18} className="animate-spin" /> Redirection...</>
                    : <><CreditCard size={18} /> Payer par carte (Visa/Mastercard)</>}
                </button>
                <p className="mb-5 text-center text-xs font-bold text-slate-400">Paiement sécurisé par Stripe — Activation automatique</p>
              </>
            )}

            {/* PayDunya — feature-flagged */}
            {PAYMENTS_PAYDUNYA_ENABLED && (
              <>
                <button
                  onClick={payOnline}
                  disabled={onlineLoading}
                  className="mb-1 flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 py-4 font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                >
                  {onlineLoading
                    ? <><Loader2 size={18} className="animate-spin" /> Redirection...</>
                    : <><CreditCard size={18} /> Payer via PayDunya (Mobile Money)</>}
                </button>
                <p className="mb-5 text-center text-xs font-bold text-slate-400">Mobile Money — Activation automatique</p>
              </>
            )}

            {showOnlineSection && (
              <div className="mb-5 flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs font-black text-slate-400">OU</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
            )}

            {/* ── Manual Wave / Orange Money (primary) ── */}
            <div className="rounded-2xl border-2 border-emerald-100 bg-white p-5">
              {/* Step 1 */}
              <div className="mb-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">1</span>
                  <p className="pt-0.5 text-sm font-black text-slate-800">
                    Envoyez <span className="text-emerald-700">{plan.amount.toLocaleString('fr-FR')} XOF</span> à l&apos;un de ces numéros :
                  </p>
                </div>
                <div className="mt-3 space-y-2 pl-10">
                  {/* Wave */}
                  <div className="flex items-center justify-between rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-black uppercase text-blue-700">Wave</p>
                      <p className="text-base font-black tracking-wide text-slate-950">{waveNumber}</p>
                    </div>
                    <button
                      onClick={() => copyNumber(waveNumber, 'wave')}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700"
                    >
                      {copied === 'wave' ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                    </button>
                  </div>
                  {/* Orange Money */}
                  <div className="flex items-center justify-between rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-black uppercase text-orange-700">Orange Money</p>
                      <p className="text-base font-black tracking-wide text-slate-950">{orangeNumber}</p>
                    </div>
                    <button
                      onClick={() => copyNumber(orangeNumber, 'orange')}
                      className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white transition hover:bg-orange-600"
                    >
                      {copied === 'orange' ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">2</span>
                  <p className="pt-0.5 text-sm font-black text-slate-800">
                    Entrez le numéro de transaction ou le téléphone utilisé :
                  </p>
                </div>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ex: TXN123456 ou +221 77 123 45 67"
                  className="mt-3 ml-10 w-[calc(100%-2.5rem)] rounded-2xl border border-slate-300 px-4 py-3 font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">3</span>
                <p className="pt-0.5 text-sm font-black text-slate-800">
                  Cliquez sur « J&apos;ai effectué le paiement »
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>
            )}

            <button
              onClick={confirmManualPayment}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Envoi en cours...' : "J'ai effectué le paiement"}
            </button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="text-emerald-600" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-950">Demande envoyée !</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              Votre plan sera activé sous 24h après vérification du paiement.
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

export default memo(PaymentModal)
