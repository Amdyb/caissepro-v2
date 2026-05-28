'use client'

import { supabasePublic as supabase } from '@/lib/supabasePublic'
import { sendOrderNotification } from '@/lib/whatsapp'
import Image from 'next/image'
import { ChevronRight, MapPin, MessageCircle, Navigation, Phone, Search, Share2, ShoppingBag, Sparkles, Store, Verified, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Business = {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
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

const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave', emoji: '🌊', color: '#2563eb' },
  { id: 'orange_money', label: 'Orange Money', emoji: '🟠', color: '#ea580c' },
  { id: 'cash', label: 'Espèces', emoji: '💵', color: '#16a34a' },
  { id: 'card', label: 'Carte bancaire', emoji: '💳', color: '#7c3aed' },
]

function formatCfa(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} CFA`
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPayment, setSelectedPayment] = useState('wave')

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

        if (response.error) { setError(response.error.message); return }

        const shop = response.data?.[0]
        if (!shop) { setError('Boutique introuvable'); return }

        setBusiness(shop as Business)

        const productsResponse = await supabase
          .from('products')
          .select('*')
          .eq('business_id', shop.id)
          .order('created_at', { ascending: false })

        const visibleProducts = (productsResponse.data || []).filter((p: any) => {
          if (p.deleted_at) return false
          if (p.archived === true) return false
          if (p.is_active === false) return false
          return true
        })

        setProducts(shuffleArray(visibleProducts) as Product[])
      } catch (err: any) {
        setError(err?.message || 'Erreur storefront')
      } finally {
        setLoading(false)
      }
    }

    loadShop()
  }, [slug])

  const primary = business?.primary_color || '#16a34a'
  const secondary = business?.secondary_color || '#0f172a'
  const phone = (business?.whatsapp || business?.whatsapp_number || business?.phone || '').replace(/\D/g, '')

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((p) => {
      const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
      const matchCategory = !category || p.category === category
      return matchSearch && matchCategory
    })
  }, [products, search, category])

  function openOrderModal(product: Product) {
    setSelectedProduct(product)
    setSelectedPayment('wave')
  }

  function sendWhatsAppOrder() {
    if (!selectedProduct) return
    const paymentLabel = PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label || selectedPayment
    const price = Number(selectedProduct.price || selectedProduct.sell_price || 0)
    const text = `Bonjour ${business?.name} 👋\n\nJe souhaite commander :\n\n🛍️ *${selectedProduct.name}*\n💰 ${formatCfa(price)}\n💳 Paiement : ${paymentLabel}\n\nMerci de confirmer la disponibilité.`
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')

    // Notify merchant via Twilio when an online order is placed
    const merchantPhone = business?.whatsapp || business?.whatsapp_number || business?.phone
    if (merchantPhone) {
      sendOrderNotification(merchantPhone, {
        id: Date.now().toString(),
        customer_name: 'Client en ligne',
        product_name: selectedProduct.name,
        quantity: 1,
        total: price,
      }).catch(() => {})
    }

    setSelectedProduct(null)
  }

  function whatsappGeneral() {
    const text = `Bonjour ${business?.name}, je veux plus d'informations sur vos produits.`
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  async function shareShop() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: business?.name || 'Boutique CaissePro', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Lien boutique copié.')
      }
    } catch {}
  }

  const mapsUrl = business?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
    : null

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><div className="h-14 w-14 animate-pulse rounded-full bg-emerald-500" /></main>
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
          <Store className="mx-auto mb-5 text-white/40" size={52} />
          <h1 className="text-3xl font-black">Boutique introuvable</h1>
          <p className="mt-4 text-sm font-bold text-white/60">{error}</p>
        </div>
      </main>
    )
  }

  if (!business) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><div className="rounded-3xl border border-white/10 bg-white/5 p-10"><Store size={50} /></div></main>
  }

  const selectedProductPrice = Number(selectedProduct?.price || selectedProduct?.sell_price || 0)
  const selectedProductImage = selectedProduct?.image_url || selectedProduct?.image

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src={business.banner_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1800&auto=format&fit=crop'}
          fill
          className="object-cover opacity-55"
          alt={business.name}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-[#050505]" />

        <div className="relative pb-10 pt-5 md:pb-14 md:pt-10">
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
              <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/10 bg-white shadow-2xl">
                <Image src={business.logo_url || '/icons/caissepro-icon.svg'} fill className="object-cover" alt={business.name} />
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black" style={{ backgroundColor: primary + '33', color: primary }}>
                  <Verified size={14} /> Commerce vérifié
                </div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">{business.name}</h1>
                <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-white/85 md:text-xl">
                  {business.slogan || 'Une expérience shopping premium et moderne'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-bold text-white/80">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl hover:bg-white/10">
                  <Phone size={15} />{business.phone}
                </a>
              )}
              {business.address && mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl hover:bg-white/10">
                  <MapPin size={15} />{business.address}
                  <Navigation size={13} className="text-emerald-400" />
                </a>
              )}
              {business.address && !mapsUrl && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                  <MapPin size={15} />{business.address}
                </div>
              )}
            </div>

            {/* Google Maps CTA */}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-black"
                style={{ borderColor: primary + '55', backgroundColor: primary + '1a', color: primary }}
              >
                <Navigation size={16} /> Itinéraire Google Maps
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Category bar */}
      <section className="sticky top-0 z-40 border-y border-white/5 backdrop-blur-2xl" style={{ backgroundColor: secondary + 'cc' }}>
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 py-4">
          <button onClick={() => setCategory('')} className="shrink-0 rounded-full px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: !category ? primary : '#171717' }}>Tous</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className="shrink-0 rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/80" style={{ backgroundColor: category === cat ? primary : '#111111' }}>{cat}</button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.3em] text-white/40"><ShoppingBag size={14} />Collection</div>
            <h2 className="text-4xl font-black tracking-tight md:text-6xl">Produits populaires</h2>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit"
              className="w-full rounded-full border border-white/10 bg-[#111111] py-4 pl-14 pr-5 text-sm font-bold text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const price = Number(product.price || product.sell_price || 0)
            const image = product.image_url || product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop'

            return (
              <div key={product.id} className="group overflow-hidden rounded-[2rem] border bg-[#0e0e0e] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_80px_rgba(0,0,0,0.45)]" style={{ borderColor: secondary + '55' }}>
                <div className="relative h-[320px] overflow-hidden">
                  <Image src={image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
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

                    <button
                      onClick={() => openOrderModal(product)}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-4 text-sm font-black text-white shadow-2xl"
                      style={{ backgroundColor: primary }}
                    >
                      Commander <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center" style={{ borderTopColor: secondary + '44', backgroundColor: secondary + '22' }}>
        <p className="text-xs font-bold text-white/30">
          Boutique propulsée par{' '}
          <a href="https://caissepro.app" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/80">CaissePro</a>
          {' · '}
          <a href="/legal" className="hover:text-white/50">Mentions légales</a>
        </p>
      </footer>

      {/* Floating WhatsApp */}
      <button
        onClick={whatsappGeneral}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-black text-white shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
        style={{ backgroundColor: primary }}
      >
        <MessageCircle size={22} />WhatsApp
      </button>

      {/* Order modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center" onClick={() => setSelectedProduct(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2rem] bg-[#0e0e0e] sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product image + info */}
            {selectedProductImage && (
              <div className="relative h-52 w-full overflow-hidden">
                <Image src={selectedProductImage} alt={selectedProduct.name} fill className="object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
            )}

            <div className="p-6">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">{selectedProduct.category || 'Produit'}</p>
                  <h3 className="mt-1 text-2xl font-black text-white">{selectedProduct.name}</h3>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="shrink-0 rounded-2xl bg-white/10 p-2 text-white/60 hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>

              <p className="mt-2 text-3xl font-black" style={{ color: primary }}>{formatCfa(selectedProductPrice)}</p>

              {/* Payment method selector */}
              <div className="mt-5">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/40">Mode de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition"
                      style={{
                        backgroundColor: selectedPayment === method.id ? method.color + '22' : 'transparent',
                        borderColor: selectedPayment === method.id ? method.color : 'rgba(255,255,255,0.1)',
                        color: selectedPayment === method.id ? 'white' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span>{method.emoji}</span> {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={sendWhatsAppOrder}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl"
                style={{ backgroundColor: primary }}
              >
                <MessageCircle size={20} /> Commander via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
