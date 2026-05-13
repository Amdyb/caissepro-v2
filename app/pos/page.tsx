'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus, Search, ShoppingCart, Trash2, UserRound } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Product = {
  id: string
  business_id: string
  name: string
  barcode: string | null
  category: string | null
  sell_price: number | null
  minimum_price: number | null
  stock: number | null
  image: string | null
}

type Customer = {
  id: string
  full_name: string
  phone: string | null
  points: number | null
  total_spent: number | null
}

type CartItem = {
  product: Product
  quantity: number
  price: number
}

export default function POSPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [cashierId, setCashierId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products

    return products.filter((product) =>
      product.name.toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q) ||
      (product.barcode || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const earnedPoints = Math.floor(subtotal / 1000)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setCashierId(userData.user.id)

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(name, currency)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadProducts(member.business_id),
        loadCustomers(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, business_id, name, barcode, category, sell_price, minimum_price, stock, image')
      .eq('business_id', id)
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, points, total_spent')
      .eq('business_id', id)
      .order('full_name')

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as Customer[])
  }

  function addToCart(product: Product) {
    setMessage('')

    if (Number(product.stock || 0) <= 0) {
      setMessage('Produit en rupture de stock.')
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)

      if (existing) {
        if (existing.quantity >= Number(product.stock || 0)) {
          setMessage('Stock insuffisant.')
          return current
        }

        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          price: Number(product.sell_price || 0)
        }
      ]
    })
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== productId))
      return
    }

    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) return item

        const maxStock = Number(item.product.stock || 0)
        return { ...item, quantity: Math.min(quantity, maxStock) }
      })
    )
  }

  function updatePrice(productId: string, price: number) {
    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) return item

        const minimum = Number(item.product.minimum_price || 0)
        const safePrice = Math.max(price, minimum)

        return { ...item, price: safePrice }
      })
    )
  }

  async function checkout() {
    if (!businessId || !cashierId) return
    if (cart.length === 0) {
      setMessage('Le panier est vide.')
      return
    }

    setCheckoutLoading(true)
    setMessage('')

    const customerId = selectedCustomerId || null

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        business_id: businessId,
        cashier_id: cashierId,
        customer_id: customerId,
        total: subtotal,
        payment_method: paymentMethod,
        status: 'completed'
      })
      .select()
      .single()

    if (saleError || !sale) {
      setMessage(saleError?.message || 'Erreur pendant la vente.')
      setCheckoutLoading(false)
      return
    }

    const saleItems = cart.map((item) => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

    if (itemsError) {
      setMessage(itemsError.message)
      setCheckoutLoading(false)
      return
    }

    for (const item of cart) {
      const newStock = Math.max(Number(item.product.stock || 0) - item.quantity, 0)

      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product.id)
    }

    if (customerId && selectedCustomer) {
      const newTotalSpent = Number(selectedCustomer.total_spent || 0) + subtotal
      const newPoints = Number(selectedCustomer.points || 0) + earnedPoints

      await supabase
        .from('customers')
        .update({
          total_spent: newTotalSpent,
          points: newPoints
        })
        .eq('id', customerId)
    }

    setCart([])
    setSelectedCustomerId('')
    await Promise.all([
      loadProducts(businessId),
      loadCustomers(businessId)
    ])

    setMessage(`Vente enregistrée avec succès.${customerId ? ` ${earnedPoints} point(s) fidélité ajouté(s).` : ''}`)
    setCheckoutLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement de la caisse...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} /> Tableau de bord
            </Link>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Caisse</h1>
            <p className="text-sm font-semibold text-slate-500">{businessName}</p>
          </div>

          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Produits</h2>
              <p className="text-sm text-slate-500">Touchez un produit pour l’ajouter au panier.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-80"
                placeholder="Rechercher produit ou code-barres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-700">
              {message}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="h-36 bg-slate-100">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">📦</div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                    {product.category || 'Produit'}
                  </p>
                  <h3 className="mt-1 font-black text-slate-950">{product.name}</h3>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
                  </p>
                  <p className={`mt-1 text-sm font-bold ${Number(product.stock || 0) <= 5 ? 'text-red-600' : 'text-slate-500'}`}>
                    Stock: {product.stock || 0}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <ShoppingCart />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Panier</h2>
              <p className="text-sm text-slate-500">{cart.length} produit(s)</p>
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <UserRound size={17} />
              Client
            </label>

            <select
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-brand-600"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Vente sans client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} {customer.phone ? `• ${customer.phone}` : ''}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="mt-3 rounded-2xl bg-white p-3 text-sm">
                <p className="font-black text-slate-950">{selectedCustomer.full_name}</p>
                <p className="font-semibold text-slate-500">
                  Points: {selectedCustomer.points || 0} • Dépensé: {Number(selectedCustomer.total_spent || 0).toLocaleString('fr-FR')} CFA
                </p>
                <p className="mt-1 font-bold text-brand-700">
                  Cette vente ajoutera {earnedPoints} point(s).
                </p>
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-4xl">🛒</p>
              <h3 className="mt-3 text-xl font-black text-slate-950">Panier vide</h3>
              <p className="mt-2 text-sm text-slate-500">Ajoutez un produit pour commencer une vente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-950">{item.product.name}</h3>
                      <p className="text-xs font-semibold text-slate-500">
                        Min: {Number(item.product.minimum_price || 0).toLocaleString('fr-FR')} CFA
                      </p>
                    </div>

                    <button
                      onClick={() => updateQuantity(item.product.id, 0)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_1fr] gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500">Prix</label>
                      <input
                        type="number"
                        min={Number(item.product.minimum_price || 0)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-bold outline-none focus:border-brand-600"
                        value={item.price}
                        onChange={(e) => updatePrice(item.product.id, Number(e.target.value || 0))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500">Quantité</label>
                      <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-300 px-2 py-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="rounded-lg p-2 hover:bg-slate-100">
                          <Minus size={15} />
                        </button>
                        <span className="font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="rounded-lg p-2 hover:bg-slate-100">
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-right font-black text-slate-950">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                  </p>
                </div>
              ))}

              <div className="border-t border-slate-200 pt-5">
                <label className="text-sm font-bold text-slate-700">Méthode de paiement</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="card">Carte</option>
                  <option value="credit">Crédit client</option>
                </select>
              </div>

              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-300">Total</p>
                  <p className="text-3xl font-black">{subtotal.toLocaleString('fr-FR')} CFA</p>
                </div>

                {selectedCustomer && (
                  <p className="mt-2 text-sm font-bold text-brand-300">
                    +{earnedPoints} point(s) fidélité
                  </p>
                )}

                <button
                  onClick={checkout}
                  disabled={checkoutLoading}
                  className="mt-5 w-full rounded-2xl bg-brand-600 py-4 text-lg font-black text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {checkoutLoading ? 'Enregistrement...' : 'Encaisser'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
