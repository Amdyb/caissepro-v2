'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Printer, ReceiptText } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type SaleItem = {
  id: string
  quantity: number | null
  price: number | null
  total: number | null
  product_name?: string | null
  product_image?: string | null
  unit_price?: number | null
  products?: { name: string; image?: string | null } | null
}

type Sale = {
  id: string
  receipt_number?: string | null
  business_id: string
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_method: string | null
  status: string | null
  created_at: string
  sale_items?: SaleItem[]
  businesses?: {
    name: string
    phone: string | null
    email: string | null
    address: string | null
    currency: string | null
    logo_url?: string | null
  } | null
  customers?: { full_name: string; phone: string | null } | null
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  card: 'Carte bancaire',
  credit: 'Client Doit',
}

const SALE_QUERY = `
  *,
  businesses ( name, phone, email, address, currency, logo_url ),
  customers ( full_name, phone ),
  sale_items (
    id, quantity, price, total,
    product_name, product_image, unit_price,
    products ( name, image )
  )
`

export default function PremiumReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const saleId = params.id as string

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      await loadSale()
      setLoading(false)
    }
    init()
  }, [saleId])

  async function loadSale() {
    let { data, error } = await supabase
      .from('sales')
      .select(SALE_QUERY)
      .eq('id', saleId)
      .maybeSingle()

    if (!data && !error) {
      const result = await supabase
        .from('sales')
        .select(SALE_QUERY)
        .eq('receipt_number', saleId)
        .maybeSingle()
      data = result.data
      error = result.error
    }

    if (error) { setErrorMsg(error.message); return }
    if (!data) { setErrorMsg('Cette vente est introuvable.'); return }
    setSale(data as Sale)
  }

  const receiptNumber = useMemo(() => {
    if (!sale) return ''
    return sale.receipt_number || `REC-${sale.id.slice(0, 8).toUpperCase()}`
  }, [sale])

  const whatsAppText = useMemo(() => {
    if (!sale) return ''
    const biz = sale.businesses?.name || 'CaissePro'
    const date = new Date(sale.created_at).toLocaleDateString('fr-FR')
    const time = new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const customer = sale.customers?.full_name || 'Client comptoir'
    const payment = PAYMENT_LABELS[sale.payment_method || ''] || sale.payment_method || 'Non précisé'

    const items = (sale.sale_items || []).map((item) => {
      const name = item.product_name || item.products?.name || 'Article'
      const qty = item.quantity || 1
      const unit = Number(item.unit_price ?? item.price ?? 0)
      const sub = Number(item.total || unit * qty)
      return `• ${name}\n  ${qty} × ${unit.toLocaleString('fr-FR')} = *${sub.toLocaleString('fr-FR')} CFA*`
    }).join('\n')

    const total = Number(sale.total || 0).toLocaleString('fr-FR')
    const remaining = Number(sale.remaining_amount || 0)

    let text = `🧾 *REÇU DE VENTE — ${biz.toUpperCase()}*\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n`
    text += `📋 N° ${receiptNumber}\n`
    text += `📅 ${date} à ${time}\n`
    text += `👤 Client : ${customer}\n`
    text += `💳 Paiement : ${payment}\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n`
    text += `🛍️ *ARTICLES*\n\n${items}\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n`
    text += `💰 *TOTAL : ${total} CFA*\n`
    if (remaining > 0) text += `⚠️ Reste dû : ${remaining.toLocaleString('fr-FR')} CFA\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n`
    text += `🙏 Merci pour votre confiance !\n`
    text += `_Propulsé par CaissePro_`

    return text
  }, [sale, receiptNumber])

  function shareWhatsApp() {
    const phone = sale?.customers?.phone
      ? String(sale.customers.phone).replace(/\D/g, '')
      : ''
    const encoded = encodeURIComponent(whatsAppText)
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Chargement du reçu...</p>
      </main>
    )
  }

  if (!sale) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
          <ReceiptText className="mx-auto mb-4 text-slate-300" size={52} />
          <h1 className="text-2xl font-black text-slate-950">Reçu introuvable</h1>
          <p className="mt-2 text-slate-500">{errorMsg || 'Cette vente est introuvable.'}</p>
          <Link href="/sales" className="mt-6 inline-block rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white">
            Retour aux ventes
          </Link>
        </div>
      </main>
    )
  }

  const date = new Date(sale.created_at)
  const biz = sale.businesses
  const items = sale.sale_items || []
  const total = Number(sale.total || 0)
  const remaining = Number(sale.remaining_amount || 0)
  const paid = Number(sale.paid_amount || 0)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .receipt-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            href={`/sales/${saleId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Retour
          </Link>

          <div className="flex gap-3">
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <MessageCircle size={16} /> Partager sur WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            >
              <Printer size={16} /> Imprimer
            </button>
          </div>
        </div>
      </header>

      {/* Receipt */}
      <main className="min-h-screen bg-slate-100 py-10 px-4">
        <div className="receipt-card mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl">

          {/* Header band */}
          <div className="rounded-t-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-8 text-white">
            <div className="flex items-center gap-5">
              {biz?.logo_url ? (
                <img
                  src={biz.logo_url}
                  alt={biz.name}
                  className="h-16 w-16 rounded-2xl border-2 border-white/30 object-cover bg-white shadow-lg"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/20 text-3xl font-black shadow-lg">
                  {(biz?.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl font-black leading-tight">{biz?.name || 'CaissePro'}</h1>
                {biz?.address && <p className="mt-0.5 text-sm font-semibold text-emerald-100">{biz.address}</p>}
                {biz?.phone && <p className="text-sm font-semibold text-emerald-100">{biz.phone}</p>}
                {biz?.email && <p className="text-sm font-semibold text-emerald-100">{biz.email}</p>}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">

            {/* Receipt meta */}
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">N° Reçu</span>
                <span className="font-black text-slate-950">{receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Date</span>
                <span className="font-black text-slate-950">
                  {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Heure</span>
                <span className="font-black text-slate-950">
                  {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Paiement</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                  sale.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                  sale.payment_method === 'wave' ? 'bg-sky-100 text-sky-700' :
                  sale.payment_method === 'orange_money' ? 'bg-orange-100 text-orange-700' :
                  sale.payment_method === 'credit' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {PAYMENT_LABELS[sale.payment_method || ''] || sale.payment_method || 'Non précisé'}
                </span>
              </div>
              {sale.customers?.full_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Client</span>
                  <span className="font-black text-slate-950">{sale.customers.full_name}</span>
                </div>
              )}
              {sale.customers?.phone && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Téléphone</span>
                  <span className="font-black text-slate-950">{sale.customers.phone}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-2 border-dashed border-slate-200" />
              <ReceiptText size={16} className="text-slate-300 shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-slate-200" />
            </div>

            {/* Items */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Articles</p>
              {items.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">Aucun article.</p>
              ) : (
                items.map((item) => {
                  const name = item.product_name || item.products?.name || 'Article'
                  const image = item.product_image || item.products?.image
                  const qty = item.quantity || 1
                  const unit = Number(item.unit_price ?? item.price ?? 0)
                  const sub = Number(item.total || unit * qty)

                  return (
                    <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-950">{name}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">
                          {qty} × {unit.toLocaleString('fr-FR')} CFA
                        </p>
                      </div>

                      <p className="shrink-0 font-black text-slate-950">
                        {sub.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-500">CFA</span>
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-slate-200" />

            {/* Totals */}
            <div className="space-y-2">
              {paid > 0 && paid !== total && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">Montant payé</span>
                  <span className="font-black text-emerald-700">{paid.toLocaleString('fr-FR')} CFA</span>
                </div>
              )}
              {remaining > 0 && (
                <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-2.5 text-sm">
                  <span className="font-bold text-red-700">Reste dû</span>
                  <span className="font-black text-red-700">{remaining.toLocaleString('fr-FR')} CFA</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-5 py-4">
                <span className="text-lg font-black text-emerald-900">TOTAL</span>
                <span className="text-2xl font-black text-emerald-700">
                  {total.toLocaleString('fr-FR')} <span className="text-base">CFA</span>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-2xl bg-slate-950 px-6 py-5 text-center">
              <p className="text-sm font-black text-white">Merci pour votre confiance !</p>
              <p className="mt-1 text-xs font-bold text-slate-400">Propulsé par CaissePro</p>
            </div>

            {/* WhatsApp CTA inside receipt card */}
            <button
              onClick={shareWhatsApp}
              className="no-print flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <MessageCircle size={18} /> Partager sur WhatsApp
            </button>

          </div>
        </div>

        {/* WhatsApp / Print buttons below receipt on mobile */}
        <div className="no-print mx-auto mt-6 flex max-w-lg gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
          >
            <MessageCircle size={18} /> Partager sur WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Printer size={18} />
          </button>
        </div>
      </main>
    </>
  )
}
