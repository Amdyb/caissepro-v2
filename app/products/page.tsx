'use client'

import ProductImageUploader from '@/components/ProductImageUploader'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
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
  if (stockValue <= 0) return { label: 'Rupture', badge: 'bg-red-600 text-white' }
  if (stockValue <= 5) return { label: 'Stock faible', badge: 'bg-amber-500 text-white' }
  return { label: 'En stock', badge: 'bg-emerald-600 text-white' }
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

  const [form, setForm] = useState({ name: '', category: '', barcode: '', cost_price: '', sell_price: '', minimum_price: '', stock: '', image: '' })

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => product.name.toLowerCase().includes(q) || (product.category || '').toLowerCase().includes(q) || (product.barcode || '').toLowerCase().includes(q))
  }, [products, search])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      const { data: membership } = await supabase.from('business_members').select('business_id').eq('user_id', userData.user.id).limit(1).maybeSingle()
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
    const { data } = await supabase.from('products').select('*').eq('business_id', id).order('created_at', { ascending: false })
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
      minimum_price: Number(form.minimum_price || 0),
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
    setShowAddPanel(false)
    setSaving(false)
  }

  async function deleteProduct(id: string) {
    const confirmed = confirm('Supprimer ce produit ?')
    if (!confirmed) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(products.filter((p) => p.id !== id))
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>

  return (
    <AppShell title="Produits" subtitle="Inventaire, prix, stock et catalogue produit.">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const status = stockStatus(Number(product.stock || 0))
            return (
              <div key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-black ${status.badge}`}>{status.label}</span>
                  <div className="flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <Link href={`/products/${product.id}/edit`} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-emerald-700"><Edit size={15} /></Link>
                    <button onClick={() => deleteProduct(product.id)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
                <h3 className="text-base font-black text-slate-900">{product.name}</h3>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
