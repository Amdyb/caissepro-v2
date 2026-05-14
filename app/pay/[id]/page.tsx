'use client'

import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, CreditCard, MessageCircle, ShieldCheck, Store } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type PaymentLink = {
  id: string
  business_id: string
  reference_type: string | null
  provider: string | null
  amount: number | null
  currency: string | null
  status: string | null
  payment_url: string | null
  note: string | null
  created_at: string
  businesses?: {
    name: string | null
    logo_url: string | null
    whatsapp_number: string | null
    business_phone: string | null
    primary_color: string | null
  } | null
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

function reasonLabel(value: string | null) {
  if (value === 'debt') return 'Client Doit'
  if (value === 'rent') return 'Loyer'
  if (value === 'tontine') return 'Tontine'
  if (value === 'order') return 'Commande'
  if (value === 'invoice') return 'Facture'
  return 'Paiement'
}

export default function PublicPaymentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [payment, setPayment] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadPayment() {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*, businesses(name, logo_url, whatsapp_number, business_phone, primary_color)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setMessage('Lien de paiement introuvable.')
        setLoading(false)
        return
      }

      setPayment(data as unknown as PaymentLink)
      setLoading(false)
    }

    loadPayment()
  }, [id])

  function confirmWhatsApp() {
    if (!payment) return

    const business = payment.businesses
    const phone = (business?.whatsapp_number || business?.business_phone || '').replace(/\D/g, '')
    const text = `Bonjour ${business?.name || ''}, je confirme le paiement de ${cfa(Number(payment.amount || 0))} pour ${reasonLabel(payment.reference_type)}. Référence: ${payment.id.slice(0, 8)}.`
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement paiement...</p></main>
  }

  if (!payment || message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CreditCard className="mx-auto text-slate-300" size={56} />
          <h1 className="mt-5 text-2xl font-black text-slate-950">Paiement indisponible</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">{message || 'Ce lien est introuvable.'}</p>
        </div>
      </main>
    )
  }

  const business = payment.businesses
  const primary = business?.primary_color || '#16a34a'
  const isPaid = payment.status === 'paid'

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm">
            {business?.logo_url ? <img src={business.logo_url} alt={business?.name || 'Logo'} className="h-full w-full object-contain p-2" /> : <Store className="text-slate-300" size={38} />}
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-950">{business?.name || 'CaissePro'}</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">Paiement sécurisé par CaissePro</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="p-7 text-white" style={{ backgroundColor: primary }}>
            <p className="text-sm font-black opacity-80">Montant à payer</p>
            <p className="mt-2 text-5xl font-black tracking-tight">{cfa(Number(payment.amount || 0))}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur">{reasonLabel(payment.reference_type)}</p>
          </div>

          <div className="p-7">
            {isPaid ? (
              <div className="mb-6 rounded-3xl bg-emerald-50 p-5 text-center">
                <CheckCircle className="mx-auto text-emerald-600" size={44} />
                <h2 className="mt-3 text-xl font-black text-emerald-700">Paiement marqué comme payé</h2>
                <p className="mt-2 text-sm font-semibold text-emerald-700/80">Merci. Contactez la boutique pour toute confirmation.</p>
              </div>
            ) : (
              <div className="mb-6 rounded-3xl bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-1 text-amber-600" />
                  <div>
                    <h2 className="font-black text-slate-950">Instructions de paiement</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Payez avec la méthode indiquée par le vendeur. Ensuite, envoyez une confirmation WhatsApp avec la référence ci-dessous.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm font-semibold text-slate-600">
              <div className="flex justify-between rounded-2xl bg-slate-50 p-4"><span>Référence</span><span className="font-black text-slate-950">#{payment.id.slice(0, 8)}</span></div>
              <div className="flex justify-between rounded-2xl bg-slate-50 p-4"><span>Statut</span><span className="font-black text-slate-950">{payment.status || 'pending'}</span></div>
              <div className="flex justify-between rounded-2xl bg-slate-50 p-4"><span>Méthode</span><span className="font-black text-slate-950">{payment.provider || 'manual'}</span></div>
            </div>

            {payment.note && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                {payment.note}
              </div>
            )}

            <div className="mt-7 space-y-3">
              {payment.payment_url && (
                <a href={payment.payment_url} target="_blank" className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white" style={{ backgroundColor: primary }}>
                  <CreditCard size={18} />
                  Payer maintenant
                </a>
              )}

              <button onClick={confirmWhatsApp} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-sm font-black text-white hover:bg-green-700">
                <MessageCircle size={18} />
                Confirmer sur WhatsApp
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-bold text-slate-400">Powered by CaissePro</p>
      </div>
    </main>
  )
}
