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
  products?: {
    name: string
    image_url?: string | null
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
    logo_url?: string | null
  } | null
  customers?: {
    full_name: string
    phone: string | null
  } | null
}

function paymentLabel(method: string | null) {
  switch (method) {
    case 'cash':
      return 'Espèces'
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
        const name = item.product_name || item.products?.name || 'Produit'
        const unitPrice = item.unit_price ?? item.price ?? 0
        return `- ${name} x${item.quantity || 0}: ${Number(item.total || (unitPrice * (item.quantity || 1))).toLocaleString('fr-FR')} CFA`
      })
      .join('\n')

    return `Reçu ${business}\nClient: ${sale.customers?.full_name || 'Client comptoir'}\n\n${lines}\n\nTotal: ${Number(sale.total || 0).toLocaleString('fr-FR')} CFA`
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
    const query = `
      *,
      businesses (
        name,
        phone,
        email,
        address,
        currency,
        logo_url
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
        product_name,
        product_image,
        unit_price,
        products (
          name,
          image_url
        )
      )
    `

    let { data, error } = await supabase
      .from('sales')
      .select(query)
      .eq('id', saleId)
      .maybeSingle()

    // Fallback: try treating saleId as a receipt_number
    if (!data && !error) {
      const result = await supabase
        .from('sales')
        .select(query)
        .eq('receipt_number', saleId)
        .maybeSingle()
      data = result.data
      error = result.error
    }

    if (error) {
      setMessage(error.message)
      return
    }

    if (!data) {
      setMessage('Cette vente est introuvable.')
      return
    }

    setSale(data as Sale)
  }

  function printReceipt() {
    window.print()
  }

  function shareWhatsApp() {
    const phone = sale?.customers?.phone
      ? String(sale.customers.phone).replace(/\D/g, '')
      : ''
    const encoded = encodeURIComponent(receiptText)
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank')
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
        </div>
      </main>
    )
  }

  const date = new Date(sale.created_at)
  const receiptWidthClass = paperSize === '58mm' ? 'max-w-[260px]' : 'max-w-[380px]'

  return (
    <>
    <style>{`
      @media print {
        .no-print { display: none !important; }
        body { background: white; }
      }
    `}</style>
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white no-print">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/sales" className="inline-flex items-center gap-2 text-sm font-black text-slate-600">
            <ArrowLeft size={16} /> Retour
          </Link>

          <div className="flex gap-3">
            <Link href={`/sales/${saleId}/receipt`} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
              <ReceiptText size={16} /> Reçu premium
            </Link>

            <button onClick={shareWhatsApp} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700">
              <MessageCircle size={16} /> WhatsApp
            </button>

            <button onClick={printReceipt} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">
              <Printer size={16} /> Imprimer
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className={`mx-auto ${receiptWidthClass}`}>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="text-center">
              {sale.businesses?.logo_url && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={sale.businesses.logo_url}
                    alt="logo"
                    className="h-20 w-20 rounded-2xl object-cover border border-slate-200"
                  />
                </div>
              )}

              <h1 className="text-3xl font-black text-slate-950">
                {sale.businesses?.name || 'CaissePro'}
              </h1>

              <p className="mt-2 text-xs font-bold text-slate-500">
                {sale.businesses?.address || ''}
              </p>
            </div>

            <div className="my-5 border-t border-dashed border-slate-300" />

            <div className="space-y-2 text-sm font-bold text-slate-700">
              <div className="flex justify-between">
                <span>Client</span>
                <span>{sale.customers?.full_name || 'Client comptoir'}</span>
              </div>

              {sale.customers?.phone && (
                <div className="flex justify-between">
                  <span>Téléphone</span>
                  <span>{sale.customers.phone}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Date</span>
                <span>{date.toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="flex justify-between">
                <span>Paiement</span>
                <span>{paymentLabel(sale.payment_method)}</span>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-slate-300" />

            <div className="space-y-4">
              {(sale.sale_items || []).map((item) => {
                const itemName = item.product_name || item.products?.name || 'Produit'
                const itemImage = item.product_image || item.products?.image_url
                const itemUnitPrice = item.unit_price ?? item.price ?? 0
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex gap-3">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="h-16 w-16 rounded-xl object-cover border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl border border-slate-200 bg-white" />
                      )}

                      <div className="flex-1">
                        <p className="font-black text-slate-950">
                          {itemName}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>
                            {item.quantity || 0} × {Number(itemUnitPrice).toLocaleString('fr-FR')} CFA
                          </span>

                          <span className="text-sm font-black text-slate-950">
                            {Number(item.total || 0).toLocaleString('fr-FR')} CFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="my-5 border-t border-dashed border-slate-300" />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-lg font-black text-slate-950">
                <span>TOTAL</span>
                <span>{Number(sale.total || 0).toLocaleString('fr-FR')} CFA</span>
              </div>

              {Number(sale.remaining_amount || 0) > 0 && (
                <div className="flex items-center justify-between text-sm font-black text-red-700">
                  <span>RESTE</span>
                  <span>{Number(sale.remaining_amount || 0).toLocaleString('fr-FR')} CFA</span>
                </div>
              )}
            </div>

            <div className="my-5 border-t border-dashed border-slate-300" />

            <p className="text-center text-xs font-black text-slate-600">
              Merci pour votre achat.
            </p>

            <p className="mt-2 text-center text-[10px] font-bold text-slate-400">
              Généré avec CaissePro
            </p>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-[380px] gap-3 no-print">
          <Link
            href={`/sales/${saleId}/receipt`}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
          >
            <ReceiptText size={18} /> Voir le reçu premium
          </Link>
        </div>
      </section>
    </main>
    </>

  )
}
