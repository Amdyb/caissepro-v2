'use client'

import ProductBulkImporter from '@/components/ProductBulkImporter'
import AppShell from '@/components/AppShell'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Eye, FileSpreadsheet, PackagePlus, Plus, RefreshCw, ScanLine, Search, ShoppingBag, Trash2, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

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
  is_active?: boolean | null
  archived?: boolean | null
  deleted_at?: string | null
}

function stockStatus(stockValue: number) {
  if (stockValue <= 0) return { label: 'Rupture', badge: 'bg-red-600 text-white' }
  if (stockValue <= 5) return { label: 'Stock faible', badge: 'bg-amber-500 text-white' }
  return { label: 'En stock', badge: 'bg-emerald-600 text-white' }
}

export default function ProductsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showImporter, setShowImporter] = useState(false)
  const [userRole, setUserRole] = useState('owner')
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [restockSaving, setRestockSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()

    return products.filter((product) => {
      const visible = !product.deleted_at && product.archived !== true && product.is_active !== false
      const matches = product.name.toLowerCase().includes(q) || (product.category || '').toLowerCase().includes(q) || (product.barcode || '').toLowerCase().includes(q)
      return visible && matches
    })
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
        .select('business_id, role')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      setUserRole(membership.role || 'owner')
      await loadProducts(membership.business_id)
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

  async function deleteProduct(id: string) {
    const confirmed = confirm('Supprimer ce produit ?')
    if (!confirmed) return

    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        archived: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      window.dispatchEvent(new Event('play-error'))
      alert(error.message)
      return
    }

    window.dispatchEvent(new Event('play-error'))
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              is_active: false,
              archived: true,
              deleted_at: new Date().toISOString()
            }
          : p
      )
    )
  }

  async function saveRestock() {
    if (!restockProduct || restockQty === '') return
    setRestockSaving(true)
    const newStock = Number(restockQty)
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', restockProduct.id)
    setRestockSaving(false)
    if (error) { alert(error.message); return }
    setProducts((prev) => prev.map((p) => p.id === restockProduct.id ? { ...p, stock: newStock } : p))
    setRestockProduct(null)
    setRestockQty('')
  }

  function downloadTemplate() {
    const csv = 'name,prix,stock,categorie,barcode\nProduit Demo,5000,10,Vape,123456789'

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'template-produits.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const READ_ONLY_ROLES = ['sales', 'staff', 'employee', 'cashier', 'vendeur']
  const isReadOnly = READ_ONLY_ROLES.includes(userRole)

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>

  return (
    <AppShell title="Produits" subtitle="Inventaire, prix, stock et catalogue produit.">
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-800">
            <button
              onClick={() => setRestockProduct(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
            >
              <X size={16} />
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <RefreshCw size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Réassort</h2>
                <p className="text-sm font-semibold text-slate-500 truncate max-w-[180px]">{restockProduct.name}</p>
              </div>
            </div>
            <p className="mb-2 text-sm font-black text-slate-700 dark:text-slate-300">Nouveau stock</p>
            <input
              type="number"
              min="0"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-2xl font-black outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              autoFocus
            />
            <p className="mt-2 text-xs font-semibold text-slate-400">Stock actuel : {restockProduct.stock ?? 0}</p>
            <button
              onClick={saveRestock}
              disabled={restockSaving}
              className="mt-5 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {restockSaving ? 'Enregistrement...' : 'Mettre à jour le stock'}
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[1500px]">
        {isReadOnly && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <Eye size={16} className="shrink-0" />
            Mode consultation — Vous pouvez uniquement consulter les produits.
          </div>
        )}

        {!isReadOnly && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowImporter(!showImporter)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Upload size={18} />
                Importer
              </button>

              <button
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <FileSpreadsheet size={18} />
                Modèle
              </button>
            </div>

            <Link
              href="/products/new"
              className="mb-5 flex items-center justify-center gap-2 rounded-[1.6rem] bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20"
            >
              <Plus size={20} />
              Ajouter un produit
            </Link>
          </>
        )}

        {showImporter && businessId && (
          <div className="mb-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <ProductBulkImporter businessId={businessId} onImported={() => loadProducts(businessId)} />
          </div>
        )}

        {showScanner && (
          <BarcodeScanner onScan={(code) => { setSearch(code); setShowScanner(false) }} onClose={() => setShowScanner(false)} />
        )}

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-black text-slate-600 shadow-sm hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Scanner un code-barres"
          >
            <ScanLine size={20} />
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <PackagePlus className="mx-auto mb-4 text-slate-300" size={48} />
            <h3 className="text-xl font-black text-slate-950">Aucun produit</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Ajoutez vos produits pour commencer l’inventaire.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const status = stockStatus(Number(product.stock || 0))

              return (
                <div key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${status.badge}`}>
                      {status.label}
                    </span>

                    {!isReadOnly && (
                      <div className="flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={() => { setRestockProduct(product); setRestockQty(String(product.stock ?? 0)) }}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
                          title="Réassort"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <Link href={`/products/${product.id}/edit`} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          <Edit size={15} />
                        </Link>

                        <button onClick={() => deleteProduct(product.id)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-red-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {product.image ? (
                    <img src={product.image} alt={product.name} className="mb-4 w-full h-40 object-cover rounded-2xl" />
                  ) : (
                    <div className="mb-4 w-full h-40 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                      <ShoppingBag className="text-slate-300" size={32} />
                    </div>
                  )}

                  <h3 className="text-base font-black text-slate-900 dark:text-white">{product.name}</h3>
                  <p className="mt-2 text-xl font-black text-emerald-600">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">Stock: {product.stock || 0}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
