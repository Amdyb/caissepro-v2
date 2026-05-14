'use client'

import ProductImageUploader from '@/components/ProductImageUploader'
import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit,
  ImageIcon,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Product = {
  id: string
  business_id: string
  name: string
  barcode: string | null
  category: string | null
  cost_price: number | null
  sell_price: number | null
  minimum_price: number | null
  stock: number | null
  image: string | null
  created_at: string
}

function stockStatus(stockValue: number) {
  if (stockValue <= 0) {
    return {
      label: 'Rupture',
      badge: 'bg-red-600 text-white'
    }
  }

  if (stockValue <= 5) {
    return {
      label: 'Stock faible',
      badge: 'bg-amber-500 text-white'
    }
  }

  return {
    label: 'En stock',
    badge: 'bg-emerald-600 text-white'
  }
}

export default function ProductsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showAddPanel, setShowAddPanel] = useState(false)

  const [form, setForm] = useState({
    name: '',
    category: '',
    barcode: '',
    cost_price: '',
    sell_price: '',
    minimum_price: '',
    stock: '',
    image: ''
  })

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()

    return products.filter((product) =>
      product.name.toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q) ||
      (product.barcode || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean))
    ) as string[]

    return unique.slice(0, 6)
  }, [products])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .single()

      if (!membership) {
        setLoading(false)
        return
      }

      const member: any = membership

      setBusinessId(member.business_id)
      await loadProducts(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    setProducts((data || []) as Product[])
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('products')
      .insert({
        business_id: businessId,
        name: form.name,
        category: form.category || null,
        barcode: form.barcode || null,
        cost_price: Number(form.cost_price || 0),
        sell_price: Number(form.sell_price || 0),
        minimum_price: Number(form.minimum_price || 0),
        stock: Number(form.stock || 0),
        image: form.image || null
      })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({
      name: '',
      category: '',
      barcode: '',
      cost_price: '',
      sell_price: '',
      minimum_price: '',
      stock: '',
      image: ''
    })

    await loadProducts(businessId)
    setShowAddPanel(false)
    setSaving(false)
  }

  async function deleteProduct(id: string) {
    const confirmed = confirm('Supprimer ce produit ?')

    if (!confirmed) return

    await supabase
      .from('products')
      .delete()
      .eq('id', id)

    setProducts(products.filter((p) => p.id !== id))
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Produits"
      subtitle="Inventaire, prix, stock et catalogue produit."
      action={
        <button
          onClick={() => setShowAddPanel(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Ajouter
        </button>
      }
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSearch('')}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-sm"
            >
              Tous
            </button>

            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSearch(category)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <PackagePlus className="mx-auto mb-4 text-slate-300" size={54} />
            <h3 className="text-xl font-black text-slate-950">Aucun produit</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Ajoutez votre premier produit pour commencer l’inventaire.</p>
            <button
              onClick={() => setShowAddPanel(true)}
              className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white"
            >
              Ajouter un produit
            </button>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const status = stockStatus(Number(product.stock || 0))

              return (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${status.badge}`}>
                      {status.label}
                    </span>

                    <div className="flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-emerald-700">
                        <Edit size={15} />
                      </button>

                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 min-h-[70px]">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-emerald-600">
                      {product.category || 'Produit'}
                    </p>
                    <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-900">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-50 p-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                        <ImageIcon className="text-slate-300" size={44} />
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">Prix</p>
                        <p className="mt-1 text-lg font-black text-emerald-600">
                          {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">Stock</p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {product.stock || 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500">Coût</p>
                        <p className="text-sm font-black text-slate-800">
                          {Number(product.cost_price || 0).toLocaleString('fr-FR')} CFA
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-bold text-slate-500">Minimum</p>
                        <p className="text-sm font-black text-slate-800">
                          {Number(product.minimum_price || 0).toLocaleString('fr-FR')} CFA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddPanel && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50 backdrop-blur-sm">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Ajouter produit</h2>
                <p className="text-sm font-semibold text-slate-500">Créer un nouveau produit dans l’inventaire.</p>
              </div>

              <button
                onClick={() => setShowAddPanel(false)}
                className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
              >
                <X />
              </button>
            </div>

            <form onSubmit={addProduct} className="space-y-4">
              <input
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                placeholder="Nom produit"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <ProductImageUploader
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
              />

              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                placeholder="Catégorie"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />

              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                placeholder="Code-barres"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Prix achat"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                />

                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Prix vente"
                  value={form.sell_price}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Prix minimum"
                  value={form.minimum_price}
                  onChange={(e) => setForm({ ...form, minimum_price: e.target.value })}
                />

                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Ajouter produit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
