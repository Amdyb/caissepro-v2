'use client'

import AppShell from '@/components/AppShell'
import CategoryPicker from '@/components/CategoryPicker'
import { PlanName, getNumericLimit } from '@/lib/plans'
import { supabase } from '@/lib/supabaseClient'
import { uploadImage, validateImageFile, getSelectedBusinessId } from '@/lib/uploadImage'
import { isProductReadOnly, READ_ONLY_MESSAGE } from '@/lib/permissions'
import { ArrowLeft, ImagePlus, Loader2, PackagePlus, Save, ScanLine } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

export default function NewProductPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanName>('free')
  const [productCount, setProductCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const [imagePreview, setImagePreview] = useState('')

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

      if (!membership?.business_id) return

      if (isProductReadOnly(membership.role, membership.business_id)) {
        try { sessionStorage.setItem('products_flash', READ_ONLY_MESSAGE) } catch {}
        router.replace('/products')
        return
      }

      const bId = membership.business_id
      setBusinessId(bId)

      const [subResult, countResult] = await Promise.all([
        supabase.from('subscriptions').select('plan').eq('business_id', bId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('business_id', bId).not('archived', 'is', true),
      ])
      setPlan((subResult.data?.plan as PlanName) || 'free')
      setProductCount(countResult.count || 0)
    }

    init()
  }, [router])

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId) return

    const limit = getNumericLimit(plan, 'products')
    if (limit !== -1 && productCount >= limit) {
      setMessage(`Limite atteinte : votre plan ${plan === 'free' ? 'Gratuit' : plan} permet ${limit} produits maximum. Passez à un plan supérieur pour en ajouter plus.`)
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      business_id: businessId,
      name: form.name,
      category: form.category || null,
      barcode: form.barcode || null,
      cost_price: Number(form.cost_price || 0),
      sell_price: Number(form.sell_price || 0),
      minimum_price: Number(form.minimum_price || 0),
      stock: Number(form.stock || 0),
      image: form.image || null,
      is_active: true,
      archived: false
    }

    const { error } = await supabase
      .from('products')
      .insert(payload)

    setSaving(false)

    if (error) {
      setMessage(error.message)
      window.dispatchEvent(new Event('play-error'))
      return
    }

    window.dispatchEvent(new Event('play-success'))
    router.push('/products')
  }

  async function handleProductImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')

    const validationError = validateImageFile(file)
    if (validationError) { setImageError(validationError); return }

    // Instant preview before the upload completes.
    setImagePreview(URL.createObjectURL(file))
    setUploadingImage(true)

    try {
      const bId = businessId || getSelectedBusinessId()
      const { url } = await uploadImage({ file, bucket: 'product-images', businessId: bId })
      setForm(f => ({ ...f, image: url }))
      setImagePreview('')
    } catch (err: any) {
      setImageError(err.message || "Erreur lors de l'upload de l'image.")
      setImagePreview('')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <AppShell title="Ajouter produit" subtitle="Ajoutez un nouveau produit à votre boutique.">
      <div className="mx-auto max-w-3xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
            {message}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PackagePlus className="text-emerald-600" />
              <h2 className="text-3xl font-black text-slate-950">Nouveau produit</h2>
            </div>

            <Link href="/products" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
              <ArrowLeft size={16} />Retour
            </Link>
          </div>

          {showScanner && (
            <BarcodeScanner onScan={(code) => { setForm(f => ({ ...f, barcode: code })); setShowScanner(false) }} onClose={() => setShowScanner(false)} />
          )}

          <form onSubmit={createProduct} className="space-y-5">
            <input required placeholder="Nom produit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none" />

            <div className="grid gap-5 md:grid-cols-2">
              <CategoryPicker businessId={businessId} value={form.category} onChange={(name) => setForm({ ...form, category: name })} />
              <div className="flex gap-2">
                <input placeholder="Code-barres" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none" />
                <button type="button" onClick={() => setShowScanner(true)} className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-black text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700" title="Scanner un code-barres">
                  <ScanLine size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <input type="number" placeholder="Prix achat" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none" />
              <input type="number" placeholder="Prix vente" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none" />
              <input type="number" placeholder="Prix minimum" value={form.minimum_price} onChange={(e) => setForm({ ...form, minimum_price: e.target.value })} className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Image produit (optionnel)</label>
              {(form.image || imagePreview) && (
                <div className="relative mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image || imagePreview} alt="Produit" className="h-28 w-full bg-white object-contain" />
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Loader2 className="animate-spin text-emerald-600" size={26} />
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => (document.getElementById('product-image-upload') as HTMLInputElement)?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {uploadingImage
                  ? <><Loader2 className="animate-spin" size={17} /> Upload en cours...</>
                  : <><ImagePlus size={17} /> {form.image ? "Changer l'image" : "Ajouter l'image du produit"}</>}
              </button>
              <p className="mt-2 text-xs font-semibold text-slate-400">JPG, PNG, WEBP — max 5MB. Le produit peut être créé sans image.</p>
              {imageError && <p className="mt-2 text-sm font-bold text-red-700">{imageError}</p>}
              <input id="product-image-upload" type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
            </div>

            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white shadow-2xl shadow-emerald-200 disabled:opacity-50">
              <Save size={20} />
              {saving ? 'Création...' : 'Créer produit'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
