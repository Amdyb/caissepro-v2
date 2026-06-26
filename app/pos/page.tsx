'use client'

import AppShell from '@/components/AppShell'
import dynamic from 'next/dynamic'

const POSCheckoutDrawer = dynamic(() => import('@/components/POSCheckoutDrawer'), { ssr: false })
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })
import { supabase } from '@/lib/supabaseClient'
import { notifySelf } from '@/lib/notifications'
import { sendPushRequest } from '@/lib/push'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import useSWR from 'swr'
import { ImageIcon, ReceiptText, ScanLine, ShoppingCart, Trash2, X, Zap } from 'lucide-react'
function dispatch(event: string) { window.dispatchEvent(new Event(event)) }
import { savePendingSale } from '@/lib/offlineStore'
import { formatPhone, sendReceipt } from '@/lib/whatsapp'
import Link from 'next/link'
import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Product = {
  id: string
  business_id: string
  name: string
  category: string | null
  barcode: string | null
  sell_price: number | null
  minimum_price: number | null
  stock: number | null
  image: string | null
}

// Memoized so typing in search or updating the cart doesn't re-render every tile
// in the grid — only tiles whose product/onAdd actually change re-render.
const PosProductCard = memo(function PosProductCard({
  product,
  onAdd,
}: {
  product: Product
  onAdd: (p: Product) => void
}) {
  const outOfStock = Number(product.stock ?? 1) <= 0
  const lowStock = !outOfStock && Number(product.stock ?? 1) <= 5

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={outOfStock}
      className={`relative rounded-3xl border p-4 text-left shadow-sm transition dark:bg-slate-800 ${outOfStock ? 'cursor-not-allowed border-red-100 bg-white opacity-60 dark:border-red-900' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:hover:border-emerald-600'}`}
    >
      {outOfStock && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">Rupture</span>
      )}
      {lowStock && !outOfStock && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">Stock faible</span>
      )}
      <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-700">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 25vw" className="object-cover" />
        ) : (
          <ImageIcon className="text-slate-300 dark:text-slate-500" size={40} />
        )}
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{product.name}</h3>
      {product.category && <p className="mt-0.5 text-xs font-bold text-slate-400 dark:text-slate-500">{product.category}</p>}
      <p className="mt-2 text-2xl font-black text-emerald-600">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p>
      {product.stock !== null && (
        <p className="mt-1 text-xs font-bold text-slate-400">Stock : {product.stock}</p>
      )}
    </button>
  )
})

export default function POSPage() {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)
  const { businessId, businessName, businessPhone, plan, userId } = useBusinessData()

  // SWR for POS products — cached for instant repeat loads
  const { data: posProductsData } = useSWR(
    businessId ? `pos-products-${businessId}` : null,
    async () => {
      const { data } = await supabase
        .from('products')
        .select('id, business_id, name, category, barcode, sell_price, minimum_price, stock, image')
        .eq('business_id', businessId!)
        .not('is_active', 'is', false)
        .not('archived', 'is', true)
        .is('deleted_at', null)
      return (data || []) as Product[]
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  const products = posProductsData || []

  const [customers, setCustomers] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastReceipt, setLastReceipt] = useState('')

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 6000)
  }
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)
  const [confirmedTotal, setConfirmedTotal] = useState(0)
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })
  const [showPlanLimit, setShowPlanLimit] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [drawerMessage, setDrawerMessage] = useState('')

  // Fetch customers when businessId is known
  useEffect(() => {
    if (!businessId) return
    supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('business_id', businessId)
      .then(({ data }) => setCustomers(data || []))
  }, [businessId])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) =>
      !q ||
      product.name.toLowerCase().includes(q) ||
      (product.barcode || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const addToCart = useCallback((product: Product) => {
    dispatch('play-click')
    setCart((prev: any[]) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }

      return [...prev, {
        product,
        quantity: 1,
        price: Number(product.sell_price || 0)
      }]
    })
  }, [])

  function removeItem(productId: string) {
    dispatch('play-click')
    setCart((prev: any[]) => prev.filter((i) => i.product.id !== productId))
  }

  function handleBarcodeScan(barcode: string) {
    const found = products.find(p => p.barcode === barcode)
    if (found) {
      addToCart(found)
      flash(`✓ ${found.name} ajouté au panier`)
    } else {
      setSearch(barcode)
      flash(`Produit "${barcode}" introuvable — recherche manuelle activée`)
    }
  }

  async function addCustomer() {
    if (!businessId) {
      setDrawerMessage('Boutique introuvable — rechargez la page.')
      return
    }
    if (!newCustomer.full_name.trim()) {
      setDrawerMessage('Le nom du client est requis.')
      return
    }

    setDrawerMessage('')
    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        full_name: newCustomer.full_name.trim(),
        phone: newCustomer.phone.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[POS] addCustomer error:', error)
      setDrawerMessage(error.message)
      return
    }

    setCustomers((prev) => [data, ...prev])
    setSelectedCustomerId(data.id)
    setNewCustomer({ full_name: '', phone: '' })
    setDrawerMessage('Client ajouté avec succès.')
    setTimeout(() => setDrawerMessage(''), 4000)
  }

  async function checkout() {
    if (!businessId || cart.length === 0) return

    // Enforce free plan limit: 50 sales/month
    if (plan === 'free') {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', monthStart.toISOString())
      if ((count || 0) >= 50) {
        setShowPlanLimit(true)
        return
      }
    }

    setCheckoutLoading(true)

    // Offline: save to IndexedDB and return early
    if (!navigator.onLine) {
      try {
        const isCredit = paymentMethod === 'credit'
        const stockUpdates = cart.map(item => ({
          product_id: item.product.id,
          new_stock: Math.max(0, Number(item.product.stock || 0) - Number(item.quantity || 0)),
        }))
        await savePendingSale({
          localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          business_id: businessId,
          total,
          paid_amount: isCredit ? 0 : total,
          remaining_amount: isCredit ? total : 0,
          customer_id: selectedCustomerId || null,
          payment_method: paymentMethod,
          status: 'completed',
          created_at: new Date().toISOString(),
          items: cart.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_image: item.product.image || null,
            unit_price: item.price,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          })),
          stock_updates: stockUpdates,
        })
        setCart([])
        setConfirmedTotal(total)
        dispatch('play-sale')
        flash('Vente enregistrée localement — synchronisation automatique à la reconnexion.')
      } catch {
        dispatch('play-error')
        setMessage('Erreur lors de la sauvegarde hors ligne.')
      }
      setCheckoutLoading(false)
      return
    }

    try {
      const isCredit = paymentMethod === 'credit'
      const { data: saleData, error } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
          cashier_id: userId,
          total,
          paid_amount: isCredit ? 0 : total,
          remaining_amount: isCredit ? total : 0,
          customer_id: selectedCustomerId || null,
          payment_method: paymentMethod,
          status: 'completed'
        })
        .select()
        .single()

      if (error) throw error

      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image || null,
        unit_price: item.price,
        quantity: item.quantity,
        subtotal: item.quantity * item.price,
      }))

      const { error: itemError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemError) {
        console.error('[POS] sale_items insert error:', itemError)
        flash(`Erreur lignes vente: ${itemError.message}`)
      }

      const lowStockProducts: string[] = []
      for (const item of cart) {
        const newStock = Math.max(0, Number(item.product.stock || 0) - Number(item.quantity || 0))

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id)

        if (newStock <= 5) lowStockProducts.push(`${item.product.name} (${newStock})`)
      }

      const customer = customers.find((c) => c.id === selectedCustomerId)

      // In-app notifications (non-blocking)
      notifySelf({
        title: 'Nouvelle vente',
        message: `${total.toLocaleString('fr-FR')} CFA${customer?.full_name ? ` — ${customer.full_name}` : ''}`,
        type: 'sale',
        businessId,
      })
      if (lowStockProducts.length > 0) {
        notifySelf({
          title: 'Stock faible',
          message: `Réassort nécessaire : ${lowStockProducts.join(', ')}`,
          type: 'low_stock',
          businessId,
        })
        // Web push to the owner's devices (authenticated via session, non-blocking).
        sendPushRequest({
          businessId,
          type: 'low_stock',
          title: 'Stock faible',
          body: `Réassort nécessaire : ${lowStockProducts.join(', ')}`,
          url: '/products',
        })
      }

      const receiptLines = cart.map((item) => `• ${item.product.name} x${item.quantity} - ${(item.price * item.quantity).toLocaleString('fr-FR')} CFA`).join('%0A')

      setLastReceipt(`🧾 ${businessName}%0A%0A${receiptLines}%0A%0ATotal: ${total.toLocaleString('fr-FR')} CFA%0AClient: ${customer?.full_name || 'Client inconnu'}`)

      setConfirmedTotal(total)
      setCart([])
      setLastSaleId(saleData.id)
      flash('Vente enregistrée avec succès.')
      dispatch('play-sale')

      // Auto-send WhatsApp receipt if customer has a phone
      console.log('[POS] sale confirmed, customer phone:', customer?.phone, '| business phone:', businessPhone)
      if (customer?.phone) {
        const formattedPhone = formatPhone(customer.phone)
        console.log('[POS] sending WhatsApp receipt to:', formattedPhone)
        sendReceipt(
          formattedPhone,
          {
            id: saleData.id,
            total,
            payment_method: paymentMethod,
            items: saleItems.map((item) => ({
              product_name: item.product_name || '',
              quantity: item.quantity,
              price: item.unit_price,
              total: item.subtotal,
            })),
            created_at: new Date().toISOString(),
          },
          { name: businessName, phone: businessPhone }
        ).then(() => {
          console.log('[POS] WhatsApp receipt sent successfully')
        }).catch((err) => {
          console.error('[POS] WhatsApp receipt error:', err)
        })
      } else {
        console.log('[POS] no customer phone — skipping WhatsApp auto-send')
      }
    } catch (err: any) {
      console.error('[POS] checkout error:', err)
      dispatch('play-error')
      setDrawerMessage(err?.message || 'Erreur lors du paiement — réessayez.')
    }

    setCheckoutLoading(false)
  }

  function sendWhatsAppReceipt() {
    const customer = customers.find((c) => c.id === selectedCustomerId)

    if (!customer?.phone) {
      setMessage('Ajoutez un client avec téléphone.')
      return
    }

    const cleanPhone = customer.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${lastReceipt}`, '_blank')
  }

  return (
    <AppShell title="Point de Vente" subtitle="Encaissement rapide et moderne.">
      {showPlanLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <button onClick={() => setShowPlanLimit(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200">
              <X size={16} />
            </button>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">🚀</div>
              <h2 className="text-xl font-black text-slate-950">Limite du plan Gratuit atteinte</h2>
              <p className="text-sm font-semibold text-slate-500">
                Vous avez atteint <strong>50 ventes ce mois-ci</strong>. Passez à un plan payant pour continuer à vendre sans limite.
              </p>
              <Link
                href="/upgrade"
                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Upgrader maintenant
              </Link>
              <button onClick={() => setShowPlanLimit(false)} className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl pb-36">
        {message && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-4 shadow-sm">
            <p className="text-sm font-black text-emerald-700">{message}</p>
            {lastSaleId && (
              <Link
                href={`/sales/${lastSaleId}/receipt`}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700"
              >
                <ReceiptText size={16} /> Voir le reçu
              </Link>
            )}
          </div>
        )}

        {showScanner && (
          <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        )}

        <div className="mb-5 flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="relative flex-1">
            <Zap className="absolute left-4 top-3.5 text-emerald-600" size={20} />
            <input ref={barcodeInputRef} className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-black text-slate-950 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400" placeholder="Rechercher produit..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-black text-slate-700 transition hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            title="Scanner un code-barres"
          >
            <ScanLine size={20} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <PosProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-white dark:bg-slate-700">
                  <ShoppingCart size={18} />
                  <span className="font-black">{totalItems} article(s)</span>
                </div>

                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white">
                    <span className="font-black">{item.product.name}</span>
                    <button onClick={() => removeItem(item.product.id)}>
                      <Trash2 size={15} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => setCheckoutOpen(true)} className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white">
                {total.toLocaleString('fr-FR')} CFA
              </button>
            </div>
          </div>
        )}

        <POSCheckoutDrawer
          open={checkoutOpen}
          onClose={() => { setCheckoutOpen(false); setLastSaleId(null); setDrawerMessage('') }}
          total={lastSaleId ? confirmedTotal : total}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          newCustomer={newCustomer}
          setNewCustomer={setNewCustomer}
          addCustomer={addCustomer}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          checkout={checkout}
          checkoutLoading={checkoutLoading}
          sendWhatsAppReceipt={sendWhatsAppReceipt}
          completedSaleId={lastSaleId}
          drawerMessage={drawerMessage}
        />
      </div>
    </AppShell>
  )
}
