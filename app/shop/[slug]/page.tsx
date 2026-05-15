'use client'

import { supabase } from '@/lib/supabaseClient'
import { MapPin, MessageCircle, Phone, Search, Share2, ShoppingBag, Store } from 'lucide-react'
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
  return `${value.toLocaleString('fr-FR')} CFA`
}

function withCacheBust(url?: string | null) {
  if (!url) return null
  return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
}

export default function PublicShopPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadShop() {
      setLoading(true)

      const { data: shop } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (!shop) {
        setLoading(false)
        return
      }

      setBusiness({
        ...shop,
        logo_url: withCacheBust(shop.logo_url),
        banner_url: withCacheBust(shop.banner_url)
      } as Business)

      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', shop.id)
        .limit(48)

      const visibleProducts = (productData || []).filter((p: any) => {
        if (p.deleted_at) return false
        if (p.archived === true) return false
        if (p.is_active === false) return false
        return true
      })

      setProducts(visibleProducts as Product[])
      setLoading(false)
    }

    loadShop()
  }, [slug])

  const primary = business?.primary_color || '#16a34a'
  const phone = (business?.whatsapp || business?.whatsapp_number || business?.phone || '').replace(/\D/g, '')

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()

    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
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

    if (navigator.share) {
      await navigator.share({
        title: business?.name || 'Boutique CaissePro',
        url
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Lien boutique copié.')
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement boutique...</p>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <Store className="mx-auto text-slate-300" size={50} />
          <h1 className="mt-4 text-3xl font-black">Boutique introuvable</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <img
          src={business.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1800&auto=format&fit=crop'}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          alt={business.name}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-emerald-950/25" />

        <div className="relative mx-auto max-w-7xl px-5 py-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur">
              <ShoppingBag size={16} />
              Boutique officielle propulsée par CaissePro
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <img
                src={business.logo_url || '/icons/caissepro-icon.svg'}
                className="h-28 w-28 rounded-[2rem] border border-white/20 object-cover shadow-2xl"
                alt={business.name}
              />

              <div>
                <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                  {business.name}
                </h1>

                <p className="mt-3 text-lg font-semibold text-white/80">
                  {business.slogan || 'Boutique en ligne moderne'}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-white/75">
                  {business.phone && (
                    <span className="flex items-center gap-2">
                      <Phone size={16} />
                      {business.phone}
                    </span>
                  )}

                  {business.address && (
                    <span className="flex items-center gap-2">
                      <MapPin size={16} />
                      {business.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={shareShop}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black backdrop-blur"
              >
                <Share2 size={18} />
                Partager
              </button>

              <button
                onClick={() => whatsappProduct()}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg"
                style={{ backgroundColor: primary }}
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              <button
                onClick={() => setCategory('')}
                className="shrink-0 rounded-2xl px-5 py-3 text-sm font-black text-white"
                style={{ backgroundColor: !category ? primary : '#0f172a' }}
              >
                Tous
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto text-slate-300" size={54} />
            <h2 className="mt-4 text-2xl font-black">Aucun produit disponible</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Contactez la boutique sur WhatsApp.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const price = Number(product.price || product.sell_price || 0)

              const image =
                product.image_url ||
                product.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop'

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative h-72 overflow-hidden bg-slate-100">
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <p
                      className="mb-2 text-xs font-black uppercase tracking-wide"
                      style={{ color: primary }}
                    >
                      {product.category || 'Produit'}
                    </p>

                    <h3 className="min-h-14 text-xl font-black leading-tight">
                      {product.name}
                    </h3>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-2xl font-black">
                        {formatCfa(price)}
                      </p>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        En stock
                      </span>
                    </div>

                    <button
                      onClick={() => whatsappProduct(product)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white shadow-lg"
                      style={{ backgroundColor: primary }}
                    >
                      <MessageCircle size={18} />
                      Commander
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 text-center text-xs font-bold text-slate-400">
          Powered by Amdy Labs · Pour le développement du commerce en Afrique
        </div>
      </section>
    </main>
  )
}
