'use client'

import ProductImageUploader from '@/components/ProductImageUploader'
import CategoryPicker from '@/components/CategoryPicker'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { isProductReadOnly, READ_ONLY_MESSAGE } from '@/lib/permissions'
import { Save } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const SELECTED_BIZ_KEY = 'caissepro_selected_business_id'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = String(params.id)

  const [businessId, setBusinessId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
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

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.replace('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('role')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (isProductReadOnly(membership?.role)) {
        try { sessionStorage.setItem('products_flash', READ_ONLY_MESSAGE) } catch {}
        router.replace('/products')
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .limit(1)

      if (error) {
        setMessage(error.message)
        return
      }

      const product: any = data?.[0]
      if (!product) {
        setMessage('Produit introuvable.')
        return
      }

      const storedBiz = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_BIZ_KEY) || '' : ''
      setBusinessId(product.business_id || storedBiz)
      setForm({
        name: product.name || '',
        category: product.category || '',
        barcode: product.barcode || '',
        cost_price: String(product.cost_price || ''),
        sell_price: String(product.sell_price || ''),
        minimum_price: String(product.minimum_price || ''),
        stock: String(product.stock || ''),
        image: product.image || ''
      })

    }

    load()
  }, [productId])

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setSuccess('')

    const bizId = businessId || (typeof window !== 'undefined' ? localStorage.getItem(SELECTED_BIZ_KEY) || '' : '')

    const cleanedCategory = form.category.trim()

    let query = supabase
      .from('products')
      .update({
        name: form.name.trim(),
        category: cleanedCategory || null,
        barcode: form.barcode.trim() || null,
        cost_price: Number(form.cost_price || 0),
        sell_price: Number(form.sell_price || 0),
        minimum_price: Number(form.minimum_price || 0),
        stock: Number(form.stock || 0),
        image: form.image || null
      })
      .eq('id', productId)

    if (bizId) query = query.eq('business_id', bizId)

    const { data, error } = await query.select('id')

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    if (!data || data.length === 0) {
      setMessage("Aucun produit mis à jour. Vérifiez vos droits d'accès.")
      return
    }

    setSuccess('Produit modifié avec succès!')
    setTimeout(() => router.push('/products'), 900)
  }

  return (
    <AppShell title="Modifier produit" subtitle="Mettez à jour les informations du produit.">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        {message && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{message}</div>}
        {success && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{success}</div>}

        <form onSubmit={saveProduct} className="space-y-5">
          <input required className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500" placeholder="Nom produit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <ProductImageUploader value={form.image} businessId={businessId} onChange={(url) => setForm({ ...form, image: url })} />

          <CategoryPicker
            businessId={businessId || null}
            value={form.category}
            onChange={(name) => setForm({ ...form, category: name })}
            selectClassName="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-500"
          />

          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500" placeholder="Code-barres" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />

          <div className="grid gap-4 md:grid-cols-2">
            <input type="number" className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500" placeholder="Prix achat" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            <input type="number" className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500" placeholder="Prix vente" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
            <input type="number" className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500" placeholder="Prix minimum" value={form.minimum_price} onChange={(e) => setForm({ ...form, minimum_price: e.target.value })} />
            <input type="number" className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>

          <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-black text-white disabled:opacity-60"><Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer modifications'}</button>
        </form>
      </div>
    </AppShell>
  )
}
