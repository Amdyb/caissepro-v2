import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  CreditCard,
  Package,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Users,
  Wallet,
  Zap
} from 'lucide-react'

const benefits = [
  { title: 'Vendez plus vite', text: 'Une caisse simple pour employés, vendeurs et gérants.', icon: ShoppingCart },
  { title: 'Contrôlez le stock', text: 'Photos, catégories, alertes stock bas et réassort.', icon: Package },
  { title: 'Encaissez localement', text: 'Wave, Orange Money, cash, carte et preuves de paiement.', icon: CreditCard },
  { title: 'Relancez automatiquement', text: 'Client Doit, loyers, tontines et rappels WhatsApp.', icon: BellRing },
  { title: 'Créez votre boutique en ligne', text: 'Lien partageable avec logo, bannière et commande WhatsApp.', icon: Store },
  { title: 'Comprenez vos profits', text: 'Rapports, ventes, top produits, paiements et dettes.', icon: BarChart3 }
]

const localFeatures = ['Client Doit', 'Tontines transparentes', 'Gestion loyers', 'Boutique WhatsApp', 'Wave / Orange Money', 'Preuve de paiement', 'Fidélité clients', 'Parrainage business']

const plans = [
  { name: 'Gratuit', price: '0', period: 'XOF', who: 'Tester', features: ['1 utilisateur', '10 produits max', 'Caisse basique', 'Publicités affichées'], cta: 'Commencer gratuit' },
  { name: 'Starter', price: '5 000', period: 'XOF/mois', who: 'Petites boutiques', features: ['Produits illimités', 'Reçus WhatsApp', 'Client Doit', 'Rapports', 'Sans publicité'], cta: 'Choisir Starter' },
  { name: 'Business', price: '15 000', period: 'XOF/mois', who: 'Boutiques en croissance', featured: true, features: ['Tout Starter +', 'Boutique en ligne', '5 employés', 'Paiements mobiles', 'Tontine 5 groupes / 100 membres'], cta: 'Choisir Business' },
  { name: 'Premium', price: '35 000', period: 'XOF/mois', who: 'Multi-succursales', features: ['Tout Business +', 'Multi-succursales', 'Domaine personnalisé', 'Employés illimités', 'Tontine illimitée + export PDF'], cta: 'Choisir Premium' }
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><ShoppingCart size={24} /></div>
            <div><p className="text-xl font-black">CaissePro</p><p className="text-xs font-bold text-slate-500">Commerce OS pour l’Afrique</p></div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-black text-slate-600 lg:flex"><a href="#benefits" className="hover:text-emerald-700">Bénéfices</a><a href="#demo" className="hover:text-emerald-700">Démo</a><a href="#local" className="hover:text-emerald-700">Local</a><a href="#pricing" className="hover:text-emerald-700">Tarifs</a></nav>
          <div className="flex items-center gap-3"><Link href="/demo/shop" className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 md:block">Voir démo</Link><Link href="/login" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">Démarrer</Link></div>
        </div>
      </header>

      <section className="relative"><div className="absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl" /><div className="absolute right-0 top-52 h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm"><Zap size={16} />Le système complet pour commerces africains</div><h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">Transformez votre boutique en business moderne.</h1><p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">CaissePro réunit caisse POS, stock, clients, paiements, dettes, tontines, loyers, boutique en ligne, rappels WhatsApp et rapports dans une seule application simple.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700">Commencer gratuitement <ArrowRight size={18} /></Link><Link href="/demo/shop" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-7 py-4 font-black text-slate-700 shadow-sm hover:bg-slate-50">Tester la boutique démo</Link></div><div className="mt-8 grid max-w-2xl grid-cols-3 gap-4"><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-2xl font-black">0 XOF</p><p className="mt-1 text-xs font-bold text-slate-500">pour commencer</p></div><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-2xl font-black">WhatsApp</p><p className="mt-1 text-xs font-bold text-slate-500">rappels & reçus</p></div><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-2xl font-black">XOF</p><p className="mt-1 text-xs font-bold text-slate-500">pensé local</p></div></div></div>
          <div className="relative"><div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl"><div className="rounded-[1.5rem] bg-slate-950 p-5 text-white"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-bold text-emerald-300">Ventes aujourd’hui</p><p className="text-4xl font-black">245 000 XOF</p></div><div className="rounded-2xl bg-white/10 p-3"><BarChart3 /></div></div><div className="grid gap-3 md:grid-cols-2"><div className="rounded-3xl bg-white/10 p-4"><Package className="text-emerald-300" /><p className="mt-4 text-sm font-bold text-white/70">Stock actif</p><p className="text-2xl font-black">128 produits</p></div><div className="rounded-3xl bg-white/10 p-4"><Users className="text-emerald-300" /><p className="mt-4 text-sm font-bold text-white/70">Clients</p><p className="text-2xl font-black">342 profils</p></div></div><div className="mt-4 rounded-3xl bg-white p-4 text-slate-950"><div className="mb-3 flex items-center justify-between"><p className="font-black">Dernière vente</p><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">Wave</span></div><div className="space-y-3"><div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span className="font-bold">Produit premium</span><span className="font-black">15 000 XOF</span></div><div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span className="font-bold">Preuve reçue</span><span className="font-black text-emerald-700">Vérifiée</span></div></div><div className="mt-4 flex justify-between border-t border-dashed border-slate-300 pt-4"><span className="font-black">Profit estimé</span><span className="text-2xl font-black text-emerald-700">8 200 XOF</span></div></div></div></div><div className="absolute -bottom-8 -left-8 hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:block"><p className="text-sm font-bold text-slate-500">Démo disponible</p><p className="mt-1 text-2xl font-black text-emerald-600">Awa Market</p></div></div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-7xl px-5 py-16"><div className="mb-10 max-w-3xl"><h2 className="text-4xl font-black tracking-tight md:text-5xl">Pourquoi les commerçants choisissent CaissePro ?</h2><p className="mt-4 text-lg font-semibold text-slate-600">Parce que l’app règle les vrais problèmes quotidiens: vendre, suivre, relancer, encaisser et comprendre.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{benefits.map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="mb-6 inline-flex rounded-2xl bg-emerald-50 p-4 text-emerald-700"><Icon size={28}/></div><h3 className="text-2xl font-black">{item.title}</h3><p className="mt-3 font-semibold leading-7 text-slate-600">{item.text}</p></div> })}</div></section>

      <section id="demo" className="bg-slate-950 py-16 text-white"><div className="mx-auto max-w-7xl px-5"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><div className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-emerald-300">Démo interactive</div><h2 className="text-4xl font-black tracking-tight md:text-5xl">Montrez au client ce qu’il peut devenir.</h2><p className="mt-5 text-lg font-semibold leading-8 text-white/70">La démo Awa Market permet de tester une boutique publique, un panier, une commande WhatsApp et des rapports de vente générés.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><Link href="/demo/shop" className="rounded-2xl bg-emerald-600 px-7 py-4 text-center font-black text-white hover:bg-emerald-700">Ouvrir demo shop</Link><Link href="/demo/reports" className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 hover:bg-slate-100">Voir rapports demo</Link></div></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-[2rem] bg-white p-6 text-slate-950"><ShoppingBag className="text-emerald-600" size={34}/><h3 className="mt-5 text-2xl font-black">Boutique publique</h3><p className="mt-2 font-semibold text-slate-600">Logo, bannière, produits, catégories et commande WhatsApp.</p></div><div className="rounded-[2rem] bg-white p-6 text-slate-950"><BarChart3 className="text-emerald-600" size={34}/><h3 className="mt-5 text-2xl font-black">Rapports clairs</h3><p className="mt-2 font-semibold text-slate-600">Ventes, profits, paiements, dettes et top produits.</p></div></div></div></div></section>

      <section id="local" className="mx-auto max-w-7xl px-5 py-16"><div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><h2 className="text-4xl font-black tracking-tight">Pensé pour l’Afrique, pas juste traduit.</h2><p className="mt-4 text-lg font-semibold leading-8 text-slate-600">CaissePro inclut les réalités locales: mobile money, dettes clients, tontines, loyers, WhatsApp, reçus et preuves de paiement.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{localFeatures.map((feature) => <div key={feature} className="rounded-3xl bg-slate-50 p-4 font-black text-slate-800"><CheckCircle2 className="mb-3 text-emerald-600" size={20}/>{feature}</div>)}</div></div></div></section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20"><div className="mb-12 text-center"><h2 className="text-4xl font-black tracking-tight md:text-5xl">Plans simples, valeur claire.</h2><p className="mt-4 text-lg font-semibold text-slate-600">Commencez gratuitement, puis upgradez quand votre commerce grandit.</p></div><div className="grid gap-6 lg:grid-cols-4">{plans.map((plan) => <div key={plan.name} className={`rounded-[2rem] border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl ${plan.featured ? 'border-emerald-300 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-950'}`}><div className="mb-4 flex items-center justify-between"><h3 className="text-3xl font-black">{plan.name}</h3>{plan.featured && <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">Populaire</span>}</div><p className={`text-sm font-black ${plan.featured ? 'text-emerald-300' : 'text-emerald-700'}`}>{plan.who}</p><div className="mt-6"><span className="text-5xl font-black">{plan.price}</span><span className={`ml-2 font-bold ${plan.featured ? 'text-white/60' : 'text-slate-500'}`}>{plan.period}</span></div><Link href="/login" className={`mt-7 block rounded-2xl px-5 py-4 text-center font-black ${plan.featured ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>{plan.cta}</Link><div className="mt-7 space-y-3">{plan.features.map((feature) => <div key={feature} className="flex items-start gap-3"><CheckCircle2 className={plan.featured ? 'text-emerald-300' : 'text-emerald-600'} size={19}/><p className={`font-bold ${plan.featured ? 'text-white/85' : 'text-slate-700'}`}>{feature}</p></div>)}</div></div>)}</div><div className="mt-10 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-center"><Wallet className="mx-auto text-emerald-700" size={34}/><h3 className="mt-4 text-2xl font-black">Payable par Wave, Orange Money ou carte bancaire.</h3></div></section>

      <section className="mx-auto max-w-7xl px-5 pb-20"><div className="rounded-[2rem] bg-emerald-600 p-10 text-center text-white shadow-2xl shadow-emerald-600/20 md:p-16"><Smartphone className="mx-auto mb-6" size={46}/><h2 className="text-4xl font-black tracking-tight md:text-5xl">Votre boutique peut commencer aujourd’hui.</h2><p className="mx-auto mt-4 max-w-2xl text-lg font-semibold text-white/85">Ajoutez vos produits, encaissez, envoyez les reçus, relancez les paiements et suivez vos profits.</p><div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row"><Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-emerald-700 hover:bg-slate-50">Créer mon compte <ArrowRight size={18}/></Link><Link href="/demo/reports" className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-7 py-4 font-black text-white hover:bg-emerald-800">Voir les rapports</Link></div></div></section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white"><ShoppingCart size={20}/></div><div><p className="font-black">CaissePro</p><p className="text-xs font-bold text-slate-500">by Amdy Labs</p></div></div>
          <div className="text-sm font-semibold text-slate-500 md:text-right"><p>© 2026 Amdy Labs. All rights reserved.</p><p>Pour le développement du commerce en Afrique.</p></div>
        </div>
      </footer>
    </main>
  )
}
