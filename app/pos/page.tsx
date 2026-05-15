'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CreditCard, ImageIcon, Minus, Package, Plus, Search, ShoppingCart, Trash2, UserPlus, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = { id: string; business_id: string; name: string; barcode: string | null; category: string | null; sell_price: number | null; minimum_price: number | null; stock: number | null; image: string | null }
type Customer = { id: string; full_name: string; phone: string | null; points: number | null; total_spent: number | null; debt_balance?: number | null }
type CartItem = { product: Product; quantity: number; price: number }

function paymentLabel(method: string) {
  if (method === 'cash') return 'Cash'
  if (method === 'wave') return 'Wave'
  if (method === 'orange_money') return 'Orange Money'
  if (method === 'card') return 'Carte'
  if (method === 'credit') return 'Client Doit'
  return method
}

function paymentStyle(method: string, active: boolean) {
  if (!active) return 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
  if (method === 'cash') return 'bg-emerald-600 text-white'
  if (method === 'wave') return 'bg-sky-600 text-white'
  if (method === 'orange_money') return 'bg-orange-500 text-white'
  if (method === 'credit') return 'bg-red-600 text-white'
  return 'bg-slate-950 text-white'
}

export default function POSPage() {
  const router = useRouter()
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [cashierId, setCashierId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const earnedPoints = Math.floor(subtotal / 1000)

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q) || (product.category || '').toLowerCase().includes(q) || (product.barcode || '').toLowerCase().includes(q)
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setCashierId(userData.user.id)
      const { data: membership } = await supabase.from('business_members').select('business_id').eq('user_id', userData.user.id).limit(1).maybeSingle()
      if (!membership?.business_id) { setMessage('Aucune boutique trouvée pour ce compte.'); setLoading(false); return }
      setBusinessId(membership.business_id)
      await Promise.all([loadProducts(membership.business_id), loadCustomers(membership.business_id)])
      setLoading(false)
      setTimeout(() => barcodeInputRef.current?.focus(), 250)
    }
    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data, error } = await supabase.from('products').select('id,business_id,name,barcode,category,sell_price,minimum_price,stock,image').eq('business_id', id).order('name')
    if (error) setMessage(error.message)
    setProducts((data || []) as Product[])
  }

  async function loadCustomers(id: string) {
    const { data, error } = await supabase.from('customers').select('id,full_name,phone,points,total_spent,debt_balance').eq('business_id', id).order('full_name')
    if (error) setMessage(error.message)
    setCustomers((data || []) as Customer[])
  }

  function addToCart(product: Product) {
    setMessage('')
    if (Number(product.stock || 0) <= 0) { setMessage('Produit en rupture de stock.'); return }
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= Number(product.stock || 0)) { setMessage('Stock insuffisant.'); return current }
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { product, quantity: 1, price: Number(product.sell_price || 0) }]
    })
    barcodeInputRef.current?.focus()
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return
    const match = products.find((product) => (product.barcode || '').trim().toLowerCase() === code.toLowerCase()) || products.find((product) => product.name.toLowerCase().includes(code.toLowerCase()))
    if (!match) { setSearch(code); setMessage('Aucun produit trouvé avec ce code ou ce nom.'); return }
    addToCart(match)
    setBarcodeInput('')
    setSearch('')
    setMessage(`Produit ajouté: ${match.name}`)
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) { setCart((current) => current.filter((item) => item.product.id !== productId)); return }
    setCart((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: Math.min(quantity, Number(item.product.stock || 0)) } : item))
  }

  function updatePrice(productId: string, price: number) {
    setCart((current) => current.map((item) => {
      if (item.product.id !== productId) return item
      const minimum = Number(item.product.minimum_price || 0)
      return { ...item, price: Math.max(price, minimum) }
    }))
  }

  async function quickAddCustomer() {
    if (!businessId || !newCustomer.full_name.trim()) return
    const { data, error } = await supabase.from('customers').insert({ business_id: businessId, full_name: newCustomer.full_name.trim(), phone: newCustomer.phone || null, points: 0, total_spent: 0, debt_balance: 0 }).select('id,full_name,phone,points,total_spent,debt_balance').limit(1)
    if (error) { setMessage(error.message); return }
    const created = data?.[0] as Customer | undefined
    if (created) { setCustomers((prev) => [created, ...prev]); setSelectedCustomerId(created.id); setNewCustomer({ full_name: '', phone: '' }); setMessage('Client ajouté et sélectionné.') }
  }

  async function checkout() {
    if (!businessId || !cashierId) return
    if (cart.length === 0) { setMessage('Le panier est vide.'); return }
    if (paymentMethod === 'credit' && !selectedCustomerId) { setMessage('Sélectionnez ou ajoutez un client pour Client Doit.'); return }
    setCheckoutLoading(true)
    setMessage('')
    const { data: sales, error: saleError } = await supabase.from('sales').insert({ business_id: businessId, cashier_id: cashierId, customer_id: selectedCustomerId || null, total: subtotal, paid_amount: paymentMethod === 'credit' ? 0 : subtotal, remaining_amount: paymentMethod === 'credit' ? subtotal : 0, payment_method: paymentMethod, status: paymentMethod === 'credit' ? 'pending' : 'completed' }).select('id').limit(1)
    const sale = sales?.[0]
    if (saleError || !sale) { setMessage(saleError?.message || 'Erreur pendant la vente.'); setCheckoutLoading(false); return }
    const { error: itemsError } = await supabase.from('sale_items').insert(cart.map((item) => ({ sale_id: sale.id, product_id: item.product.id, quantity: item.quantity, price: item.price, total: item.price * item.quantity })))
    if (itemsError) { setMessage(itemsError.message); setCheckoutLoading(false); return }
    for (const item of cart) await supabase.from('products').update({ stock: Math.max(Number(item.product.stock || 0) - item.quantity, 0) }).eq('id', item.product.id)
    if (selectedCustomerId && selectedCustomer) await supabase.from('customers').update({ total_spent: Number(selectedCustomer.total_spent || 0) + subtotal, points: Number(selectedCustomer.points || 0) + earnedPoints, debt_balance: paymentMethod === 'credit' ? Number(selectedCustomer.debt_balance || 0) + subtotal : Number(selectedCustomer.debt_balance || 0) }).eq('id', selectedCustomerId)
    setCart([]); setSelectedCustomerId(''); setPaymentMethod('cash')
    await Promise.all([loadProducts(businessId), loadCustomers(businessId)])
    setMessage('Vente encaissée avec succès.')
    setCheckoutLoading(false)
    barcodeInputRef.current?.focus()
  }

  const CheckoutControls = () => (
    <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-2xl">
      <p className="text-sm font-bold text-slate-300">Total</p>
      <p className="mt-1 text-4xl font-black">{subtotal.toLocaleString('fr-FR')} CFA</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {['cash', 'wave', 'orange_money', 'card', 'credit'].map((method) => (
          <button key={method} onClick={() => setPaymentMethod(method)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${paymentStyle(method, paymentMethod === method)}`}>{paymentLabel(method)}</button>
        ))}
      </div>
      {paymentMethod === 'credit' && !selectedCustomer && <div className="mt-4 rounded-2xl bg-red-500/15 p-3 text-sm font-bold text-red-200">Sélectionnez ou ajoutez un client.</div>}
      <button onClick={checkout} disabled={checkoutLoading || cart.length === 0} className="mt-5 w-full rounded-2xl bg-emerald-600 py-4 text-lg font-black text-white disabled:opacity-40"><CreditCard className="mr-2 inline" />{checkoutLoading ? 'Enregistrement...' : 'Encaisser'}</button>
    </div>
  )

  const Basket = () => (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between"><div><h3 className="flex items-center gap-2 text-2xl font-black"><ShoppingCart /> Panier</h3><p className="text-sm font-semibold text-slate-500">{totalItems} article(s)</p></div>{cart.length > 0 && <button onClick={() => setCart([])} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">Vider</button>}</div>
      <div className="mb-4 rounded-3xl bg-slate-50 p-4"><label className="text-sm font-black text-slate-700">Client</label><select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}><option value="">Vente sans client</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name} {customer.phone ? `• ${customer.phone}` : ''}</option>)}</select><div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"><input value={newCustomer.full_name} onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })} placeholder="Nouveau client" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none" /><input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Téléphone" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none" /><button type="button" onClick={quickAddCustomer} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><UserPlus size={16} />Ajouter</button></div></div>
      <div className="space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-520px)]">{cart.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><ShoppingCart className="mx-auto text-slate-400" /><p className="mt-3 font-black">Panier vide</p></div> : cart.map((item) => <div key={item.product.id} className="rounded-3xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{item.product.name}</p><p className="text-xs font-bold text-slate-500">Min: {Number(item.product.minimum_price || 0).toLocaleString('fr-FR')} CFA</p></div><button onClick={() => updateQuantity(item.product.id, 0)} className="rounded-xl p-2 text-red-600"><Trash2 size={16} /></button></div><div className="mt-3 grid grid-cols-[1fr_auto] gap-3"><input type="number" value={item.price} onChange={(e) => updatePrice(item.product.id, Number(e.target.value || 0))} className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-black outline-none" /><div className="flex items-center rounded-2xl border border-slate-300 px-2"><button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2"><Minus size={14} /></button><span className="px-2 font-black">{item.quantity}</span><button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2"><Plus size={14} /></button></div></div><p className="mt-2 text-right font-black">{(item.price * item.quantity).toLocaleString('fr-FR')} CFA</p></div>)}</div>
      <div className="sticky bottom-0 z-20 mt-5 bg-white pt-4"><CheckoutControls /></div>
    </div>
  )

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-600">Chargement de la caisse...</p></main>

  return (
    <AppShell title="Caisse POS" subtitle="Choisissez un produit, ajoutez un client, puis encaissez.">
      <div className="mx-auto max-w-[1700px] pb-28 lg:pb-0">
        {message && <div className="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          <section className="min-w-0">
            <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_.9fr]"><form onSubmit={handleBarcodeSubmit} className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="relative flex-1"><Zap className="absolute left-4 top-3.5 text-emerald-600" size={20} /><input ref={barcodeInputRef} className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base font-black outline-none" placeholder="Scanner code-barres ou taper un nom..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} /></div><button className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">Ajouter</button></form><div className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><Search className="absolute left-8 top-7 text-slate-400" size={20} /><input className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none" placeholder="Filtrer produits..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
            <div className="mb-6 flex gap-3 overflow-x-auto pb-1"><button onClick={() => setSelectedCategory('')} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black ${selectedCategory === '' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Tous</button>{categories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black ${selectedCategory === category ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{category}</button>)}</div>
            {filteredProducts.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center"><Package className="mx-auto text-slate-400" size={46} /><h3 className="mt-4 text-2xl font-black">Aucun produit</h3></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filteredProducts.map((product) => <button key={product.id} onClick={() => addToCart(product)} className="group rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-36 items-center justify-center rounded-2xl bg-slate-50">{product.image ? <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-slate-300" size={44} />}</div><p className="mt-4 text-xs font-black uppercase text-emerald-600">{product.category || 'Produit'}</p><h3 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{product.name}</h3><p className="mt-3 text-2xl font-black text-emerald-600">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p><p className="mt-1 text-sm font-bold text-slate-500">Stock: {product.stock || 0}</p></button>)}</div>}
          </section>
          <aside className="lg:sticky lg:top-[104px] lg:h-[calc(100vh-124px)] lg:overflow-y-auto"><Basket /></aside>
        </div>
      </div>
    </AppShell>
  )
}
