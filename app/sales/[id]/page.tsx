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
  products?: {
    name: string
  } | null
}

type Sale = {
  id: string
  business_id: string
  cashier_id: string | null
  customer_id: string | null
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
  } | null
  customers?: {
    full_name: string
    phone: string | null
  } | null
}

function paymentLabel(method: string | null) {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'wave':
      return 'Wave'
    case 'orange_money':
      return 'Orange Money'
    case 'card':
      return 'Carte'
    case 'credit':
      return 'Client Doit'
    default:
      return method || 'Non précisé'
  }
}

export default function ReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const saleId = params.id as string

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('80mm')

  const receiptText = useMemo(() => {
    if (!sale) return ''

    const business = sale.businesses?.name || 'CaissePro'
    const date = new Date(sale.created_at)
    const lines = (sale.sale_items || [])
      .map((item) => {
        const name = item.products?.name || 'Produit'
        return `- ${name} x${item.quantity || 0}: ${Number(item.total || 0).toLocaleString('fr-FR')} CFA`
      })
      .join('\\n')

    const customerLine = sale.customers?.full_name
      ? `Client: ${sale.customers.full_name}${sale.customers.phone ? ` (${sale.customers.phone})` : ''}\\n`
      : ''

    const debtLine = Number(sale.remaining_amount || 0) > 0
      ? `Reste à payer: ${Number(sale.remaining_amount || 0).toLocaleString('fr-FR')} CFA\\n`
      : ''

    return `Reçu ${business}\\nVente #${sale.id.slice(0, 8)}\\nDate: ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\\n${customerLine}\\n${lines}\\n\\nTotal: ${Number(sale.total || 0).toLocaleString('fr-FR')} CFA\\nPaiement: ${paymentLabel(sale.payment_method)}\\n${debtLine}Merci pour votre achat.`
  }, [sale])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      await loadSale()
      setLoading(false)
    }

    init()
  }, [router, saleId])

  async function loadSale() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        businesses (
          name,
          phone,
          email,
          address,
          currency
        ),
        customers (
          full_name,
          phone
        ),
        sale_items (
          id,
          quantity,
          price,
          total,
          products (
            name
          )
        )
      `)
      .eq('id', saleId)
      .single()

    if (error) {
      setMessage(error.message)
      return
    }

    setSale(data as Sale)
  }

  function printReceipt() {
    window.print()
  }

  function shareWhatsApp() {
    const encoded = encodeURIComponent(receiptText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement du reçu...</p>
      </main>
    )
  }

  if (!sale) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ReceiptText className="mx-auto text-slate-400" size={44} />
          <h1 className="mt-4 text-2xl font-black text-slate-950">Reçu introuvable</h1>
          <p className="mt-2 text-slate-500">{message || 'Cette vente est introuvable.'}</p>
          <Link href="/sales" className="mt-6 inline-block rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">
            Retour aux ventes
          </Link>
        </div>
      </main>
    )
  }

  const date = new Date(sale.created_at)
  const receiptWidthClass = paperSize === '58mm' ? 'max-w-[260px]' : 'max-w-[360px]'

  return (
    <main className="min-h-screen bg-slate-50">
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperSize};
            margin: 4mm;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt-shell {
            border: none !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
            max-width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
          }

          .receipt-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            font-size: ${paperSize === '58mm' ? '10px' : '12px'} !important;
            line-height: 1.25 !important;
          }

          .thermal-title {
            font-size: ${paperSize === '58mm' ? '16px' : '20px'} !important;
          }

          .thermal-total {
            font-size: ${paperSize === '58mm' ? '18px' : '22px'} !important;
          }
        }
      `}</style>

      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/sales" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
            <ArrowLeft size={16} /> Historique des ventes
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as '58mm' | '80mm')}
            >
              <option value="80mm">Thermal 80mm</option>
              <option value="58mm">Thermal 58mm</option>
            </select>

            <button onClick={shareWhatsApp} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100">
              <MessageCircle size={17} /> WhatsApp
            </button>

            <button onClick={printReceipt} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Printer size={17} /> Imprimer
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className={`receipt-shell mx-auto ${receiptWidthClass}`}>
          <div className="receipt-paper rounded-3xl border border-slate-200 bg-white p-5 font-mono shadow-sm">
            <div className="text-center">
              <h1 className="thermal-title text-2xl font-black uppercase tracking-tight text-slate-950">
                {sale.businesses?.name || 'CaissePro'}
              </h1>

              {sale.businesses?.address && (
                <p className="mt-1 text-xs font-bold text-slate-600">{sale.businesses.address}</p>
              )}

              <p className="mt-1 text-xs font-bold text-slate-600">
                {sale.businesses?.phone || ''} {sale.businesses?.email ? `• ${sale.businesses.email}` : ''}
              </p>
            </div>

            <div className="my-4 border-t border-dashed border-slate-400" />

            <div className="space-y-1 text-xs font-bold text-slate-700">
              <div className="flex justify-between gap-2">
                <span>REÇU</span>
                <span>#{sale.id.slice(0, 8)}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span>DATE</span>
                <span>{date.toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span>HEURE</span>
                <span>{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span>PAIEMENT</span>
                <span>{paymentLabel(sale.payment_method)}</span>
              </div>

              {sale.customers?.full_name && (
                <div className="flex justify-between gap-2">
                  <span>CLIENT</span>
                  <span className="text-right">{sale.customers.full_name}</span>
                </div>
              )}
            </div>

            <div className="my-4 border-t border-dashed border-slate-400" />

            <div className="space-y-3">
              {(sale.sale_items || []).map((item) => (
                <div key={item.id}>
                  <div className="font-black text-slate-950">
                    {item.products?.name || 'Produit supprimé'}
                  </div>

                  <div className="mt-1 flex justify-between gap-2 text-xs font-bold text-slate-700">
                    <span>{item.quantity || 0} x {Number(item.price || 0).toLocaleString('fr-FR')}</span>
                    <span>{Number(item.total || 0).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-dashed border-slate-400" />

            <div className="space-y-2 text-sm font-black">
              <div className="flex justify-between">
                <span>TOTAL</span>
                <span>{Number(sale.total || 0).toLocaleString('fr-FR')} CFA</span>
              </div>

              {Number(sale.paid_amount || 0) > 0 && (
                <div className="flex justify-between text-xs">
                  <span>PAYÉ</span>
                  <span>{Number(sale.paid_amount || 0).toLocaleString('fr-FR')} CFA</span>
                </div>
              )}

              {Number(sale.remaining_amount || 0) > 0 && (
                <div className="flex justify-between text-xs text-red-700">
                  <span>RESTE</span>
                  <span>{Number(sale.remaining_amount || 0).toLocaleString('fr-FR')} CFA</span>
                </div>
              )}
            </div>

            <div className="my-4 border-t border-dashed border-slate-400" />

            <p className="text-center text-xs font-bold text-slate-700">
              Merci pour votre achat.
            </p>

            <p className="mt-2 text-center text-[10px] font-bold text-slate-500">
              Reçu généré par CaissePro
            </p>

            <div className="mt-4 text-center text-xs">
              --------------------
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
