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
  { name: 'Gratuit', price: '0 XOF', cta: 'Commencer gratuitement', features: ['1 utilisateur', '10 produits max', 'Caisse basique', 'Publicités affichées'] },
  { name: 'Starter', price: '5 000 XOF/mois', cta: 'Choisir Starter', features: ['Produits illimités', 'Reçus WhatsApp', 'Client Doit', 'Rapports', 'Sans publicité'] },
  { name: 'Business', price: '15 000 XOF/mois', cta: 'Choisir Business', featured: true, features: ['Boutique en ligne', '5 employés', 'Paiements mobiles', 'Tontine 5 groupes', 'Automatisations'] },
  { name: 'Premium', price: '35 000 XOF/mois', cta: 'Choisir Premium', features: ['Multi-succursales', 'Domaine personnalisé', 'Employés illimités', 'Tontine illimitée', 'Support prioritaire'] }
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

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-12 text-center"><p className="font-black text-emerald-700">TARIFS</p><h2 className="mt-2 text-5xl font-black tracking-tight">Commencez gratuit. Grandissez quand vous êtes prêt.</h2></div>
        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => <div key={plan.name} className={`rounded-[2rem] border p-7 shadow-sm ${plan.featured ? 'border-emerald-300 bg-slate-950 text-white' : 'border-slate-200 bg-white'}`}><h3 className="text-3xl font-black">{plan.name}</h3><p className="mt-4 text-4xl font-black text-emerald-500">{plan.price}</p><div className="mt-7 space-y-3">{plan.features.map((f) => <p key={f} className={`font-bold ${plan.featured ? 'text-white/80' : 'text-slate-700'}`}>✓ {f}</p>)}</div><Link href="/login" className={`mt-7 block rounded-2xl px-5 py-4 text-center font-black ${plan.featured ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>{plan.cta}</Link></div>)}
        </div>
      </section>
    </main>
  )
}
