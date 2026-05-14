'use client'

import Link from 'next/link'
import { ArrowLeft, BarChart3, CreditCard, Package, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react'

const sales = [
  { day: 'Lun', amount: 95000 },
  { day: 'Mar', amount: 142000 },
  { day: 'Mer', amount: 118000 },
  { day: 'Jeu', amount: 176000 },
  { day: 'Ven', amount: 245000 },
  { day: 'Sam', amount: 318000 },
  { day: 'Dim', amount: 205000 }
]

const topProducts = [
  { name: 'Robe Wax Élégante', sold: 24, amount: 432000 },
  { name: 'Smart Watch Dakar', sold: 11, amount: 330000 },
  { name: 'Pack Beauté Karité', sold: 31, amount: 279000 },
  { name: 'Écouteurs Bluetooth Pro', sold: 18, amount: 225000 }
]

const payments = [
  { name: 'Wave', amount: 540000, percent: 41 },
  { name: 'Orange Money', amount: 360000, percent: 27 },
  { name: 'Cash', amount: 255000, percent: 19 },
  { name: 'Carte', amount: 170000, percent: 13 }
]

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function DemoReportsPage() {
  const maxSale = Math.max(...sales.map((s) => s.amount))
  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0)
  const profit = Math.round(totalSales * 0.34)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-emerald-700"><ArrowLeft size={18}/>Accueil</Link>
          <div className="flex gap-3">
            <Link href="/demo/shop" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200">Demo shop</Link>
            <Link href="/login" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">Essayer</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-300">Rapports demo CaissePro</div>
              <h1 className="text-5xl font-black tracking-tight md:text-7xl">Awa Market Analytics</h1>
              <p className="mt-4 max-w-2xl text-lg font-semibold text-white/70">Une vision claire des ventes, profits, paiements, clients, dettes et produits performants.</p>
            </div>
            <BarChart3 className="text-emerald-300" size={70}/>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><ShoppingCart className="text-emerald-600"/><p className="mt-5 text-sm font-bold text-slate-500">Ventes semaine</p><p className="mt-2 text-3xl font-black">{cfa(totalSales)}</p><p className="mt-2 text-sm font-bold text-emerald-700">+28% vs semaine dernière</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><TrendingUp className="text-emerald-600"/><p className="mt-5 text-sm font-bold text-slate-500">Profit estimé</p><p className="mt-2 text-3xl font-black">{cfa(profit)}</p><p className="mt-2 text-sm font-bold text-emerald-700">Marge 34%</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-sky-600"/><p className="mt-5 text-sm font-bold text-slate-500">Nouveaux clients</p><p className="mt-2 text-3xl font-black">87</p><p className="mt-2 text-sm font-bold text-sky-700">23 VIP actifs</p></div>
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm"><Wallet className="text-red-600"/><p className="mt-5 text-sm font-bold text-slate-500">Client Doit</p><p className="mt-2 text-3xl font-black text-red-600">{cfa(186000)}</p><p className="mt-2 text-sm font-bold text-red-700">12 rappels actifs</p></div>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-black">Ventes par jour</h2><p className="text-sm font-semibold text-slate-500">Performance hebdomadaire générée</p></div><BarChart3 className="text-emerald-600"/></div>
            <div className="flex h-80 items-end gap-4 rounded-3xl bg-slate-50 p-5">
              {sales.map((item) => (
                <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex w-full items-end justify-center rounded-t-2xl bg-emerald-600 transition hover:bg-emerald-700" style={{ height: `${Math.max(18, (item.amount / maxSale) * 230)}px` }} />
                  <p className="text-sm font-black text-slate-600">{item.day}</p>
                  <p className="text-xs font-bold text-slate-400">{Math.round(item.amount / 1000)}k</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-black">Paiements</h2><p className="text-sm font-semibold text-slate-500">Répartition demo</p></div><CreditCard className="text-emerald-600"/></div>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.name}>
                  <div className="mb-2 flex justify-between text-sm font-black"><span>{payment.name}</span><span>{cfa(payment.amount)}</span></div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${payment.percent}%` }} /></div>
                  <p className="mt-1 text-xs font-bold text-slate-400">{payment.percent}% des ventes</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-black">Top produits</h2><p className="text-sm font-semibold text-slate-500">Les produits qui vendent le plus</p></div><Package className="text-emerald-600"/></div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 font-black text-white">{index + 1}</div><div><p className="font-black text-slate-950">{product.name}</p><p className="text-sm font-semibold text-slate-500">{product.sold} ventes</p></div></div>
                  <p className="font-black text-emerald-700">{cfa(product.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Ce que le commerçant comprend rapidement</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-emerald-50 p-5"><p className="font-black text-emerald-700">✅ Quels produits rapportent le plus</p><p className="mt-1 text-sm font-semibold text-slate-600">Aider à mieux acheter et mieux gérer le stock.</p></div>
              <div className="rounded-3xl bg-sky-50 p-5"><p className="font-black text-sky-700">✅ Quels paiements dominent</p><p className="mt-1 text-sm font-semibold text-slate-600">Wave, Orange Money, cash ou carte.</p></div>
              <div className="rounded-3xl bg-amber-50 p-5"><p className="font-black text-amber-700">✅ Qui doit encore payer</p><p className="mt-1 text-sm font-semibold text-slate-600">Rappels WhatsApp et liens de paiement intégrés.</p></div>
              <div className="rounded-3xl bg-slate-100 p-5"><p className="font-black text-slate-800">✅ Quand faire un réassort</p><p className="mt-1 text-sm font-semibold text-slate-600">Alertes stock bas et suivi achats fournisseurs.</p></div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] bg-emerald-600 p-8 text-center text-white shadow-xl shadow-emerald-600/20">
          <h2 className="text-4xl font-black">Imaginez ces rapports pour votre vraie boutique.</h2>
          <p className="mx-auto mt-3 max-w-2xl font-semibold text-white/80">CaissePro transforme vos ventes quotidiennes en décisions claires.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/login" className="rounded-2xl bg-white px-6 py-4 font-black text-emerald-700">Commencer gratuitement</Link><Link href="/demo/shop" className="rounded-2xl bg-emerald-700 px-6 py-4 font-black text-white">Voir demo shop</Link></div>
        </div>
      </section>
    </main>
  )
}
