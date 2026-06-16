'use client'

import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, ChevronDown, CreditCard, Loader2, X } from 'lucide-react'
import { useState } from 'react'

type Plan = { id: string; name: string; price: string; amount: number }

type Props = {
  plan: Plan
  businessId: string | null
  businessName: string
  userEmail: string
  onClose: () => void
}

type CountryConfig = {
  label: string
  methods: string[]
  waveAvailable: boolean
  orangeAvailable: boolean
}

const COUNTRIES: Record<string, CountryConfig> = {
  'Sénégal':       { label: '🇸🇳 Sénégal',        methods: ['Wave', 'Orange Money', 'Free Money', 'Carte bancaire'], waveAvailable: true,  orangeAvailable: true  },
  "Côte d'Ivoire": { label: "🇨🇮 Côte d'Ivoire",  methods: ['Orange Money', 'MTN', 'Moov', 'Carte bancaire'],       waveAvailable: false, orangeAvailable: true  },
  'Mali':          { label: '🇲🇱 Mali',            methods: ['Orange Money', 'Moov', 'Carte bancaire'],               waveAvailable: false, orangeAvailable: true  },
  'Burkina Faso':  { label: '🇧🇫 Burkina Faso',    methods: ['Orange Money', 'Moov', 'Carte bancaire'],               waveAvailable: false, orangeAvailable: true  },
  'Togo':          { label: '🇹🇬 Togo',            methods: ['Flooz', 'T-Money', 'Carte bancaire'],                   waveAvailable: false, orangeAvailable: false },
  'Bénin':         { label: '🇧🇯 Bénin',           methods: ['MTN', 'Moov', 'Carte bancaire'],                        waveAvailable: false, orangeAvailable: false },
  'Niger':         { label: '🇳🇪 Niger',           methods: ['Orange Money', 'Carte bancaire'],                       waveAvailable: false, orangeAvailable: true  },
  'Cameroun':      { label: '🇨🇲 Cameroun',        methods: ['Orange Money', 'MTN', 'Carte bancaire'],                waveAvailable: false, orangeAvailable: true  },
  'Guinée':        { label: '🇬🇳 Guinée',          methods: ['Orange Money', 'Carte bancaire'],                       waveAvailable: false, orangeAvailable: true  },
}

export default function PaymentModal({ plan, businessId, businessName, userEmail, onClose }: Props) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [cardLoading, setCardLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('Sénégal')
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  const countryConfig = COUNTRIES[selectedCountry] || COUNTRIES['Sénégal']

  async function payByCard() {
    if (!businessId) { setError('Boutique introuvable. Veuillez réessayer.'); return }
    setCardLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          plan: plan.id,
          amount: plan.amount,
          billingPeriod: 'monthly',
          businessName,
          email: userEmail,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error || "Erreur lors de l'initialisation du paiement par carte.")
        setCardLoading(false)
        return
      }

      window.location.href = data.url
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.')
      setCardLoading(false)
    }
  }

  async function payOnline() {
    if (!businessId) { setError('Boutique introuvable. Veuillez réessayer.'); return }
    setOnlineLoading(true)
    setError('')

    try {
      const res = await fetch('/api/paydunya/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.name,
          amount: plan.amount,
          businessId,
          businessName,
          email: userEmail,
          country: selectedCountry,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.payment_url) {
        setError(data.error || "Erreur lors de l'initialisation du paiement.")
        setOnlineLoading(false)
        return
      }

      window.location.href = data.payment_url
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.')
      setOnlineLoading(false)
    }
  }

  async function confirmManualPayment() {
    setLoading(true)
    setError('')

    let requestId: string | null = null

    if (businessId) {
      const { data } = await supabase.from('upgrade_requests').insert({
        business_id: businessId,
        business_name: businessName || 'Inconnu',
        user_email: userEmail,
        plan: plan.name,
        price: `${plan.price} XOF/mois`,
        status: 'pending',
        whatsapp_sent: false,
      }).select('id').single()
      requestId = data?.id ?? null
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '+221784581111',
          body: `💰 NOUVEAU PAIEMENT CAISSEPRO\nBoutique: ${businessName}\nPlan: ${plan.name}\nMontant: ${plan.amount.toLocaleString('fr-FR')} XOF\nEmail: ${userEmail}\nDate: ${dateStr}`,
        }),
      })
      if (requestId) {
        await supabase.from('upgrade_requests').update({ whatsapp_sent: true }).eq('id', requestId)
      }
    } catch { /* non-blocking */ }

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

            {/* Country selector */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Votre pays</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  <span>{countryConfig.label}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} />
                </button>
                {showCountryPicker && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {Object.entries(COUNTRIES).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setSelectedCountry(key); setShowCountryPicker(false) }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition hover:bg-slate-50 ${selectedCountry === key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Available methods */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {countryConfig.methods.map((m) => (
                  <span key={m} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{m}</span>
                ))}
              </div>
            </div>

            {/* Card payment — Stripe (Visa / Mastercard) */}
            <button
              onClick={payByCard}
              disabled={cardLoading}
              className="mb-1 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {cardLoading
                ? <><Loader2 size={18} className="animate-spin" /> Redirection...</>
                : <><CreditCard size={18} /> Payer par carte (Visa/Mastercard)</>
              }
            </button>
            <p className="mb-5 text-center text-xs font-bold text-slate-400">
              Paiement sécurisé par Stripe — Activation automatique
            </p>

            {/* Online payment — PayDunya (ready when live) */}
            <button
              onClick={payOnline}
              disabled={onlineLoading}
              className="mb-1 flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 py-4 font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              {onlineLoading
                ? <><Loader2 size={18} className="animate-spin" /> Redirection...</>
                : <><CreditCard size={18} /> Payer via PayDunya (Mobile Money)</>
              }
            </button>
            <p className="mb-5 text-center text-xs font-bold text-slate-400">
              {countryConfig.methods.join(', ')} — Activation automatique
            </p>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs font-black text-slate-400">OU</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Manual Mobile Money — show Wave/Orange only for Senegal */}
            <p className="mb-1 text-center text-base font-black text-slate-950">
              Payer avec Wave / Orange Money
            </p>
            <p className="mb-3 text-center text-sm font-bold text-slate-500">
              Envoyez le montant au numéro de votre choix
            </p>
            <div className={`mb-5 grid gap-3 ${countryConfig.waveAvailable && countryConfig.orangeAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {countryConfig.waveAvailable && (
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="text-sm font-black text-blue-700">WAVE</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`wave://pay?to=+221784581111&amount=${plan.amount}`)}`}
                    alt="QR code Wave"
                    className="mx-auto mt-3 h-36 w-36 rounded-lg"
                  />
                  <p className="mt-2 text-[10px] font-bold text-blue-600">Scanner avec Wave</p>
                  <p className="mt-1 text-sm font-black tracking-wide text-slate-950">+221 78 458 11 11</p>
                </div>
              )}
              {countryConfig.orangeAvailable && (
                <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
                  <p className="text-sm font-black text-orange-700">ORANGE MONEY</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`orangemoney://pay?phone=+221789621111&amount=${plan.amount}`)}`}
                    alt="QR code Orange Money"
                    className="mx-auto mt-3 h-36 w-36 rounded-lg"
                  />
                  <p className="mt-2 text-[10px] font-bold text-orange-600">Scanner avec Orange Money</p>
                  <p className="mt-1 text-sm font-black tracking-wide text-slate-950">+221 78 962 11 11</p>
                </div>
              )}
              {!countryConfig.waveAvailable && !countryConfig.orangeAvailable && (
                <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-sm font-black text-slate-600">PAIEMENT MANUEL</p>
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Contactez-nous via WhatsApp pour un paiement manuel dans votre pays.
                  </p>
                  <a
                    href={`https://wa.me/221784581111?text=${encodeURIComponent(`Je souhaite payer l'abonnement ${plan.name} - ${plan.price} XOF - Pays: ${selectedCountry}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                  >
                    Contacter via WhatsApp
                  </a>
                </div>
              )}
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
              Demande envoyée ! Vous serez contacté sous 24h via WhatsApp pour l'activation.
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
