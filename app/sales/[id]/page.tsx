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
  total: number | null
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
      return 'Crédit client'
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

  const receiptText = useMemo(() => {
    if (!sale) return ''

    const business = sale.businesses?.name || 'CaissePro'
    const date = new Date(sale.created_at)
    const lines = (sale.sale_items || [])
      .map((item) => {
        const name = item.products?.name || 'Produit'
        return `- ${name} x${item.quantity || 0}: ${Number(item.total || 0).toLocaleString('fr-FR')} CFA`
      })
      .join('\n')

    return `Reçu ${business}\nVente #${sale.id.slice(0, 8)}\nDate: ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n${lines}\n\nTotal: ${Number(sale.total || 0).toLocaleString('fr-FR')} CFA\nPaiement: ${paymentLabel(sale.payment_method)}\nMerci pour votre achat.`
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="print:hidden border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/sales" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
            <ArrowLeft size={16} /> Historique des ventes
          </Link>

          <div className="flex items-center gap-3">
            <button onClick={shareWhatsApp} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100">
              <MessageCircle size={17} /> WhatsApp
            </button>

            <button onClick={printReceipt} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Printer size={17} /> Imprimer
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">
              C
            </div>

            <h1 className="mt-4 text-3xl font-black text-slate-950">
              {sale.businesses?.name || 'CaissePro'}
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {sale.businesses?.phone || ''} {sale.businesses?.email ? `• ${sale.businesses.email}` : ''}
            </p>

            {sale.businesses?.address && (
              <p className="mt-1 text-sm text-slate-500">{sale.businesses.address}</p>
            )}
          </div>

          <div className="my-8 border-t border-dashed border-slate-300" />

          <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reçu</p>
              <p className="mt-1 font-black text-slate-950">#{sale.id.slice(0, 8)}</p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Date</p>
              <p className="mt-1 font-black text-slate-950">
                {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Paiement</p>
              <p className="mt-1 font-black text-slate-950">{paymentLabel(sale.payment_method)}</p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
              <p className="mt-1 font-black text-brand-700">{sale.status || 'completed'}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-black text-slate-950">Articles</h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1.4fr_.5fr_.7fr_.7fr] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                <span>Produit</span>
                <span>Qté</span>
                <span>Prix</span>
                <span className="text-right">Total</span>
              </div>

              {(sale.sale_items || []).map((item) => (
                <div key={item.id} className="grid grid-cols-[1.4fr_.5fr_.7fr_.7fr] border-t border-slate-100 px-4 py-4 text-sm">
                  <span className="font-black text-slate-950">{item.products?.name || 'Produit supprimé'}</span>
                  <span className="font-bold text-slate-600">{item.quantity || 0}</span>
                  <span className="font-bold text-slate-600">{Number(item.price || 0).toLocaleString('fr-FR')}</span>
                  <span className="text-right font-black text-slate-950">{Number(item.total || 0).toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-slate-300">Total payé</p>
              <p className="text-4xl font-black">{Number(sale.total || 0).toLocaleString('fr-FR')} CFA</p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-semibold text-slate-500">
            Merci pour votre achat. Reçu généré par CaissePro.
          </p>
        </div>
      </section>
    </main>
  )
}
