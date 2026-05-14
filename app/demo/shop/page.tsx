'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle, Minus, Plus, ShoppingCart, Sparkles, Star } from 'lucide-react'
import { useMemo, useState } from 'react'

const products = [
  { id: '1', name: 'Robe Wax Élégante', category: 'Fashion', price: 18000, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop', accent: 'Mode premium' },
  { id: '2', name: 'Écouteurs Bluetooth Pro', category: 'Électronique', price: 12500, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop', accent: 'Son HD' },
  { id: '3', name: 'Pack Beauté Karité', category: 'Beauty', price: 9000, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop', accent: 'Beauté naturelle' },
  { id: '4', name: 'Menu Poulet Yassa', category: 'Restauration', price: 3500, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop', accent: 'Plat signature' },
  { id: '5', name: 'Sac Cuir Premium', category: 'Fashion', price: 22000, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200&auto=format&fit=crop', accent: 'Luxury' },
  { id: '6', name: 'Smart Watch Dakar', category: 'Électronique', price: 30000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop', accent: 'Tech moderne' }
]

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function DemoShopPage() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [category, setCategory] = useState('Tous')
  const categories = ['Tous', ...Array.from(new Set(products.map((p) => p.category)))]
  const filtered = category === 'Tous' ? products : products.filter((p) => p.category === category)
  const cartItems = useMemo(() => products.map((product) => ({ ...product, qty: cart[product.id] || 0 })).filter((item) => item.qty > 0), [cart])
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const whatsappText = encodeURIComponent(`Bonjour, je veux commander sur Awa Market. Total: ${cfa(total)}.`)

  function add(id: string) { setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 })) }
  function remove(id: string) { setCart((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) })) }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-emerald-700"><ArrowLeft size={18}/>Accueil</Link>
          <div className="flex items-center gap-3">
            <img src="/demo/awa-market-logo.svg" className="h-12 w-12 rounded-2xl shadow-sm" alt="Awa Market" />
            <div><p className="font-black">Awa Market</p><p className="text-xs font-bold text-slate-500">Demo shop premium</p></div>
          </div>
          <Link href="/demo/reports" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Voir rapports</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1800&auto=format&fit=crop" className="absolute inset-0 h-full w-full object-cover opacity-55" alt="Premium store" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-emerald-950/35" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 text-white">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur"><Sparkles size={16}/>Boutique demo sophistiquée</div>
            <img src="/demo/awa-market-logo.svg" className="mb-6 h-28 w-28 rounded-[2rem] shadow-2xl" alt="Awa Market logo" />
            <h1 className="text-6xl font-black tracking-tight md:text-8xl">Awa Market</h1>
            <p className="mt-5 max-w-2xl text-xl font-semibold leading-9 text-white/85">Une boutique moderne propulsée par CaissePro: produits, panier, commande WhatsApp et rapports intelligents.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur"><p className="text-xs font-black text-emerald-300">Ventes demo</p><p className="text-3xl font-black">2.1M CFA</p></div>
              <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur"><p className="text-xs font-black text-emerald-300">Clients</p><p className="text-3xl font-black">340+</p></div>
              <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur"><p className="text-xs font-black text-emerald-300">Note</p><p className="flex items-center gap-1 text-3xl font-black"><Star className="fill-amber-400 text-amber-400"/>4.9</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_370px]">
        <div>
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black ${category === cat ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{cat}</button>)}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="relative h-72 overflow-hidden">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900">{product.accent}</span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{product.category}</p>
                  <h3 className="mt-2 min-h-14 text-xl font-black leading-tight">{product.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-2xl font-black text-slate-950">{cfa(product.price)}</p>
                    <div className="flex items-center gap-2"><button onClick={() => remove(product.id)} className="rounded-xl bg-slate-100 p-2"><Minus size={16}/></button><span className="w-6 text-center font-black">{cart[product.id] || 0}</span><button onClick={() => add(product.id)} className="rounded-xl bg-emerald-600 p-2 text-white"><Plus size={16}/></button></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center gap-3"><img src="/demo/awa-market-logo.svg" className="h-12 w-12 rounded-2xl" alt="Awa"/><div><h2 className="text-2xl font-black">Panier</h2><p className="text-xs font-bold text-slate-500">Commande WhatsApp</p></div></div>
          {cartItems.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Ajoutez des produits pour tester la commande.</p> : <div className="space-y-3">{cartItems.map((item) => <div key={item.id} className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm font-bold"><span>{item.name} × {item.qty}</span><span>{cfa(item.price * item.qty)}</span></div>)}</div>}
          <div className="mt-5 flex justify-between border-t border-dashed border-slate-300 pt-5"><span className="font-black">Total</span><span className="text-2xl font-black text-emerald-700">{cfa(total)}</span></div>
          <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" className={`mt-5 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white ${total > 0 ? 'bg-green-600' : 'pointer-events-none bg-slate-300'}`}><MessageCircle size={18}/>Commander WhatsApp</a>
          <Link href="/login" className="mt-3 flex items-center justify-center rounded-2xl bg-slate-950 py-4 text-sm font-black text-white">Créer ma boutique</Link>
        </aside>
      </section>
    </main>
  )
}
