'use client'

import AppShell from '@/components/AppShell'
import POSCheckoutDrawer from '@/components/POSCheckoutDrawer'
import { supabase } from '@/lib/supabaseClient'
import { ImageIcon, Package, Search, ShoppingCart, Trash2, Zap } from 'lucide-react'
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
  const [selectedCategory, setSelectedCategory] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q) || (product.category || '').toLowerCase().includes(q) || (product.barcode || '').toLowerCase().includes(q)
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

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
        .select('id,business_id,name,category,barcode,sell_price,minimum_price,stock,image')
        .eq('business_id', membership.business_id)
        .order('name')

      const { data: customerData } = await supabase
        .from('customers')
        .select('id,full_name,phone')
        .eq('business_id', membership.business_id)
        .order('full_name')

      setProducts((productData || []) as Product[])
      setCustomers(customerData || [])

      const savedCart = localStorage.getItem('caissepro-pos-cart')
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch {}
      }
    }

    init()
  }, [])

  useEffect(() => {
    localStorage.setItem('caissepro-pos-cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product: Product) {
    if (Number(product.stock || 0) <= 0) {
      setMessage('Produit en rupture de stock.')
      return
    }

    setCart((current: any[]) => {
      const existing = current.find((item) => item.product.id === product.id)

      if (existing) {
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }

      return [...current, {
        product,
        quantity: 1,
        price: Number(product.sell_price || 0)
      }]
    })

    barcodeInputRef.current?.focus()
  }

  function removeItem(productId: string) {
    setCart((current: any[]) => current.filter((item) => item.product.id !== productId))
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()

    const code = barcodeInput.trim()
    if (!code) return

    const match = products.find((product) =>
      (product.barcode || '').toLowerCase() === code.toLowerCase()
    ) || products.find((product) =>
      product.name.toLowerCase().includes(code.toLowerCase())
    )

    if (!match) {
      setMessage('Produit introuvable.')
      return
    }

    addToCart(match)
    setBarcodeInput('')
  }

  async function addCustomer() {
    if (!businessId || !newCustomer.full_name.trim()) return

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        full_name: newCustomer.full_name.trim(),
        phone: newCustomer.phone || null,
        points: 0,
        total_spent: 0,
        debt_balance: 0
      })
      .select('id,full_name,phone')
      .limit(1)

    if (error) {
      setMessage(error.message)
      return
    }

    const created = data?.[0]

    if (created) {
      setCustomers((prev) => [created, ...prev])
      setSelectedCustomerId(created.id)
      setNewCustomer({ full_name: '', phone: '' })
    }
  }

  async function checkout() {
    setCheckoutLoading(true)

    setTimeout(() => {
      setCheckoutLoading(false)
      setCheckoutOpen(false)
      setCart([])
      localStorage.removeItem('caissepro-pos-cart')
      setMessage('Vente enregistrée avec succès.')
    }, 1200)
  }

  function sendWhatsAppReceipt() {
    const customer = customers.find((c) => c.id === selectedCustomerId)

    if (!customer?.phone) {
      setMessage('Numéro client requis.')
      return
    }

    const phone = customer.phone.replace(/\D/g, '')

    const text = encodeURIComponent(
      `Bonjour ${customer.full_name},\n\nMerci pour votre achat.\n\nMontant: ${total.toLocaleString('fr-FR')} CFA\nPaiement: ${paymentMethod}\n\nMerci pour votre confiance.`
    )

    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  return (
    <AppShell title="Caisse POS" subtitle="Workflow rapide moderne.">
      <div className="mx-auto max-w-[1700px] pb-36">
        {message && (
          <div className="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_.9fr]">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1">
              <Zap className="absolute left-4 top-3.5 text-emerald-600" size={20} />
              <input
                ref={barcodeInputRef}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base font-black outline-none"
                placeholder="Scanner code-barres ou taper un nom..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>

            <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">
              Ajouter
            </button>
          </form>

          <div className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <Search className="absolute left-8 top-7 text-slate-400" size={20} />
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none"
              placeholder="Filtrer produits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategory('')} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black ${selectedCategory === '' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
            Tous
          </button>

          {categories.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black ${selectedCategory === category ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <button key={product.id} onClick={() => addToCart(product)} className="group rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-50">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="text-slate-300" size={44} />
                )}
              </div>

              <p className="mt-4 text-xs font-black uppercase text-emerald-600">
                {product.category || 'Produit'}
              </p>

              <h3 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">
                {product.name}
              </h3>

              <p className="mt-3 text-2xl font-black text-emerald-600">
                {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
              </p>
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-white">
                  <ShoppingCart size={18} />
                  <span className="font-black">{totalItems} article(s)</span>
                </div>

                {cart.slice(0, 3).map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <span className="font-black text-slate-900">{item.product.name}</span>
                    <button onClick={() => removeItem(item.product.id)} className="text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500">Total</p>
                  <p className="text-3xl font-black text-slate-950">
                    {total.toLocaleString('fr-FR')} CFA
                  </p>
                </div>

                <button onClick={() => setCheckoutOpen(true)} className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-200">
                  Checkout
                </button>
              </div>
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
          addCustomer={addCustomer}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          checkout={checkout}
          checkoutLoading={checkoutLoading}
          sendWhatsAppReceipt={sendWhatsAppReceipt}
        />
      </div>
    </AppShell>
  )
}
