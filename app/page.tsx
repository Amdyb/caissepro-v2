import CaisseProLogo from '@/components/CaisseProLogo'
import Link from 'next/link'
import { ArrowRight, BarChart3, CheckCircle2, CreditCard, MessageCircle, Package, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Star, Store, Users, Wallet, Zap } from 'lucide-react'

const products = [
  { name: 'Robe Wax Élégante', price: '18 000 CFA', tag: 'Fashion', img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop' },
  { name: 'Écouteurs Bluetooth Pro', price: '12 500 CFA', tag: 'Électronique', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=900&auto=format&fit=crop' },
  { name: 'Pack Beauté Karité', price: '9 000 CFA', tag: 'Beauty', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=900&auto=format&fit=crop' }
]

const benefits = [
  ['Caisse POS rapide', 'Vendez, encaissez et imprimez vos reçus sans complication.'],
  ['Boutique en ligne', 'Chaque commerçant peut partager sa boutique avec logo, bannière et produits.'],
  ['Paiements locaux', 'Wave, Orange Money, cash, carte, preuves de paiement et vérification.'],
  ['Client Doit', 'Suivez les dettes, envoyez des rappels WhatsApp et récupérez plus vite.'],
  ['Tontines transparentes', 'Participants, paiements, gagnants et liens publics de confiance.'],
  ['Rapports clairs', 'Ventes, profits, top produits, clients, paiements et stock.']
]

const plans = [
  { name: 'Gratuit', price: '0 XOF', features: ['1 utilisateur', '10 produits max', 'Caisse basique', 'Publicités affichées'] },
  { name: 'Starter', price: '5 000 XOF/mois', features: ['Produits illimités', 'Reçus WhatsApp', 'Client Doit', 'Rapports', 'Sans publicité'] },
  { name: 'Business', price: '15 000 XOF/mois', featured: true, features: ['Boutique en ligne', '5 employés', 'Paiements mobiles', 'Tontine 5 groupes', 'Automatisations'] },
  { name: 'Premium', price: '35 000 XOF/mois', features: ['Multi-succursales', 'Domaine personnalisé', 'Employés illimités', 'Tontine illimitée', 'Support prioritaire'] }
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8f7] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <CaisseProLogo />
          <nav className="hidden items-center gap-7 text-sm font-black text-slate-600 lg:flex">
            <a href="#demo" className="hover:text-emerald-700">Démo boutique</a>
            <a href="#benefits" className="hover:text-emerald-700">Bénéfices</a>
            <a href="#pricing" className="hover:text-emerald-700">Tarifs</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/demo/shop" className="hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 md:block">Voir la démo</Link>
            <Link href="/login" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">Démarrer</Link>
          </div>
        </div>
      </header>

      <section className="relative bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,.25),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1fr_.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-emerald-300 backdrop-blur">
              <Sparkles size={16} /> Nouveau design — CaissePro Beta
            </div>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.95] tracking-tight md:text-8xl">
              La caisse moderne des commerces africains.
            </h1>
            <p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-white/75">
              POS, stock, boutique en ligne, Wave, Orange Money, Client Doit, tontines, loyers, fidélité, rappels WhatsApp et rapports — tout dans une seule plateforme.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/demo/shop" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-emerald-500/25 hover:bg-emerald-600">
                Tester Awa Market <ArrowRight size={20} />
              </Link>
              <Link href="/demo/reports" className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-5 text-lg font-black text-slate-950 hover:bg-slate-100">
                Voir rapports demo
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><p className="text-3xl font-black">0 XOF</p><p className="mt-1 text-xs font-bold text-white/60">pour commencer</p></div>
              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><p className="text-3xl font-black">WhatsApp</p><p className="mt-1 text-xs font-bold text-white/60">reçus & rappels</p></div>
              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><p className="text-3xl font-black">XOF</p><p className="mt-1 text-xs font-bold text-white/60">marché local</p></div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-[2rem] bg-white text-slate-950">
                <div className="relative h-64">
                  <img src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1400&auto=format&fit=crop" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute bottom-5 left-5 text-white">
                    <p className="text-sm font-black text-emerald-300">Boutique demo</p>
                    <h2 className="text-4xl font-black">Awa Market</h2>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 p-4">
                  {products.map((p) => (
                    <div key={p.name} className="overflow-hidden rounded-2xl bg-slate-50">
                      <img src={p.img} className="h-24 w-full object-cover" />
                      <div className="p-3"><p className="truncate text-xs font-black text-emerald-700">{p.tag}</p><p className="mt-1 truncate text-sm font-black">{p.name}</p><p className="mt-1 text-xs font-bold text-slate-500">{p.price}</p></div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-5">
                  <div className="flex items-center justify-between"><span className="font-black">Ventes aujourd’hui</span><span className="text-2xl font-black text-emerald-600">245 000 CFA</span></div>
                  <Link href="/demo/shop" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-sm font-black text-white"><MessageCircle size={18}/>Commander comme client</Link>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-7 hidden rounded-3xl bg-amber-400 p-5 text-slate-950 shadow-2xl md:block"><p className="text-sm font-black">Demo shop</p><p className="text-2xl font-black">Avec produits réels</p></div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="font-black text-emerald-700">EXPÉRIENCE DÉMO</p><h2 className="mt-2 text-5xl font-black tracking-tight">Voyez le produit avant de créer un compte.</h2></div>
          <Link href="/demo/shop" className="rounded-2xl bg-slate-950 px-6 py-4 text-center font-black text-white">Ouvrir la boutique demo</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.name} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
              <img src={p.img} className="h-80 w-full object-cover" />
              <div className="p-6"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{p.tag}</span><h3 className="mt-4 text-2xl font-black">{p.name}</h3><p className="mt-2 text-3xl font-black text-emerald-600">{p.price}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="benefits" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-3xl"><p className="font-black text-emerald-700">POURQUOI CAISSEPRO</p><h2 className="mt-2 text-5xl font-black tracking-tight">Pas juste une caisse. Un système de croissance.</h2></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([title, text]) => <div key={title} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7"><CheckCircle2 className="mb-5 text-emerald-600" size={28}/><h3 className="text-2xl font-black">{title}</h3><p className="mt-3 font-semibold leading-7 text-slate-600">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-12 text-center"><p className="font-black text-emerald-700">TARIFS</p><h2 className="mt-2 text-5xl font-black tracking-tight">Commencez gratuit. Grandissez quand vous êtes prêt.</h2></div>
        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => <div key={plan.name} className={`rounded-[2rem] border p-7 shadow-sm ${plan.featured ? 'border-emerald-300 bg-slate-950 text-white' : 'border-slate-200 bg-white'}`}><h3 className="text-3xl font-black">{plan.name}</h3><p className="mt-4 text-4xl font-black text-emerald-500">{plan.price}</p><div className="mt-7 space-y-3">{plan.features.map((f) => <p key={f} className={`font-bold ${plan.featured ? 'text-white/80' : 'text-slate-700'}`}>✓ {f}</p>)}</div><Link href="/login" className={`mt-7 block rounded-2xl px-5 py-4 text-center font-black ${plan.featured ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>{plan.cta}</Link></div>)}
        </div>
        <div className="mt-10 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-center"><Wallet className="mx-auto text-emerald-700" size={34}/><h3 className="mt-4 text-2xl font-black">Payable par Wave, Orange Money ou carte bancaire.</h3></div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <CaisseProLogo small />
          <div className="text-sm font-semibold text-slate-500 md:text-right"><p>© 2026 Amdy Labs. All rights reserved.</p><p>Pour le développement du commerce en Afrique.</p></div>
        </div>
      </footer>
    </main>
  )
}
