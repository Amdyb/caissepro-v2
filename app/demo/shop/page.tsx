'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle, Minus, Plus, ShoppingBag, ShoppingCart, Store } from 'lucide-react'
import { useMemo, useState } from 'react'

const products = [
  { id: '1', name: 'Robe Wax Élégante', category: 'Fashion', price: 18000, image: 'bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-300' },
  { id: '2', name: 'Écouteurs Bluetooth Pro', category: 'Électronique', price: 12500, image: 'bg-gradient-to-br from-sky-500 via-indigo-500 to-slate-900' },
  { id: '3', name: 'Pack Beauté Karité', category: 'Beauty', price: 9000, image: 'bg-gradient-to-br from-emerald-500 via-lime-300 to-amber-200' },
  { id: '4', name: 'Menu Poulet Yassa', category: 'Restauration', price: 3500, image: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600' },
  { id: '5', name: 'Sac Cuir Premium', category: 'Fashion', price: 22000, image: 'bg-gradient-to-br from-stone-900 via-amber-800 to-yellow-500' },
  { id: '6', name: 'Smart Watch Dakar', category: 'Électronique', price: 30000, image: 'bg-gradient-to-br from-slate-950 via-emerald-700 to-cyan-300' }
]

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function DemoShopPage() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [category, setCategory] = useState('Tous')

  const categories = ['Tous', ...Array.from(new Set(products.map((p) => p.category)))]
  const filtered = category === 'Tous' ? products : products.filter((p) => p.category === category)

  const cartItems = useMemo(() => {
    return products
      .map((product) => ({ ...product, qty: cart[product.id] || 0 }))
      .filter((item) => item.qty > 0)
  }, [cart])

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  function add(id: string) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  function remove(id: string) {
    setCart((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }))
  }

  const whatsappText = encodeURIComponent(`Bonjour, je veux commander sur la boutique demo CaissePro. Total: ${cfa(total)}.`)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-emerald-700"><ArrowLeft size={18}/>Accueil</Link>
          <Link href="/demo/reports" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Voir rapports demo</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-slate-950 to-amber-500 opacity-90" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur">Démo boutique publique</div>
              <h1 className="text-5xl font-black tracking-tight md:text-7xl">Awa Market</h1>
              <p className="mt-4 max-w-2xl text-lg font-semibold text-white/80">Une boutique demo CaissePro avec produits, panier, commande WhatsApp et reporting.</p>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-2xl"><Store size={44}/></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black ${category === cat ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{cat}</button>)}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className={`flex h-52 items-center justify-center rounded-2xl ${product.image}`}><ShoppingBag className="text-white drop-shadow" size={60}/></div>
                <p className="mt-5 text-xs font-black uppercase tracking-wide text-emerald-700">{product.category}</p>
                <h3 className="mt-2 min-h-14 text-xl font-black leading-tight">{product.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-black text-slate-950">{cfa(product.price)}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => remove(product.id)} className="rounded-xl bg-slate-100 p-2"><Minus size={16}/></button>
                    <span className="w-6 text-center font-black">{cart[product.id] || 0}</span>
                    <button onClick={() => add(product.id)} className="rounded-xl bg-emerald-600 p-2 text-white"><Plus size={16}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><ShoppingCart/></div><h2 className="text-2xl font-black">Panier demo</h2></div>
          {cartItems.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Ajoutez des produits pour tester la commande.</p> : <div className="space-y-3">{cartItems.map((item) => <div key={item.id} className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm font-bold"><span>{item.name} × {item.qty}</span><span>{cfa(item.price * item.qty)}</span></div>)}</div>}
          <div className="mt-5 flex justify-between border-t border-dashed border-slate-300 pt-5"><span className="font-black">Total</span><span className="text-2xl font-black text-emerald-700">{cfa(total)}</span></div>
          <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" className={`mt-5 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white ${total > 0 ? 'bg-green-600' : 'pointer-events-none bg-slate-300'}`}><MessageCircle size={18}/>Commander WhatsApp</a>
          <Link href="/login" className="mt-3 flex items-center justify-center rounded-2xl bg-slate-950 py-4 text-sm font-black text-white">Créer ma boutique</Link>
        </aside>
      </section>
    </main>
  )
}
