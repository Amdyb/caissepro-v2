'use client'

import AppShell from '@/components/AppShell'
import POSCheckoutDrawer from '@/components/POSCheckoutDrawer'
import { supabase } from '@/lib/supabaseClient'
import { ImageIcon, ReceiptText, ShoppingCart, Trash2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

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

export default function POSPage() {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [products, setProducts] = useState<Product[]>([])
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
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })

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

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) return

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member?.businesses?.name || 'CaissePro')

      const { data: productData } = await supabase.from('products').select('*').eq('business_id', member.business_id)
      const { data: customerData } = await supabase.from('customers').select('id,full_name,phone').eq('business_id', member.business_id)

      setProducts((productData || []) as Product[])
      setCustomers(customerData || [])
    }

    init()
  }, [])

  function addToCart(product: Product) {
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
  }

  function removeItem(productId: string) {
    setCart((prev: any[]) => prev.filter((i) => i.product.id !== productId))
  }

  async function addCustomer() {
    if (!businessId) return

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        full_name: newCustomer.full_name,
        phone: newCustomer.phone
      })
      .select()
      .single()

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers([data, ...customers])
    setSelectedCustomerId(data.id)
    setNewCustomer({ full_name: '', phone: '' })
    flash('Client ajouté avec succès.')
  }

  async function checkout() {
    if (!businessId || cart.length === 0) return

    setCheckoutLoading(true)

    try {
      const isCredit = paymentMethod === 'credit'
      const { data: saleData, error } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
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
        price: item.price,
        total: item.quantity * item.price
      }))

      const { error: itemError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemError) {
        console.error(itemError)
      }

      for (const item of cart) {
        const newStock = Math.max(0, Number(item.product.stock || 0) - Number(item.quantity || 0))

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id)
      }

      const customer = customers.find((c) => c.id === selectedCustomerId)

      const receiptLines = cart.map((item) => `• ${item.product.name} x${item.quantity} - ${(item.price * item.quantity).toLocaleString('fr-FR')} CFA`).join('%0A')

      setLastReceipt(`🧾 ${businessName}%0A%0A${receiptLines}%0A%0ATotal: ${total.toLocaleString('fr-FR')} CFA%0AClient: ${customer?.full_name || 'Client inconnu'}`)

      setCart([])
      setLastSaleId(saleData.id)
      flash('Vente enregistrée avec succès.')
    } catch (err: any) {
      setMessage(err?.message || 'Erreur lors du paiement')
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

        <div className="mb-5 flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Zap className="absolute left-4 top-3.5 text-emerald-600" size={20} />
            <input ref={barcodeInputRef} className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 font-black outline-none" placeholder="Rechercher produit..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const outOfStock = Number(product.stock ?? 1) <= 0
            const lowStock = !outOfStock && Number(product.stock ?? 1) <= 5

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={outOfStock}
                className={`relative rounded-3xl border bg-white p-4 text-left shadow-sm transition ${outOfStock ? 'cursor-not-allowed border-red-100 opacity-60' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}
              >
                {outOfStock && (
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">Rupture</span>
                )}
                {lowStock && !outOfStock && (
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">Stock faible</span>
                )}
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
                  {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-300" size={40} />}
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{product.name}</h3>
                {product.category && <p className="mt-0.5 text-xs font-bold text-slate-400">{product.category}</p>}
                <p className="mt-2 text-2xl font-black text-emerald-600">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p>
                {product.stock !== null && (
                  <p className="mt-1 text-xs font-bold text-slate-400">Stock : {product.stock}</p>
                )}
              </button>
            )
          })}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-white">
                  <ShoppingCart size={18} />
                  <span className="font-black">{totalItems} article(s)</span>
                </div>

                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
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
          onClose={() => { setCheckoutOpen(false); setLastSaleId(null) }}
          total={total}
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
        />
      </div>
    </AppShell>
  )
}
