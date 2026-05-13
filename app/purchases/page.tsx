'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PackagePlus, Plus, ReceiptText, Search, Trash2, Truck, WalletCards } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Supplier = {
  id: string
  name: string
  balance: number | null
}

type Product = {
  id: string
  name: string
  stock: number | null
  cost_price: number | null
  sell_price: number | null
}

type PurchaseOrder = {
  id: string
  business_id: string
  supplier_id: string | null
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  status: string | null
  note: string | null
  created_at: string
  suppliers?: {
    name: string
  } | null
  purchase_items?: {
    id: string
    quantity: number | null
    cost_price: number | null
    total: number | null
    products?: {
      name: string
    } | null
  }[]
}

type CartItem = {
  product_id: string
  product_name: string
  current_stock: number
  quantity: number
  cost_price: number
}

export default function PurchasesPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [costPrice, setCostPrice] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selectedProduct = products.find((product) => product.id === selectedProductId) || null
  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId) || null

  const total = items.reduce((sum, item) => sum + item.quantity * item.cost_price, 0)
  const paid = Number(paidAmount || 0)
  const remaining = Math.max(total - paid, 0)

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return orders
    return orders.filter((order) =>
      (order.suppliers?.name || '').toLowerCase().includes(q) ||
      (order.note || '').toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q)
    )
  }, [orders, search])

  const totalPurchased = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const totalRemaining = orders.reduce((sum, order) => sum + Number(order.remaining_amount || 0), 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setUserId(userData.user.id)

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadSuppliers(member.business_id),
        loadProducts(member.business_id),
        loadOrders(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadSuppliers(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, balance')
      .eq('business_id', id)
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setSuppliers((data || []) as Supplier[])
  }

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock, cost_price, sell_price')
      .eq('business_id', id)
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function loadOrders(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers (
          name
        ),
        purchase_items (
          id,
          quantity,
          cost_price,
          total,
          products (
            name
          )
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setMessage(error.message)
      return
    }

    setOrders((data || []) as unknown as PurchaseOrder[])
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedProduct) {
      setMessage('Sélectionnez un produit.')
      return
    }

    const qty = Number(quantity || 0)
    const cost = Number(costPrice || selectedProduct.cost_price || 0)

    if (qty <= 0 || cost < 0) {
      setMessage('Quantité ou prix invalide.')
      return
    }

    setItems((current) => {
      const existing = current.find((item) => item.product_id === selectedProduct.id)

      if (existing) {
        return current.map((item) =>
          item.product_id === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                cost_price: cost
              }
            : item
        )
      }

      return [
        ...current,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          current_stock: Number(selectedProduct.stock || 0),
          quantity: qty,
          cost_price: cost
        }
      ]
    })

    setSelectedProductId('')
    setQuantity('1')
    setCostPrice('')
    setMessage('')
  }

  function removeItem(productId: string) {
    setItems((current) => current.filter((item) => item.product_id !== productId))
  }

  async function savePurchase(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId || !userId) return

    if (items.length === 0) {
      setMessage('Ajoutez au moins un produit.')
      return
    }

    setSaving(true)
    setMessage('')

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        business_id: businessId,
        supplier_id: supplierId || null,
        created_by: userId,
        total,
        paid_amount: paid,
        remaining_amount: remaining,
        status: remaining > 0 ? 'partial' : 'paid',
        note: note || null
      })
      .select()
      .single()

    if (orderError || !order) {
      setMessage(orderError?.message || 'Erreur achat.')
      setSaving(false)
      return
    }

    const purchaseItems = items.map((item) => ({
      purchase_order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      cost_price: item.cost_price,
      total: item.quantity * item.cost_price
    }))

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems)

    if (itemsError) {
      setMessage(itemsError.message)
      setSaving(false)
      return
    }

    for (const item of items) {
      const newStock = item.current_stock + item.quantity

      await supabase
        .from('products')
        .update({
          stock: newStock,
          cost_price: item.cost_price
        })
        .eq('id', item.product_id)
    }

    if (supplierId && selectedSupplier && remaining > 0) {
      await supabase
        .from('suppliers')
        .update({
          balance: Number(selectedSupplier.balance || 0) + remaining
        })
        .eq('id', supplierId)
    }

    setItems([])
    setSupplierId('')
    setPaidAmount('')
    setNote('')

    await Promise.all([
      loadProducts(businessId),
      loadSuppliers(businessId),
      loadOrders(businessId)
    ])

    setMessage('Achat enregistré et stock mis à jour.')
    setSaving(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des achats...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Achats & réapprovisionnement
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <PackagePlus className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Achats enregistrés</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{orders.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total acheté</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalPurchased.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <WalletCards className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Reste fournisseur</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalRemaining.toLocaleString('fr-FR')} CFA</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Truck />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">Nouvel achat</h2>
                <p className="text-sm text-slate-500">Ajoutez les produits achetés pour augmenter le stock.</p>
              </div>
            </div>

            <form onSubmit={savePurchase} className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-700">Fournisseur</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Aucun fournisseur</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <form onSubmit={addItem} className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Produit</label>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-brand-600"
                      value={selectedProductId}
                      onChange={(e) => {
                        const nextId = e.target.value
                        setSelectedProductId(nextId)
                        const product = products.find((p) => p.id === nextId)
                        setCostPrice(product?.cost_price ? String(product.cost_price) : '')
                      }}
                    >
                      <option value="">Sélectionner produit</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} — stock {product.stock || 0}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-700">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-brand-600"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700">Prix achat unité</label>
                      <input
                        type="number"
                        min="0"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-brand-600"
                        placeholder="0"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <button className="w-full rounded-2xl border border-brand-600 bg-white py-3 font-black text-brand-700 hover:bg-brand-50">
                    Ajouter produit à l’achat
                  </button>
                </form>
              </div>

              {items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="font-black text-slate-950">{item.product_name}</p>
                        <p className="text-sm font-semibold text-slate-500">
                          {item.quantity} × {item.cost_price.toLocaleString('fr-FR')} CFA
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-black text-slate-950">
                          {(item.quantity * item.cost_price).toLocaleString('fr-FR')} CFA
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Montant payé</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Reste à payer</label>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-red-700">
                    {remaining.toLocaleString('fr-FR')} CFA
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Facture, livraison, remarques..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-300">Total achat</p>
                  <p className="text-3xl font-black">{total.toLocaleString('fr-FR')} CFA</p>
                </div>

                <button
                  disabled={saving || items.length === 0}
                  className="mt-5 w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer achat'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Historique achats</h2>
                <p className="text-sm text-slate-500">{orders.length} achat(s)</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-72"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Truck className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun achat</h3>
                <p className="mt-2 text-slate-500">Les achats enregistrés apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const date = new Date(order.created_at)

                  return (
                    <div key={order.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-black text-slate-950">
                            Achat #{order.id.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {date.toLocaleDateString('fr-FR')} • {order.suppliers?.name || 'Aucun fournisseur'}
                          </p>

                          <div className="mt-3 space-y-1">
                            {(order.purchase_items || []).map((item) => (
                              <p key={item.id} className="text-sm text-slate-600">
                                {item.products?.name || 'Produit'} — {item.quantity || 0} × {Number(item.cost_price || 0).toLocaleString('fr-FR')}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center">
                          <p className="text-xs font-bold text-slate-500">Total</p>
                          <p className="text-xl font-black text-slate-950">{Number(order.total || 0).toLocaleString('fr-FR')} CFA</p>
                          {Number(order.remaining_amount || 0) > 0 && (
                            <p className="mt-1 text-xs font-bold text-red-600">
                              Reste: {Number(order.remaining_amount || 0).toLocaleString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
