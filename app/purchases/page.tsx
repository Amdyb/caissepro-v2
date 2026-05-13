'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Boxes, PackagePlus, Plus, ReceiptText, Trash2, Truck, Wallet } from 'lucide-react'
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

type PurchaseItemDraft = {
  product_id: string
  quantity: string
  cost_price: string
}

type PurchaseOrder = {
  id: string
  total: number | null
  paid_amount: number | null
  remaining_amount: number | null
  payment_status: string | null
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

export default function PurchasesPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [note, setNote] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [items, setItems] = useState<PurchaseItemDraft[]>([
    { product_id: '', quantity: '1', cost_price: '0' }
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.cost_price || 0)
    }, 0)
  }, [items])

  const paid = Number(paidAmount || 0)
  const remaining = Math.max(total - paid, 0)

  const totalPurchases = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const totalSupplierDebt = suppliers.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0)

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
        id,
        total,
        paid_amount,
        remaining_amount,
        payment_status,
        note,
        created_at,
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

  function updateItem(index: number, field: keyof PurchaseItemDraft, value: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  function addItemRow() {
    setItems((current) => [
      ...current,
      { product_id: '', quantity: '1', cost_price: '0' }
    ])
  }

  function removeItemRow(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  async function createPurchase(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId || !userId) return

    const validItems = items.filter((item) => item.product_id && Number(item.quantity || 0) > 0)

    if (validItems.length === 0) {
      setMessage('Ajoutez au moins un produit.')
      return
    }

    if (paid > total) {
      setMessage('Le montant payé ne peut pas dépasser le total.')
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
        payment_status: remaining > 0 ? 'partial' : 'paid',
        note: note || null
      })
      .select()
      .single()

    if (orderError || !order) {
      setMessage(orderError?.message || 'Erreur lors de la création.')
      setSaving(false)
      return
    }

    const purchaseItems = validItems.map((item) => ({
      purchase_order_id: order.id,
      product_id: item.product_id,
      quantity: Number(item.quantity || 0),
      cost_price: Number(item.cost_price || 0),
      total: Number(item.quantity || 0) * Number(item.cost_price || 0)
    }))

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems)

    if (itemsError) {
      setMessage(itemsError.message)
      setSaving(false)
      return
    }

    for (const item of validItems) {
      const product = products.find((p) => p.id === item.product_id)
      const newStock = Number(product?.stock || 0) + Number(item.quantity || 0)

      await supabase
        .from('products')
        .update({
          stock: newStock,
          cost_price: Number(item.cost_price || 0)
        })
        .eq('id', item.product_id)
    }

    if (supplierId && remaining > 0) {
      const supplier = suppliers.find((s) => s.id === supplierId)
      const newBalance = Number(supplier?.balance || 0) + remaining

      await supabase
        .from('suppliers')
        .update({
          balance: newBalance
        })
        .eq('id', supplierId)
    }

    setSupplierId('')
    setNote('')
    setPaidAmount('')
    setItems([{ product_id: '', quantity: '1', cost_price: '0' }])

    await Promise.all([
      loadProducts(businessId),
      loadOrders(businessId),
      loadSuppliers(businessId)
    ])

    setMessage('Achat enregistré, stock mis à jour, solde fournisseur ajusté.')
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
              Achats & réassort
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/suppliers" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
              Fournisseurs
            </Link>

            <button
              onClick={logout}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Truck className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Fournisseurs</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{suppliers.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Boxes className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Produits</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{products.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total achats</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalPurchases.toLocaleString('fr-FR')}</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <Wallet className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dette fournisseur</p>
            <p className="mt-2 text-3xl font-black text-red-700">{totalSupplierDebt.toLocaleString('fr-FR')}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <PackagePlus />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Nouveau réassort</h2>
                <p className="text-sm text-slate-500">Ajoutez des produits achetés et augmentez le stock.</p>
              </div>
            </div>

            <form onSubmit={createPurchase} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Fournisseur</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Aucun fournisseur</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-[1.4fr_.6fr_.8fr_auto]">
                      <div>
                        <label className="text-xs font-bold text-slate-500">Produit</label>
                        <select
                          required
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-brand-600"
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        >
                          <option value="">Choisir</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} — stock {product.stock || 0}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500">Qté</label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500">Coût unité</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                          value={item.cost_price}
                          onChange={(e) => updateItem(index, 'cost_price', e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length === 1}
                        className="mt-5 rounded-2xl p-3 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                <Plus size={16} />
                Ajouter une ligne
              </button>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Montant payé</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                    placeholder="Ex: 50000"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">Reste fournisseur</p>
                  <p className="mt-1 text-2xl font-black text-red-700">
                    {remaining.toLocaleString('fr-FR')} CFA
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: livraison matin, facture #..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-300">Total achat</p>
                  <p className="text-3xl font-black">{total.toLocaleString('fr-FR')} CFA</p>
                </div>

                <button
                  disabled={saving}
                  className="mt-5 w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer réassort'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Historique des achats</h2>
            <p className="mt-1 text-sm text-slate-500">Derniers réassorts enregistrés.</p>

            {orders.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <ReceiptText className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun achat</h3>
                <p className="mt-2 text-slate-500">Les achats fournisseurs apparaîtront ici.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {orders.map((order) => {
                  const date = new Date(order.created_at)
                  return (
                    <div key={order.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-black text-slate-950">
                            {order.suppliers?.name || 'Aucun fournisseur'}
                          </p>
                          <p className="text-sm font-semibold text-slate-500">
                            {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {order.note ? ` • ${order.note}` : ''}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-black text-slate-950">
                            {Number(order.total || 0).toLocaleString('fr-FR')} CFA
                          </p>
                          {Number(order.remaining_amount || 0) > 0 && (
                            <p className="text-sm font-bold text-red-700">
                              Reste: {Number(order.remaining_amount || 0).toLocaleString('fr-FR')} CFA
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(order.purchase_items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                            <span className="font-bold text-slate-700">
                              {item.products?.name || 'Produit supprimé'} x{item.quantity || 0}
                            </span>
                            <span className="font-black text-slate-950">
                              {Number(item.total || 0).toLocaleString('fr-FR')} CFA
                            </span>
                          </div>
                        ))}
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
