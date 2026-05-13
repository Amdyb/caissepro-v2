
  'use client'
import ProductImageUploader from '@/components/ProductImageUploader'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, ImageIcon, Package, Plus, Search, Trash2, TrendingUp } from 'lucide-react'
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
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertTriangle,
      recommendation: 'Réassort urgent'
    }
  }

  if (stockValue <= 5) {
    return {
      label: 'Stock bas',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: AlertTriangle,
      recommendation: 'Réassort conseillé'
    }
  }

  return {
    label: 'Disponible',
    className: 'bg-brand-50 text-brand-700 border-brand-200',
    icon: CheckCircle2,
    recommendation: 'Stock correct'
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

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
    if (!q) return products

    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const stockAlerts = useMemo(() => {
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0)
    const lowStock = products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5)
    const healthyStock = products.filter((product) => Number(product.stock || 0) > 5)

    return {
      outOfStock,
      lowStock,
      healthyStock,
      alertCount: outOfStock.length + lowStock.length
    }
  }, [products])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

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
      await loadProducts(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('products').insert({
      business_id: businessId,
      name: form.name,
      category: form.category || null,
      barcode: form.barcode || null,
      cost_price: Number(form.cost_price || 0),
      sell_price: Number(form.sell_price || 0),
      minimum_price: Number(form.minimum_price || form.sell_price || 0),
      stock: Number(form.stock || 0),
      image: form.image || null
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({ name: '', category: '', barcode: '', cost_price: '', sell_price: '', minimum_price: '', stock: '', image: '' })
    await loadProducts(businessId)
    setSaving(false)
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Supprimer ce produit ?')) return
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      setMessage(error.message)
      return
    }
    setProducts((current) => current.filter((p) => p.id !== productId))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement...</p>
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
            <h1 className="mt-1 text-2xl font-black text-slate-950">Produits</h1>
            <p className="text-sm font-semibold text-slate-500">{businessName}</p>
          </div>
          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Déconnexion</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Package className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Produits</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{products.length}</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <AlertTriangle className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Rupture</p>
            <p className="mt-2 text-3xl font-black text-red-700">{stockAlerts.outOfStock.length}</p>
          </div>

          <div className="rounded-3xl border border-yellow-200 bg-white p-6 shadow-sm">
            <AlertTriangle className="text-yellow-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Stock bas</p>
            <p className="mt-2 text-3xl font-black text-yellow-700">{stockAlerts.lowStock.length}</p>
          </div>

          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-sm">
            <TrendingUp className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Stock correct</p>
            <p className="mt-2 text-3xl font-black text-brand-700">{stockAlerts.healthyStock.length}</p>
          </div>
        </div>

        {stockAlerts.alertCount > 0 && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 text-red-700" />
              <div>
                <h2 className="text-xl font-black text-red-800">Attention stock</h2>
                <p className="mt-1 text-sm font-bold text-red-700">
                  {stockAlerts.outOfStock.length} produit(s) en rupture et {stockAlerts.lowStock.length} produit(s) en stock bas.
                </p>
                <Link href="/purchases" className="mt-4 inline-block rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white hover:bg-red-800">
                  Faire un réassort
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700"><Plus /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Ajouter un produit</h2>
                <p className="text-sm text-slate-500">Photo, prix minimum, stock et catégorie.</p>
              </div>
            </div>

            <form onSubmit={addProduct} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Nom du produit</label>
                <input required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="Ex: T-shirt Premium" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

             <ProductImageUploader
  value={form.image}
  onChange={(url) =>
    setForm({ ...form, image: url })
  }
/>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Catégorie</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="Mode, beauté..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Code-barres</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="Optionnel" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Prix achat</label>
                  <input type="number" min="0" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="0" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Prix minimum</label>
                  <input type="number" min="0" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="Prix le plus bas autorisé" value={form.minimum_price} onChange={(e) => setForm({ ...form, minimum_price: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Prix vente</label>
                  <input type="number" min="0" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="0" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Stock</label>
                  <input type="number" min="0" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>

              {form.image && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={form.image} alt="Aperçu produit" className="h-40 w-full object-cover" />
                </div>
              )}

              {message && <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</div>}

              <button disabled={saving} className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
                {saving ? 'Enregistrement...' : 'Ajouter le produit'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Inventaire intelligent</h2>
                <p className="text-sm text-slate-500">{products.length} produit(s)</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-72" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Package className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun produit</h3>
                <p className="mt-2 text-slate-500">Ajoutez votre premier produit pour commencer.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock || 0)
                  const status = stockStatus(stock)
                  const Icon = status.icon
                  const recommendedRestock = stock <= 0 ? 20 : stock <= 5 ? Math.max(10 - stock, 5) : 0

                  return (
                    <div key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="relative h-40 bg-slate-100">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-28 w-full object-contain bg-white" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <ImageIcon size={42} />
                          </div>
                        )}

                        <div className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${status.className}`}>
                          <Icon size={14} />
                          {status.label}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{product.category || 'Sans catégorie'}</p>
                            <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">{product.barcode || 'Sans code-barres'}</p>
                          </div>
                          <button onClick={() => deleteProduct(product.id)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-bold text-slate-500">Vente</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-bold text-slate-500">Minimum</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{Number(product.minimum_price || 0).toLocaleString('fr-FR')} CFA</p>
                          </div>
                          <div className={`rounded-2xl p-3 ${stock <= 0 ? 'bg-red-50' : stock <= 5 ? 'bg-yellow-50' : 'bg-brand-50'}`}>
                            <p className="text-xs font-bold text-slate-500">Stock</p>
                            <p className={`mt-1 text-sm font-black ${stock <= 0 ? 'text-red-700' : stock <= 5 ? 'text-yellow-700' : 'text-brand-700'}`}>{stock}</p>
                          </div>
                        </div>

                        {recommendedRestock > 0 && (
                          <div className="mt-4 rounded-2xl bg-red-50 p-3">
                            <p className="text-sm font-black text-red-700">{status.recommendation}</p>
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              Suggestion: ajouter au moins {recommendedRestock} unité(s).
                            </p>
                          </div>
                        )}
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
function profitPerUnit(product: Product) {
  return Number(product.sell_price || 0) - Number(product.cost_price || 0)
}

function marginPercent(product: Product) {
  const sell = Number(product.sell_price || 0)
  const cost = Number(product.cost_price || 0)

  if (sell <= 0) return 0

  return ((sell - cost) / sell) * 100
}

function marginStatus(percent: number) {
  if (percent >= 40) {
    return {
      label: 'Marge forte',
      className: 'bg-brand-50 text-brand-700'
    }
  }

  if (percent >= 20) {
    return {
      label: 'Marge correcte',
      className: 'bg-yellow-50 text-yellow-700'
    }
  }

  return {
    label: 'Marge faible',
    className: 'bg-red-50 text-red-700'
  }
}
