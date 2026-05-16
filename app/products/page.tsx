'use client'

import ProductBulkImporter from '@/components/ProductBulkImporter'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, PackagePlus, Plus, Search, Trash2 } from 'lucide-react'
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
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
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
      alert(error.message)
      return
    }

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

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>

  return (
    <AppShell title="Produits" subtitle="Inventaire, prix, stock et catalogue produit." action={<Link href="/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg"><Plus size={18} />Ajouter</Link>}>
      <div className="mx-auto max-w-[1500px]">
        {businessId && <ProductBulkImporter businessId={businessId} onImported={() => loadProducts(businessId)} />}

        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none" placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <PackagePlus className="mx-auto mb-4 text-slate-300" size={54} />
            <h3 className="text-xl font-black text-slate-950">Aucun produit</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Ajoutez ou importez vos produits pour commencer l’inventaire.</p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const status = stockStatus(Number(product.stock || 0))

              return (
                <div key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${status.badge}`}>
                      {status.label}
                    </span>

                    <div className="flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <Link href={`/products/${product.id}/edit`} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-emerald-700">
                        <Edit size={15} />
                      </Link>

                      <button onClick={() => deleteProduct(product.id)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-xl font-black text-emerald-600">{Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">Stock: {product.stock || 0}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
