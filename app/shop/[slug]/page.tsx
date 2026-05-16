'use client'

import { supabase } from '@/lib/supabaseClient'
import { ChevronRight, MapPin, MessageCircle, Phone, Search, Share2, ShoppingBag, Sparkles, Store, Verified } from 'lucide-react'
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
  phone?: string | null
  whatsapp?: string | null
  address?: string | null
  slogan?: string | null
}

type Product = {
  id: string
  name: string
  category: string | null
  price: number | null
  sell_price?: number | null
  stock: number | null
  image_url?: string | null
  image?: string | null
  is_active?: boolean | null
  deleted_at?: string | null
  archived?: boolean | null
}

function formatCfa(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} CFA`
}

export default function PublicShopPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug

  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadShop() {
      try {
        setLoading(true)
        setError(null)

        if (!slug || typeof slug !== 'string') {
          setError('Slug boutique invalide')
          return
        }

        const response = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', slug)
          .limit(1)

        if (response.error) {
          console.error(response.error)
          setError(response.error.message)
          return
        }

        const shop = response.data?.[0]

        if (!shop) {
          setError('Boutique introuvable')
          return
        }

        setBusiness(shop as Business)

        const productsResponse = await supabase
          .from('products')
          .select('*')
          .eq('business_id', shop.id)
          .order('created_at', { ascending: false })

        if (productsResponse.error) {
          console.error(productsResponse.error)
        }

        const visibleProducts = (productsResponse.data || []).filter((p: any) => {
          if (p.deleted_at) return false
          if (p.archived === true) return false
          if (p.is_active === false) return false
          return true
        })

        setProducts(visibleProducts as Product[])
      } catch (err: any) {
        console.error(err)
        setError(err?.message || 'Erreur storefront')
      } finally {
        setLoading(false)
      }
    }

    loadShop()
  }, [slug])

  const primary = business?.primary_color || '#16a34a'
  const phone = (business?.whatsapp || business?.whatsapp_number || business?.phone || '').replace(/\D/g, '')

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()

    return products.filter((p) => {
      const name = p.name || ''
      const cat = p.category || ''

      const matchSearch = !q || name.toLowerCase().includes(q) || cat.toLowerCase().includes(q)
      const matchCategory = !category || p.category === category

      return matchSearch && matchCategory
    })
  }, [products, search, category])

  function whatsappProduct(product?: Product) {
    const text = product
      ? `Bonjour ${business?.name}, je veux commander: ${product.name} (${formatCfa(Number(product.price || product.sell_price || 0))}).`
      : `Bonjour ${business?.name}, je veux plus d'informations sur vos produits.`

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`

    window.open(url, '_blank')
  }

  async function shareShop() {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: business?.name || 'Boutique CaissePro',
          url
        })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Lien boutique copié.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><div className="h-14 w-14 animate-pulse rounded-full bg-emerald-500" /></main>
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
          <Store className="mx-auto mb-5 text-white/40" size={52} />
          <h1 className="text-3xl font-black">Storefront Error</h1>
          <p className="mt-4 text-sm font-bold text-white/60">{error}</p>
        </div>
      </main>
    )
  }

  if (!business) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><div className="rounded-3xl border border-white/10 bg-white/5 p-10"><Store size={50} /></div></main>
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden">
        <img src={business.banner_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1800&auto=format&fit=crop'} className="absolute inset-0 h-full w-full object-cover opacity-40" alt={business.name} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-[#050505]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-10 md:pb-28 md:pt-20">
          <div className="mb-8 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] backdrop-blur-xl">
              <Sparkles size={14} /> Premium Store
            </div>

            <button onClick={shareShop} className="rounded-full border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <Share2 size={18} />
            </button>
          </div>

          <div className="max-w-4xl">
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center">
              <div className="h-28 w-28 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
                <img src={business.logo_url || '/icons/caissepro-icon.svg'} className="h-full w-full object-cover" alt={business.name} />
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-black text-emerald-300">
                  <Verified size={14} /> Commerce vérifié
                </div>

                <h1 className="text-5xl font-black tracking-tight md:text-7xl">{business.name}</h1>

                <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-white/70 md:text-xl">
                  {business.slogan || 'Une expérience shopping premium et moderne'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-bold text-white/70">
              {business.phone && <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl"><Phone size={15} />{business.phone}</div>}
              {business.address && <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl"><MapPin size={15} />{business.address}</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 border-y border-white/5 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 py-4">
          <button onClick={() => setCategory('')} className="shrink-0 rounded-full px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: !category ? primary : '#171717' }}>Tous</button>
          {categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className="shrink-0 rounded-full border border-white/10 bg-[#111111] px-5 py-3 text-sm font-bold text-white/80">{cat}</button>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.3em] text-white/40"><ShoppingBag size={14} />Collection</div>
            <h2 className="text-4xl font-black tracking-tight md:text-6xl">Produits populaires</h2>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit" className="w-full rounded-full border border-white/10 bg-[#111111] py-4 pl-14 pr-5 text-sm font-bold text-white outline-none placeholder:text-white/30" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const price = Number(product.price || product.sell_price || 0)
            const image = product.image_url || product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop'

            return (
              <div key={product.id} className="group overflow-hidden rounded-[2rem] border border-white/5 bg-[#0e0e0e] transition duration-300 hover:-translate-y-2 hover:border-white/10 hover:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                <div className="relative overflow-hidden">
                  <img src={image} alt={product.name} className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 rounded-full bg-black/60 px-4 py-2 text-xs font-black uppercase tracking-wide backdrop-blur-xl">{product.category || 'Produit'}</div>
                </div>

                <div className="p-6">
                  <h3 className="min-h-[64px] text-2xl font-black leading-tight tracking-tight">{product.name}</h3>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-white/40">Prix</p>
                      <p className="text-3xl font-black" style={{ color: primary }}>{formatCfa(price)}</p>
                    </div>

                    <button onClick={() => whatsappProduct(product)} className="inline-flex items-center gap-2 rounded-full px-5 py-4 text-sm font-black text-white shadow-2xl" style={{ backgroundColor: primary }}>
                      Commander
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )})}
        </div>
      </section>

      <button onClick={() => whatsappProduct()} className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-black text-white shadow-[0_10px_40px_rgba(0,0,0,0.45)]" style={{ backgroundColor: primary }}>
        <MessageCircle size={22} />WhatsApp
      </button>
    </main>
  )
}
