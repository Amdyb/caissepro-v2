import Image from 'next/image'
import { BarChart3, CheckCircle2, Clock3, CreditCard, Layers3, LockKeyhole, Package, ReceiptText, ShieldCheck, Smartphone, Store, Users } from 'lucide-react'
import DemoShop from '@/components/DemoShop'

const features = [
  { icon: ReceiptText, title: 'Caisse rapide', text: 'Vendez en quelques clics avec panier, quantité, remise contrôlée et reçu.' },
  { icon: Package, title: 'Gestion du stock', text: 'Suivez les produits, alertes de stock faible, prix d’achat, prix de vente et prix minimum.' },
  { icon: Users, title: 'Rôles employés', text: 'Admin, manager et vendeur avec accès séparé pour protéger votre boutique.' },
  { icon: BarChart3, title: 'Rapports clairs', text: 'Ventes du jour, semaine, mois, meilleurs produits et performance des vendeurs.' },
  { icon: Store, title: 'Boutique partageable', text: 'Chaque business peut partager une mini-boutique en ligne avec ses clients.' },
  { icon: ShieldCheck, title: 'Multi-tenant sécurisé', text: 'Chaque entreprise voit seulement ses produits, ventes, clients et employés.' }
]

const problems = [
  'Les ventes sont notées dans des cahiers difficiles à contrôler.',
  'Le stock disparaît sans rapport clair.',
  'Les vendeurs n’ont pas toujours un prix minimum à respecter.',
  'Le propriétaire ne voit pas les résultats quand il n’est pas sur place.'
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <div className="flex items-center">
  <Image
    src="/caissepro-logo.png"
    alt="CaissePro Logo"
    width={190}
    height={52}
    priority
    className="h-auto w-[170px] sm:w-[190px]"
  />
</div>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="hover:text-brand-700">Fonctionnalités</a>
            <a href="#demo" className="hover:text-brand-700">Démo</a>
            <a href="#pricing" className="hover:text-brand-700">Tarifs</a>
          </nav>
          <a href="#pricing" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">Commencer</a>
        </div>
      </header>

      <section className="overflow-hidden bg-gradient-to-br from-white via-brand-50 to-slate-100">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
              <Smartphone size={16} /> Gratuit pour commencer • CFA ready
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Gérez votre boutique plus simplement.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">CaissePro aide les commerces en Afrique de l’Ouest à gérer la caisse, le stock, les vendeurs, les rapports et une boutique en ligne partageable — sans logiciel compliqué.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#pricing" className="rounded-2xl bg-brand-600 px-7 py-4 text-center font-black text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700">Essayer gratuitement</a>
              <a href="#demo" className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-center font-black text-slate-900 hover:border-brand-600">Voir la démo</a>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-3">
              <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-600" size={18}/> POS simple</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-600" size={18}/> Stock en temps réel</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-600" size={18}/> Multi-utilisateurs</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Aujourd’hui</p>
                  <p className="text-3xl font-black">185 000 CFA</p>
                </div>
                <div className="rounded-2xl bg-brand-500/20 p-3 text-brand-100"><BarChart3 /></div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-400">Ventes</p><p className="text-2xl font-bold">42</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-400">Stock bas</p><p className="text-2xl font-bold">7</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-400">Clients</p><p className="text-2xl font-bold">18</p></div>
              </div>
              <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950">
                <div className="mb-4 flex items-center justify-between"><strong>Caisse rapide</strong><span className="text-sm font-bold text-brand-600">Ouverte</span></div>
                {['T-shirt Premium', 'Écouteurs Bluetooth', 'Parfum Signature'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between border-t border-slate-100 py-3">
                    <span className="font-semibold">{item}</span><span>{[7500, 15000, 10000][index].toLocaleString('fr-FR')} CFA</span>
                  </div>
                ))}
                <button className="mt-4 w-full rounded-2xl bg-brand-600 py-3 font-black text-white">Encaisser</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="font-bold uppercase tracking-wide text-brand-600">Pourquoi CaissePro?</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">Remplacez le cahier par un système moderne.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {problems.map((problem) => <div key={problem} className="rounded-2xl border border-slate-200 bg-white p-5 font-semibold text-slate-700 shadow-sm">{problem}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="font-bold uppercase tracking-wide text-brand-400">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-black md:text-5xl">Simple pour les vendeurs. Puissant pour les propriétaires.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-brand-400" /><h3 className="mt-5 text-xl font-black">{feature.title}</h3><p className="mt-3 leading-7 text-slate-300">{feature.text}</p></div>
            })}
          </div>
        </div>
      </section>

      <DemoShop />

      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="font-bold uppercase tracking-wide text-brand-600">Tarifs</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">Commencez petit, évoluez quand votre boutique grandit.</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><Clock3 className="text-brand-600"/><h3 className="mt-5 text-2xl font-black">Gratuit</h3><p className="mt-2 text-slate-600">Pour tester CaissePro sans risque.</p><p className="mt-6 text-4xl font-black">0 CFA</p><button className="mt-6 w-full rounded-2xl border border-slate-300 py-4 font-black">Commencer</button></div>
            <div className="rounded-3xl border-2 border-brand-600 bg-white p-8 shadow-xl shadow-brand-600/10"><CreditCard className="text-brand-600"/><h3 className="mt-5 text-2xl font-black">Pro</h3><p className="mt-2 text-slate-600">Pour boutiques avec vendeurs, stock et rapports.</p><p className="mt-6 text-4xl font-black">5 000 CFA<span className="text-base font-bold text-slate-500">/mois</span></p><button className="mt-6 w-full rounded-2xl bg-brand-600 py-4 font-black text-white">Choisir Pro</button></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><Layers3 className="text-brand-600"/><h3 className="mt-5 text-2xl font-black">Business</h3><p className="mt-2 text-slate-600">Pour plusieurs branches ou besoins avancés.</p><p className="mt-6 text-4xl font-black">Sur demande</p><button className="mt-6 w-full rounded-2xl border border-slate-300 py-4 font-black">Nous contacter</button></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <p className="font-black text-slate-950">CaissePro</p>
          <p className="text-sm text-slate-500">Construit par AMDY LABS pour moderniser les commerces d’Afrique de l’Ouest.</p>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><LockKeyhole size={16}/> Données sécurisées par Supabase</div>
        </div>
      </footer>
    </main>
  )
}
