'use client'

import { createClient } from '@supabase/supabase-js'
import { sendOrderNotification } from '@/lib/whatsapp'
import Image from 'next/image'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Trash2,
  Verified,
  Waves,
  X,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Dedicated no-auth client — never inherits session from the app's auth client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
)

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
  sell_price?: number | null
  price?: number | null
  stock: number | null
  image?: string | null
  image_url?: string | null
}

type CartLine = { product: Product; qty: number }

type Row = { key: string; title: string; products: Product[] }

const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave', color: '#2563eb', Icon: Waves },
  { id: 'orange_money', label: 'Orange Money', color: '#ea580c', Icon: Smartphone },
  { id: 'cash', label: 'Espèces', color: '#16a34a', Icon: Banknote },
  { id: 'card', label: 'Carte bancaire', color: '#7c3aed', Icon: CreditCard },
]

// Preferred Netflix-style category rows, in display order. Matching is
// accent/case insensitive: a category matches when its normalized name contains
// any of the (singular) tokens, so plurals and variants ("Puffs Jetables",
// "E-Liquides", "Bobines") all land in the right row.
const PREFERRED_ROWS: { key: string; title: string; match: string[] }[] = [
  { key: 'jetables', title: 'Jetables', match: ['jetable', 'puff'] },
  { key: 'appareils', title: 'Appareils / Pods', match: ['appareil', 'pod'] },
  { key: 'eliquides', title: 'E-Liquides', match: ['liquide'] },
  { key: 'resistances', title: 'Résistances / Bobines', match: ['resistance', 'bobine', 'coil'] },
  { key: 'accessoires', title: 'Accessoires', match: ['accessoire'] },
]

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function formatCfa(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} CFA`
}

function priceOf(p: Product) {
  return Number(p.sell_price ?? p.price ?? 0)
}

function imageOf(p: Product) {
  return p.image || p.image_url || null
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Brand key derived from the product name (no brand column in DB). We use the
// first meaningful token so same-line products (e.g. "Vaporesso XROS",
// "Vaporesso Luxe") are treated as the same brand for the anti-clustering pass.
function brandOf(p: Product): string {
  const name = (p.name || '').trim()
  if (!name) return p.id
  const first = name.split(/[\s\-|,/]+/)[0]
  return normalize(first || name) || p.id
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Brand-aware shuffle: shuffles products, then interleaves so that no two
// adjacent items share a brand whenever the brand distribution allows it.
function brandAwareShuffle(products: Product[]): Product[] {
  if (products.length <= 2) return shuffle(products)

  // Group by brand, shuffle within each group and the group order.
  const groups = new Map<string, Product[]>()
  for (const p of products) {
    const b = brandOf(p)
    if (!groups.has(b)) groups.set(b, [])
    groups.get(b)!.push(p)
  }

  let buckets = shuffle(
    Array.from(groups.entries()).map(([brand, items]) => ({ brand, items: shuffle(items) }))
  )

  // Greedy interleave: always emit from the largest remaining bucket that isn't
  // the brand we just placed. This guarantees no adjacent duplicates when the
  // most frequent brand is at most half (rounded up) of the total.
  const result: Product[] = []
  let lastBrand = ''
  while (buckets.some((b) => b.items.length > 0)) {
    buckets = buckets.filter((b) => b.items.length > 0)
    buckets.sort((a, b) => b.items.length - a.items.length)
    let pick = buckets.find((b) => b.brand !== lastBrand) || buckets[0]
    result.push(pick.items.pop()!)
    lastBrand = pick.brand
  }

  // Safety swap pass: fix any remaining adjacent same-brand pairs by swapping the
  // offending item forward to the next slot with a different neighbouring brand.
  for (let i = 1; i < result.length; i++) {
    if (brandOf(result[i]) === brandOf(result[i - 1])) {
      for (let j = i + 1; j < result.length; j++) {
        const prevOk = brandOf(result[j]) !== brandOf(result[i - 1])
        const nextOk = i + 1 >= result.length || brandOf(result[j]) !== brandOf(result[i + 1])
        const jPrevOk = brandOf(result[i]) !== brandOf(result[j - 1])
        if (prevOk && nextOk && jPrevOk) {
          ;[result[i], result[j]] = [result[j], result[i]]
          break
        }
      }
    }
  }

  return result
}

function readCache(slug: string): { business: Business; products: Product[] } | null {
  try {
    const raw = localStorage.getItem(`shop:${slug}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.t > CACHE_TTL) return null
    return { business: parsed.business, products: parsed.products }
  } catch {
    return null
  }
}

function writeCache(slug: string, business: Business, products: Product[]) {
  try {
    localStorage.setItem(`shop:${slug}`, JSON.stringify({ t: Date.now(), business, products }))
  } catch {}
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop'

export default function PublicShopPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug

  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [topIds, setTopIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailQty, setDetailQty] = useState(1)

  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('wave')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadShop() {
      if (!slug || typeof slug !== 'string') {
        setError('Slug boutique invalide')
        setLoading(false)
        return
      }

      // Instant paint from cache, then refresh in the background.
      const cached = readCache(slug)
      if (cached) {
        setBusiness(cached.business)
        setProducts(cached.products)
        setLoading(false)
      }

      try {
        const { data: shop, error: bizError } = await supabase
          .from('businesses')
          .select(
            'id,name,slug,logo_url,banner_url,primary_color,secondary_color,whatsapp_number,phone,whatsapp,address,slogan'
          )
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle()

        if (cancelled) return
        if (bizError) {
          if (!cached) setError(bizError.message)
          return
        }
        if (!shop) {
          if (!cached) setError('Boutique introuvable')
          return
        }

        setBusiness(shop as Business)

        const [{ data: productsData }, { data: top }] = await Promise.all([
          supabase
            .from('products')
            .select('id,name,category,sell_price,stock,image')
            .eq('business_id', shop.id)
            .is('deleted_at', null)
            .not('archived', 'is', true)
            .not('is_active', 'is', false)
            .order('created_at', { ascending: false }),
          supabase.rpc('shop_top_products', { p_business_id: shop.id, p_limit: 14 }),
        ])

        if (cancelled) return
        const prods = (productsData || []) as Product[]
        setProducts(prods)
        setTopIds(((top || []) as { product_id: string }[]).map((r) => r.product_id))
        writeCache(slug, shop as Business, prods)
      } catch (err: any) {
        if (!cancelled && !cached) setError(err?.message || 'Erreur storefront')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadShop()
    return () => {
      cancelled = true
    }
  }, [slug])

  const primary = business?.primary_color || '#16a34a'
  const secondary = business?.secondary_color || '#0f172a'
  const phone = (business?.whatsapp || business?.whatsapp_number || business?.phone || '').replace(/\D/g, '')

  // Build Netflix-style rows. Randomized (brand-aware) once per load via the
  // products dependency, so a refresh reshuffles each row.
  const rows = useMemo<Row[]>(() => {
    if (!products.length) return []

    const byId = new Map(products.map((p) => [p.id, p]))
    const out: Row[] = []

    // 1. Les Plus Vendus — real sales ranking (kept in sales order, not shuffled).
    //    Falls back to a brand-aware random selection when there are no sales yet.
    const top = topIds.map((id) => byId.get(id)).filter(Boolean) as Product[]
    const topSellers = top.length ? top.slice(0, 15) : brandAwareShuffle(products).slice(0, 15)
    if (topSellers.length) {
      out.push({ key: 'top', title: 'Les Plus Vendus', products: topSellers })
    }

    // 2. Produits Populaires — most available (highest stock first, not shuffled).
    const popular = [...products]
      .filter((p) => (p.stock ?? 0) > 0)
      .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
      .slice(0, 15)
    if (popular.length) {
      out.push({ key: 'popular', title: 'Produits Populaires', products: popular })
    }

    // Group all products by normalized category for the category rows.
    const byCat = new Map<string, { title: string; items: Product[] }>()
    for (const p of products) {
      const cat = (p.category || 'Autres').trim() || 'Autres'
      const norm = normalize(cat)
      if (!byCat.has(norm)) byCat.set(norm, { title: cat, items: [] })
      byCat.get(norm)!.items.push(p)
    }

    // 3. Preferred categories, in the requested order. Flexible match folds any
    //    category whose normalized name contains a token into the right row.
    for (const pref of PREFERRED_ROWS) {
      const items: Product[] = []
      for (const norm of Array.from(byCat.keys())) {
        if (pref.match.some((m) => norm.includes(m))) {
          items.push(...byCat.get(norm)!.items)
          byCat.delete(norm)
        }
      }
      if (items.length) {
        out.push({ key: pref.key, title: pref.title, products: brandAwareShuffle(items) })
      }
    }

    // 4. Any remaining custom categories (alphabetical), skipping empties.
    const rest = Array.from(byCat.values())
      .filter((g) => g.items.length)
      .sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    for (const g of rest) {
      out.push({ key: 'cat:' + normalize(g.title), title: g.title, products: brandAwareShuffle(g.items) })
    }

    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, topIds])

  const searchResults = useMemo(() => {
    const q = normalize(search)
    if (!q) return null
    return products.filter(
      (p) => normalize(p.name || '').includes(q) || normalize(p.category || '').includes(q)
    )
  }, [products, search])

  const cartCount = useMemo(() => cart.reduce((n, l) => n + l.qty, 0), [cart])
  const cartTotal = useMemo(() => cart.reduce((n, l) => n + priceOf(l.product) * l.qty, 0), [cart])

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + qty } : l))
      }
      return [...prev, { product, qty }]
    })
  }, [])

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    )
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId))
  }

  function openDetail(product: Product) {
    setSelectedProduct(product)
    setDetailQty(1)
  }

  function whatsappGeneral() {
    const text = `Bonjour ${business?.name}, je veux plus d'informations sur vos produits.`
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  async function placeOrder() {
    if (!business || !cart.length || placing) return
    setPlacing(true)
    try {
      const paymentLabel = PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label || selectedPayment
      const lines = cart
        .map((l) => `- ${l.product.name} x${l.qty}  ${formatCfa(priceOf(l.product) * l.qty)}`)
        .join('\n')
      const text = [
        `Bonjour ${business.name},`,
        ``,
        `Je souhaite commander :`,
        ``,
        lines,
        ``,
        `Total : ${formatCfa(cartTotal)}`,
        `Paiement : ${paymentLabel}`,
        customerName ? `Nom : ${customerName}` : null,
        customerPhone ? `Téléphone : ${customerPhone}` : null,
        ``,
        `Merci de confirmer la disponibilité.`,
      ]
        .filter((l) => l !== null)
        .join('\n')

      // Persist each cart line as an online order (anon insert is allowed).
      const orderRows = cart.map((l) => ({
        business_id: business.id,
        customer_name: customerName || 'Client en ligne',
        customer_phone: customerPhone || null,
        product_id: l.product.id,
        product_name: l.product.name,
        quantity: l.qty,
        total_amount: priceOf(l.product) * l.qty,
        note: `Paiement souhaité : ${paymentLabel}`,
        status: 'pending',
      }))
      await supabase.from('online_orders').insert(orderRows)

      // Notify the merchant (Twilio, non-blocking).
      const merchantPhone = business.whatsapp || business.whatsapp_number || business.phone
      if (merchantPhone) {
        sendOrderNotification(merchantPhone, {
          id: Date.now().toString(),
          customer_name: customerName || 'Client en ligne',
          customer_phone: customerPhone || null,
          product_name: cart.map((l) => `${l.product.name} x${l.qty}`).join(', '),
          quantity: cartCount,
          total: cartTotal,
          business_name: business.name,
        }).catch(() => {})
      }

      const url = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')

      setCart([])
      setCartOpen(false)
    } catch {
      // Even if persistence fails, the WhatsApp message lets the order through.
    } finally {
      setPlacing(false)
    }
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

  if (loading && !business) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="h-64 w-full animate-pulse bg-white/5" />
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-10">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </main>
    )
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <Store size={50} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] pb-28 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {business.banner_url ? (
          <Image src={business.banner_url} fill className="object-cover opacity-55" alt={business.name} priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-[#050505]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-[#050505]" />

        <div className="relative px-4 pb-8 pt-5 md:px-8 md:pb-12 md:pt-8">
          <div className="mb-6 flex items-center justify-end">
            <button onClick={shareShop} className="rounded-full border border-white/10 bg-white/10 p-3 backdrop-blur-xl hover:bg-white/20">
              <Share2 size={18} />
            </button>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white shadow-2xl">
                <Image src={business.logo_url || '/icons/caissepro-icon.svg'} fill className="object-cover" alt={business.name} />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black" style={{ backgroundColor: primary + '33', color: primary }}>
                  <Verified size={13} /> Commerce vérifié
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">{business.name}</h1>
                <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-white/80 md:text-lg">
                  {business.slogan || 'Une expérience shopping premium et moderne'}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit"
                className="w-full rounded-full border border-white/10 bg-black/40 py-4 pl-14 pr-5 text-sm font-bold text-white outline-none backdrop-blur-xl placeholder:text-white/30"
              />
            </div>

            {/* Contact + WhatsApp CTA */}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-white/80">
              <button
                onClick={whatsappGeneral}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-black text-white shadow-xl"
                style={{ backgroundColor: primary }}
              >
                <MessageCircle size={17} /> Commander sur WhatsApp
              </button>
              {business.phone && (
                <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl hover:bg-white/10">
                  <Phone size={15} />{business.phone}
                </a>
              )}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl hover:bg-white/10">
                  <MapPin size={15} />{business.address}
                  <Navigation size={13} className="text-emerald-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-1 py-8 sm:px-4">
        {searchResults ? (
          <div className="px-3 sm:px-0">
            <div className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-white/40">
              <Search size={14} /> {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
            </div>
            {searchResults.length === 0 ? (
              <p className="py-16 text-center text-white/40">Aucun produit ne correspond à « {search} ».</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {searchResults.map((p) => (
                  <ProductCard key={p.id} product={p} primary={primary} onAdd={() => addToCart(p)} onOpen={() => openDetail(p)} />
                ))}
              </div>
            )}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-white/40">Aucun produit disponible pour le moment.</p>
        ) : (
          <div className="space-y-10">
            {rows.map((row) => (
              <CategoryRow
                key={row.key}
                row={row}
                primary={primary}
                onAdd={addToCart}
                onOpen={openDetail}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center" style={{ borderTopColor: secondary + '44', backgroundColor: secondary + '22' }}>
        <p className="text-xs font-bold text-white/30">
          Propulsé par{' '}
          <a href="https://caissepro.app" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/80">CaissePro</a>
          {' · '}
          <a href="/legal" className="hover:text-white/50">Mentions légales</a>
        </p>
      </footer>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full px-5 py-4 text-sm font-black text-white shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
          style={{ backgroundColor: primary }}
        >
          <ShoppingCart size={20} />
          Panier
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black/30 px-1.5 text-xs">{cartCount}</span>
        </button>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center" onClick={() => setSelectedProduct(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2rem] bg-[#0e0e0e] sm:rounded-[2rem]" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-60 w-full overflow-hidden bg-white/5">
              {imageOf(selectedProduct) ? (
                <Image src={imageOf(selectedProduct)!} alt={selectedProduct.name} fill className="object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center"><Package size={56} className="text-white/20" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              <button onClick={() => setSelectedProduct(null)} className="absolute right-4 top-4 rounded-2xl bg-black/50 p-2 text-white/80 backdrop-blur-xl hover:bg-black/70">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">{selectedProduct.category || 'Produit'}</p>
              <h3 className="mt-1 text-2xl font-black text-white">{selectedProduct.name}</h3>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-black" style={{ color: primary }}>{formatCfa(priceOf(selectedProduct))}</p>
                <StockBadge stock={selectedProduct.stock} />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1.5">
                  <button onClick={() => setDetailQty((q) => Math.max(1, q - 1))} className="rounded-full p-2 hover:bg-white/10"><Minus size={16} /></button>
                  <span className="w-6 text-center text-lg font-black">{detailQty}</span>
                  <button onClick={() => setDetailQty((q) => q + 1)} className="rounded-full p-2 hover:bg-white/10"><Plus size={16} /></button>
                </div>
                <button
                  onClick={() => { addToCart(selectedProduct, detailQty); setSelectedProduct(null) }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black text-white shadow-xl"
                  style={{ backgroundColor: primary }}
                >
                  <ShoppingCart size={18} /> Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#0a0a0a]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="flex items-center gap-2 text-xl font-black"><ShoppingCart size={20} /> Mon panier</h3>
              <button onClick={() => setCartOpen(false)} className="rounded-2xl bg-white/10 p-2 hover:bg-white/20"><X size={18} /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <p className="py-16 text-center text-white/40">Votre panier est vide.</p>
              ) : (
                cart.map((line) => (
                  <div key={line.product.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {imageOf(line.product) ? (
                        <Image src={imageOf(line.product)!} alt={line.product.name} fill className="object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package size={22} className="text-white/20" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{line.product.name}</p>
                      <p className="mt-0.5 text-sm font-black" style={{ color: primary }}>{formatCfa(priceOf(line.product))}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => changeQty(line.product.id, -1)} className="rounded-full border border-white/10 p-1.5 hover:bg-white/10"><Minus size={13} /></button>
                        <span className="w-6 text-center text-sm font-black">{line.qty}</span>
                        <button onClick={() => changeQty(line.product.id, 1)} className="rounded-full border border-white/10 p-1.5 hover:bg-white/10"><Plus size={13} /></button>
                        <button onClick={() => removeLine(line.product.id)} className="ml-auto rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-rose-400"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-4 border-t border-white/10 p-5">
                <div className="grid grid-cols-2 gap-2">
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Votre nom" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold outline-none placeholder:text-white/30" />
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Téléphone" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold outline-none placeholder:text-white/30" />
                </div>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-white/40">Mode de paiement</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(({ id, label, color, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setSelectedPayment(id)}
                        className="flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-black transition"
                        style={{
                          backgroundColor: selectedPayment === id ? color + '22' : 'transparent',
                          borderColor: selectedPayment === id ? color : 'rgba(255,255,255,0.1)',
                          color: selectedPayment === id ? 'white' : 'rgba(255,255,255,0.55)',
                        }}
                      >
                        <Icon size={16} /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-lg font-black">
                  <span className="text-white/60">Total</span>
                  <span style={{ color: primary }}>{formatCfa(cartTotal)}</span>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl disabled:opacity-60"
                  style={{ backgroundColor: primary }}
                >
                  <MessageCircle size={20} /> {placing ? 'Envoi...' : 'Commander via WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

function StockBadge({ stock }: { stock: number | null }) {
  const out = (stock ?? 0) <= 0
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black"
      style={{
        backgroundColor: out ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
        color: out ? '#fb7185' : '#34d399',
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: out ? '#fb7185' : '#34d399' }} />
      {out ? 'Rupture' : 'En stock'}
    </span>
  )
}

function ProductCard({
  product,
  primary,
  onAdd,
  onOpen,
}: {
  product: Product
  primary: string
  onAdd: () => void
  onOpen: () => void
}) {
  const img = imageOf(product)
  const out = (product.stock ?? 0) <= 0
  return (
    <div className="group flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e0e] transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <button onClick={onOpen} className="relative aspect-square w-full overflow-hidden bg-white/5 text-left">
        {img ? (
          <Image src={img} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" loading="lazy" sizes="(max-width: 640px) 50vw, 20vw" />
        ) : (
          <div className="flex h-full items-center justify-center"><Package size={40} className="text-white/20" /></div>
        )}
        <div className="absolute left-2 top-2">
          <span
            className="rounded-full px-2 py-1 text-[10px] font-black"
            style={{
              backgroundColor: out ? 'rgba(0,0,0,0.6)' : 'rgba(16,185,129,0.85)',
              color: out ? '#fb7185' : 'white',
            }}
          >
            {out ? 'Rupture' : 'En stock'}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-3">
        <button onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight">{product.name}</h3>
        </button>
        <p className="mt-1 text-base font-black" style={{ color: primary }}>{formatCfa(priceOf(product))}</p>
        <button
          onClick={onAdd}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-black text-white"
          style={{ backgroundColor: primary }}
        >
          <Plus size={15} /> Ajouter
        </button>
      </div>
    </div>
  )
}

function CategoryRow({
  row,
  primary,
  onAdd,
  onOpen,
}: {
  row: Row
  primary: string
  onAdd: (p: Product) => void
  onOpen: (p: Product) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-3 sm:px-0">
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
          <ShoppingBag size={18} style={{ color: primary }} /> {row.title}
        </h2>
        {/* Arrows are a desktop affordance only — on mobile the row is touch-swiped. */}
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scrollBy(-1)} className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/15"><ChevronLeft size={18} /></button>
          <button onClick={() => scrollBy(1)} className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/15"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-3 pb-2 sm:px-0"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {row.products.map((p) => (
          <div key={p.id} className="snap-start flex-shrink-0 w-40 sm:w-48">
            <ProductCard product={p} primary={primary} onAdd={() => onAdd(p)} onOpen={() => onOpen(p)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div>
      <div className="mb-3 h-6 w-40 animate-pulse rounded-full bg-white/10" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-40 shrink-0 sm:w-48">
            <div className="aspect-square w-full animate-pulse rounded-3xl bg-white/5" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
