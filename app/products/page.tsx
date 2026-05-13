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
    label: 'Disponible',
    badge: 'bg-emerald-600 text-white'
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

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    const q = search.toLowerCase()

    return products.filter((product) =>
      product.name.toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q)
    )
  }, [products, search])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .single()

      if (!membership) {
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

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-24'
        } ${
          mobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Package />
              </div>

              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-black">
                    CaissePro
                  </h1>

                  <p className="text-xs font-bold text-slate-500">
                    {businessName}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block"
            >
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X />
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <LayoutDashboard />
              {sidebarOpen && 'Dashboard'}
            </Link>

            <Link
              href="/pos"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <ShoppingCart />
              {sidebarOpen && 'POS'}
            </Link>

            <Link
              href="/products"
              className="flex items-center gap-4 rounded-2xl bg-emerald-50 px-4 py-3 font-bold text-emerald-700"
            >
              <Package />
              {sidebarOpen && 'Produits'}
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <BarChart3 />
              {sidebarOpen && 'Analytics'}
            </Link>

            <Link
              href="/customers"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <Users />
              {sidebarOpen && 'Clients'}
            </Link>

            <Link
              href="/suppliers"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <Building2 />
              {sidebarOpen && 'Fournisseurs'}
            </Link>

            <Link
              href="/categories"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <Boxes />
              {sidebarOpen && 'Catégories'}
            </Link>

            <Link
              href="/purchases"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <PackagePlus />
              {sidebarOpen && 'Achats'}
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              <Settings />
              {sidebarOpen && 'Paramètres'}
            </Link>
          </nav>

          <div className="p-4">
            <button
              onClick={logout}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <section
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 lg:hidden"
              >
                <Menu />
              </button>

              <div>
                <h2 className="text-3xl font-black">
                  Produits
                </h2>

                <p className="text-sm font-semibold text-slate-500">
                  Collection produits premium
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddPanel(true)}
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white"
            >
              Ajouter
            </button>
          </div>
        </header>

        <div className="p-5">
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-3.5 text-slate-400" />

              <input
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const status = stockStatus(Number(product.stock || 0))

              return (
                <div
                  key={product.id}
                  className="group relative h-[380px] overflow-hidden rounded-3xl bg-slate-900 shadow-xl"
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

                  <div className="absolute left-4 top-4 z-10">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${status.badge}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="absolute right-4 top-4 z-10 flex gap-2">
                    <button className="rounded-full bg-white/20 p-2 text-white backdrop-blur">
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-full bg-white/20 p-2 text-white backdrop-blur"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-emerald-300">
                      {product.category || 'Produit'}
                    </p>

                    <h3 className="text-2xl font-black">
                      {product.name}
                    </h3>

                    <div className="mt-4 rounded-3xl bg-white/10 p-4 backdrop-blur">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs font-bold text-white/70">
                            Vente
                          </p>

                          <p className="mt-1 text-lg font-black">
                            {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white/70">
                            Minimum
                          </p>

                          <p className="mt-1 text-lg font-black">
                            {Number(product.minimum_price || 0).toLocaleString('fr-FR')} CFA
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white/70">
                            Stock
                          </p>

                          <p className="mt-1 text-lg font-black text-emerald-300">
                            {product.stock || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {showAddPanel && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Ajouter produit
                </h2>

                <p className="text-sm font-semibold text-slate-500">
                  Nouveau produit
                </p>
              </div>

              <button
                onClick={() => setShowAddPanel(false)}
                className="rounded-2xl bg-slate-100 p-3"
              >
                <X />
              </button>
            </div>

            <form onSubmit={addProduct} className="space-y-4">
              <input
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="Nom produit"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <ProductImageUploader
                value={form.image}
                onChange={(url) =>
                  setForm({ ...form, image: url })
                }
              />

              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="Catégorie"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />

              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="Code-barres"
                value={form.barcode}
                onChange={(e) =>
                  setForm({ ...form, barcode: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Prix achat"
                  value={form.cost_price}
                  onChange={(e) =>
                    setForm({ ...form, cost_price: e.target.value })
                  }
                />

                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Prix vente"
                  value={form.sell_price}
                  onChange={(e) =>
                    setForm({ ...form, sell_price: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Prix minimum"
                  value={form.minimum_price}
                  onChange={(e) =>
                    setForm({ ...form, minimum_price: e.target.value })
                  }
                />

                <input
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white"
              >
                {saving ? 'Enregistrement...' : 'Ajouter produit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
