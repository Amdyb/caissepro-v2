'use client'

import ProductImageUploader from '@/components/ProductImageUploader'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Package,
  PackagePlus,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
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
      badge: 'bg-red-600 text-white',
      soft: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertTriangle,
      recommendation: 'Réassort urgent'
    }
  }

  if (stockValue <= 5) {
    return {
      label: 'Stock faible',
      badge: 'bg-amber-500 text-white',
      soft: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      recommendation: 'Réassort conseillé'
    }
  }

  return {
    label: 'En stock',
    badge: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    recommendation: 'Stock correct'
  }
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
  if (percent >= 40) return { label: 'Marge forte', className: 'bg-emerald-100 text-emerald-800' }
  if (percent >= 20) return { label: 'Marge correcte', className: 'bg-amber-100 text-amber-800' }
  return { label: 'Marge faible', className: 'bg-red-100 text-red-800' }
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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

  const [editForm, setEditForm] = useState({
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

  const valuation = useMemo(() => {
    const totalCostValue = products.reduce((sum, product) => {
      return sum + Number(product.cost_price || 0) * Number(product.stock || 0)
    }, 0)

    const totalRetailValue = products.reduce((sum, product) => {
      return sum + Number(product.sell_price || 0) * Number(product.stock || 0)
    }, 0)

    const potentialProfit = totalRetailValue - totalCostValue

    return {
      totalCostValue,
      totalRetailValue,
      potentialProfit
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
    setMessage('Produit ajouté avec succès.')
    setShowAddPanel(false)
    setSaving(false)
  }

  function startEdit(product: Product) {
    setEditingProduct(product)
    setEditForm({
      name: product.name || '',
      category: product.category || '',
      barcode: product.barcode || '',
      cost_price: String(product.cost_price || 0),
      sell_price: String(product.sell_price || 0),
      minimum_price: String(product.minimum_price || 0),
      stock: String(product.stock || 0),
      image: product.image || ''
    })
  }

  async function updateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProduct || !businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('products')
      .update({
        name: editForm.name,
        category: editForm.category || null,
        barcode: editForm.barcode || null,
        cost_price: Number(editForm.cost_price || 0),
        sell_price: Number(editForm.sell_price || 0),
        minimum_price: Number(editForm.minimum_price || editForm.sell_price || 0),
        stock: Number(editForm.stock || 0),
        image: editForm.image || null
      })
      .eq('id', editingProduct.id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setEditingProduct(null)
    await loadProducts(businessId)
    setMessage('Produit modifié avec succès.')
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

  const navItems = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Ventes (POS)', href: '/pos', icon: ShoppingCart },
    { label: 'Produits', href: '/products', icon: Package, active: true },
    { label: 'Catégories', href: '/categories', icon: Boxes },
    { label: 'Clients', href: '/customers', icon: Users },
    { label: 'Fournisseurs', href: '/suppliers', icon: Building2 },
    { label: 'Achats', href: '/purchases', icon: PackagePlus },
    { label: 'Analyses', href: '/analytics', icon: BarChart3 },
    { label: 'Paramètres', href: '/settings', icon: Settings }
  ]

  function ProductForm({
    mode
  }: {
    mode: 'add' | 'edit'
  }) {
    const isEdit = mode === 'edit'
    const data = isEdit ? editForm : form
    const setData = isEdit ? setEditForm : setForm

    return (
      <form onSubmit={isEdit ? updateProduct : addProduct} className="space-y-4">
        <div>
          <label className="text-sm font-bold text-slate-700">Nom du produit</label>
          <input
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
            placeholder="Ex: Geek Vape T200"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </div>

        <ProductImageUploader
          value={data.image}
          onChange={(url) => setData({ ...data, image: url })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700">Catégorie</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Vape, Accessoires..."
              value={data.category}
              onChange={(e) => setData({ ...data, category: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Code-barres</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Optionnel"
              value={data.barcode}
              onChange={(e) => setData({ ...data, barcode: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700">Prix achat</label>
            <input
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              value={data.cost_price}
              onChange={(e) => setData({ ...data, cost_price: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Prix vente</label>
            <input
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              value={data.sell_price}
              onChange={(e) => setData({ ...data, sell_price: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700">Prix minimum</label>
            <input
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              value={data.minimum_price}
              onChange={(e) => setData({ ...data, minimum_price: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Stock</label>
            <input
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              value={data.stock}
              onChange={(e) => setData({ ...data, stock: e.target.value })}
            />
          </div>
        </div>

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer modifications' : 'Ajouter le produit'}
        </button>
      </form>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out lg:shadow-none ${
          sidebarOpen ? 'w-72' : 'w-24'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Package size={24} />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-black">CaissePro</h1>
                  <p className="text-xs font-bold text-slate-500">{businessName}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:block"
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-2xl px-4 py-3 font-bold transition ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon size={21} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="p-4">
            <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 ${sidebarOpen ? '' : 'text-center'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-black text-emerald-700 shadow-sm">
                  {businessName.slice(0, 1)}
                </div>
                {sidebarOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{businessName}</p>
                    <p className="text-xs font-bold text-slate-500">Boutique</p>
                  </div>
                )}
              </div>

              {sidebarOpen && (
                <button onClick={logout} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <h2 className="text-3xl font-black tracking-tight">Produits</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Gérez et suivez tous vos produits</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="relative hidden w-full max-w-md md:block">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowAddPanel(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-8">
          {message && (
            <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {message}
            </div>
          )}

          <div className="mb-6 block md:hidden">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <Package />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Total produits</p>
                  <p className="mt-1 text-2xl font-black">{products.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-violet-50 p-4 text-violet-700">
                  <Boxes />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Valeur stock</p>
                  <p className="mt-1 text-2xl font-black">{valuation.totalRetailValue.toLocaleString('fr-FR')} CFA</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-700">
                  <AlertTriangle />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Stock faible</p>
                  <p className="mt-1 text-2xl font-black">{stockAlerts.lowStock.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-red-50 p-4 text-red-700">
                  <AlertTriangle />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Rupture de stock</p>
                  <p className="mt-1 text-2xl font-black">{stockAlerts.outOfStock.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <button className="rounded-xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Grille</button>
              <button className="rounded-xl px-5 py-3 text-sm font-black text-slate-500">Liste</button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/purchases" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
                Réassort
              </Link>
              <Link href="/categories" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
                Catégories
              </Link>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
              <Package className="mx-auto text-slate-400" size={46} />
              <h3 className="mt-4 text-2xl font-black">Aucun produit</h3>
              <p className="mt-2 text-slate-500">Ajoutez votre premier produit pour commencer.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const stock = Number(product.stock || 0)
                const status = stockStatus(stock)
                const profit = profitPerUnit(product)
                const margin = marginPercent(product)
                const marginInfo = marginStatus(margin)

                return (
                  <article
                    key={product.id}
                    className="group relative h-[360px] overflow-hidden rounded-3xl bg-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                        <ImageIcon className="text-slate-400" size={54} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

                    <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-black shadow-lg ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="absolute right-4 top-4 z-10 flex gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white hover:text-slate-950"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                      <p className="mb-2 text-xs font-black uppercase tracking-wide text-emerald-300">
                        {product.category || 'Sans catégorie'}
                      </p>

                      <h3 className="line-clamp-2 text-2xl font-black leading-tight">
                        {product.name}
                      </h3>

                      <p className="mt-2 text-2xl font-black text-emerald-300">
                        {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-white/90">
                          Stock: {stock}
                        </p>

                        <span className={`rounded-full px-3 py-1 text-xs font-black ${marginInfo.className}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-3 rounded-2xl bg-white/10 p-3 text-xs font-bold text-white/85 backdrop-blur">
                        Profit unité: <span className={profit >= 0 ? 'text-emerald-300' : 'text-red-300'}>{profit.toLocaleString('fr-FR')} CFA</span>
                        <span className="mx-2">•</span>
                        Min: {Number(product.minimum_price || 0).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {showAddPanel && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/60">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Ajouter produit</h2>
                <p className="text-sm font-semibold text-slate-500">Créer un nouveau produit.</p>
              </div>

              <button onClick={() => setShowAddPanel(false)} className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <X size={18} />
              </button>
            </div>

            <ProductForm mode="add" />
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/60">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Modifier produit</h2>
                <p className="text-sm font-semibold text-slate-500">{editingProduct.name}</p>
              </div>

              <button onClick={() => setEditingProduct(null)} className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <X size={18} />
              </button>
            </div>

            <ProductForm mode="edit" />
          </div>
        </div>
      )}
    </main>
  )
}
