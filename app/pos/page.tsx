'use client'

import AppShell from '@/components/AppShell'
import POSCheckoutDrawer from '@/components/POSCheckoutDrawer'
import { supabase } from '@/lib/supabaseClient'
import { ImageIcon, Search, ShoppingCart, Trash2, Zap } from 'lucide-react'
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
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => {
      return !q || product.name.toLowerCase().includes(q)
    })
  }, [products, search])

  const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) return

      setBusinessId(membership.business_id)

      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', membership.business_id)

      const { data: customerData } = await supabase
        .from('customers')
        .select('id,full_name,phone')
        .eq('business_id', membership.business_id)

      setProducts((productData || []) as Product[])
      setCustomers(customerData || [])
    }

    init()
  }, [])

  function addToCart(product: Product) {
    setCart((prev: any[]) => {
      const existing = prev.find((i) => i.product.id === product.id)

      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
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

  async function checkout() {
    if (!businessId || cart.length === 0) return

    setCheckoutLoading(true)

    try {
      const { error } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
          total,
          customer_id: selectedCustomerId || null,
          payment_method: paymentMethod
        })

      if (error) throw error

      for (const item of cart) {
        const newStock = Math.max(0, Number(item.product.stock || 0) - Number(item.quantity || 0))

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id)
      }

      setCart([])
      setCheckoutOpen(false)
      setMessage('Vente enregistrée avec succès.')
    } catch (err: any) {
      setMessage(err?.message || 'Erreur checkout')
    }

    setCheckoutLoading(false)
  }

  return (
    <AppShell title="Caisse POS" subtitle="Workflow rapide moderne.">
      <div className="mx-auto max-w-7xl pb-36">
        {message && (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-5 flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Zap className="absolute left-4 top-3.5 text-emerald-600" size={20} />
            <input
              ref={barcodeInputRef}
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 font-black outline-none"
              placeholder="Rechercher produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-50">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="text-slate-300" size={40} />
                )}
              </div>

              <h3 className="mt-4 text-lg font-black text-slate-950">
                {product.name}
              </h3>

              <p className="mt-2 text-2xl font-black text-emerald-600">
                {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
              </p>
            </button>
          ))}
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

              <button
                onClick={() => setCheckoutOpen(true)}
                className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white"
              >
                {total.toLocaleString('fr-FR')} CFA
              </button>
            </div>
          </div>
        )}

        <POSCheckoutDrawer
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          total={total}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          newCustomer={newCustomer}
          setNewCustomer={setNewCustomer}
          addCustomer={() => {}}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          checkout={checkout}
          checkoutLoading={checkoutLoading}
          sendWhatsAppReceipt={() => {}}
        />
      </div>
    </AppShell>
  )
}
