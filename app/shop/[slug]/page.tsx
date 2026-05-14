'use client'

import { supabase } from '@/lib/supabaseClient'
import { Crown, ImageIcon, MessageCircle, Search, Share2, ShoppingBag, Store } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Business = {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  whatsapp_number: string | null
  online_store_enabled: boolean | null
  business_phone?: string | null
  business_address?: string | null
  slogan?: string | null
}

type Product = {
  id: string
  name: string
  category: string | null
  sell_price: number | null
  stock: number | null
  image: string | null
}

function formatCfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function PublicShopPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [plan, setPlan] = useState('free')

  const primary = business?.primary_color || '#16a34a'

  useEffect(() => {
    async function loadShop() {
      const { data: shop, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !shop) {
        setMessage('Boutique introuvable.')
        setLoading(false)
        return
      }

      setBusiness(shop as Business)

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan,status')
        .eq('business_id', shop.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const activePlan = subscription?.plan || 'free'
      setPlan(activePlan)

      const allowed = activePlan === 'business' || activePlan === 'premium'

      if (!shop.online_store_enabled || !allowed) {
        setMessage('Cette boutique nécessite un plan Business ou Premium pour être publiée.')
        setLoading(false)
        return
      }

      const { data: productData } = await supabase
        .from('products')
        .select('id, name, category, sell_price, stock, image')
        .eq('business_id', shop.id)
        .gt('stock', 0)
        .order('created_at', { ascending: false })

      setProducts((productData || []) as Product[])
      setLoading(false)
    }

    loadShop()
  }, [slug])

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => {
      const searchOk = !q || product.name.toLowerCase().includes(q) || (product.category || '').toLowerCase().includes(q)
      const categoryOk = !category || product.category === category
      return searchOk && categoryOk
    })
  }, [products, search, category])

  function whatsappProduct(product?: Product) {
    const phone = (business?.whatsapp_number || business?.business_phone || '').replace(/\D/g, '')
    const text = product
      ? `Bonjour ${business?.name}, je veux commander: ${product.name} (${formatCfa(Number(product.sell_price || 0))}).`
      : `Bonjour ${business?.name}, je veux plus d'informations sur vos produits.`

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`

    window.open(url, '_blank')
  }

  async function shareShop() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: business?.name || 'Boutique CaissePro', text: `Découvrez la boutique ${business?.name}`, url })
      return
    }
    await navigator.clipboard.writeText(url)
    alert('Lien boutique copié.')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement boutique...</p></main>
  }

  if (!business || message) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
            <Crown size={42} />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">Boutique non publiée</h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">{message || 'Cette boutique est introuvable.'}</p>
          {business && (
            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-500">{business.name}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">Plan actuel: {plan}</p>
            </div>
          )}
          <a href="/pricing" className="mt-6 inline-flex rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-white hover:bg-amber-600">
            Voir les plans CaissePro
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: business.banner_url ? `url(${business.banner_url})` : 'none', backgroundColor: primary }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-28 md:pb-14 md:pt-36">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl md:h-32 md:w-32">
                {business.logo_url ? <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" /> : <Store className="text-slate-300" size={48} />}
              </div>
              <div className="pb-2 text-white">
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">{business.name}</h1>
                <p className="mt-2 text-sm font-bold text-white/80 md:text-base">{business.slogan || 'Boutique officielle'}</p>
                {business.business_address && <p className="mt-1 text-sm font-semibold text-white/70">{business.business_address}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={shareShop} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/25"><Share2 size={18} />Partager</button>
              <button onClick={() => whatsappProduct()} className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg" style={{ backgroundColor: primary }}><MessageCircle size={18} />WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none" /></div>
            <div className="flex gap-3 overflow-x-auto pb-1"><button onClick={() => setCategory('')} className="shrink-0 rounded-2xl px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: !category ? primary : '#0f172a' }}>Tous</button>{categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">{cat}</button>)}</div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><ShoppingBag className="mx-auto text-slate-300" size={54} /><h2 className="mt-4 text-2xl font-black text-slate-950">Aucun produit disponible</h2><p className="mt-2 text-sm font-semibold text-slate-500">Revenez bientôt ou contactez la boutique sur WhatsApp.</p></div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-50 p-4">{product.image ? <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-slate-300" size={48} />}</div>
                <div className="mt-5"><p className="mb-2 text-xs font-black uppercase tracking-wide" style={{ color: primary }}>{product.category || 'Produit'}</p><h3 className="line-clamp-2 min-h-[48px] text-lg font-black leading-snug text-slate-950">{product.name}</h3><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xl font-black text-slate-950">{formatCfa(Number(product.sell_price || 0))}</p><p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">En stock</p></div><button onClick={() => whatsappProduct(product)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white shadow-lg transition hover:opacity-90" style={{ backgroundColor: primary }}><MessageCircle size={18} />Commander sur WhatsApp</button></div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm"><p className="text-sm font-bold text-slate-500">Boutique propulsée par</p><p className="mt-1 text-xl font-black text-slate-950">CaissePro</p></div>
      </section>
    </main>
  )
}
