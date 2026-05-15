import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import CaisseProLogo from '@/components/CaisseProLogo'
import Link from 'next/link'
import { CheckCircle2, Lock, Sparkles, Store, Zap } from 'lucide-react'

const benefits = [
  ['Caisse POS rapide', 'Vendez, encaissez et gérez votre stock facilement.'],
  ['Boutique en ligne PRO', 'Partagez votre boutique avec logo, bannière et lien public.'],
  ['Paiements locaux', 'Wave, Orange Money, cash et WhatsApp.'],
  ['Client Doit', 'Gestion des dettes clients avec suivi simple.'],
  ['Rapports intelligents', 'Visualisez vos ventes et produits les plus rentables.'],
  ['Gestion moderne', 'Pensé pour les commerces africains modernes.']
]

const plans = [
  {
    name: 'GRATUIT',
    price: '0 CFA',
    cta: 'Commencer Gratuitement',
    features: [
      'POS basique',
      'Produits & stock',
      '1 employé',
      'Rapports simples',
      'Boutique en ligne 🔒 PRO',
      'Import Excel 🔒 PRO'
    ]
  },
  {
    name: 'PRO',
    price: '5 000 CFA/mois',
    featured: true,
    cta: 'Passer à PRO',
    features: [
      'Boutique en ligne',
      'Lien partageable',
      'Logo & bannière',
      'Bulk import Excel',
      'Plusieurs employés',
      'Client Doit',
      'Support prioritaire'
    ]
  },
  {
    name: 'BUSINESS',
    price: '15 000 CFA/mois',
    cta: 'Choisir BUSINESS',
    features: [
      'Tout PRO',
      'Multi-boutiques',
      'Permissions avancées',
      'Analytics avancées',
      'Support premium',
      'Fonctions futures exclusives'
    ]
  }
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8f7] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <CaisseProLogo />

          <nav className="hidden items-center gap-7 text-sm font-black text-slate-600 lg:flex">
            <a href="#benefits" className="hover:text-emerald-700">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-emerald-700">Tarifs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">Connexion</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-black text-emerald-700">
              <Sparkles size={16} /> Pensé pour les commerces africains
            </div>

            <h1 className="mt-7 text-6xl font-black leading-[1.05] tracking-tight">
              Votre boutique.
              <span className="block text-emerald-600">Votre caisse moderne.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-xl font-semibold leading-relaxed text-slate-600">
              CaissePro aide les commerces à vendre, gérer leur stock et créer une vraie présence en ligne.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/register" className="rounded-2xl bg-emerald-600 px-7 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-200">
                Commencer Gratuitement
              </Link>

              <Link href="/upgrade" className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-black text-slate-900">
                Voir les plans PRO
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Zap />
                  <p className="font-black">POS ultra rapide</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">Encaissement moderne pensé pour téléphone et tablette.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Store />
                  <p className="font-black">Boutique en ligne</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">Disponible avec PRO et BUSINESS.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-7 shadow-2xl">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/70">CaissePro PRO</p>
                  <h3 className="mt-1 text-3xl font-black">Boutique en ligne</h3>
                </div>
                <div className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black">PRO</div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black">Lien partageable</p>
                      <p className="text-sm text-white/70">Partagez votre boutique partout</p>
                    </div>
                    <CheckCircle2 className="text-emerald-400" />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black">Import Excel</p>
                      <p className="text-sm text-white/70">Ajout rapide des produits</p>
                    </div>
                    <Lock className="text-orange-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-12 text-center">
          <p className="font-black text-emerald-700">FONCTIONNALITÉS</p>
          <h2 className="mt-2 text-5xl font-black tracking-tight">Tout pour gérer votre commerce</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map(([title, description]) => (
            <div key={title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 />
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-950">{title}</h3>
              <p className="mt-4 text-base font-semibold leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-12 text-center">
          <p className="font-black text-emerald-700">TARIFS</p>
          <h2 className="mt-2 text-5xl font-black tracking-tight">Simple. Clair. Abordable.</h2>
          <p className="mt-4 text-lg font-semibold text-slate-600">Commencez gratuitement. Passez PRO quand vous êtes prêt à vendre en ligne.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-[2rem] border p-7 shadow-sm ${plan.featured ? 'border-emerald-300 bg-slate-950 text-white shadow-2xl' : 'border-slate-200 bg-white'}`}>
              <h3 className="text-3xl font-black">{plan.name}</h3>
              <p className="mt-4 text-5xl font-black text-emerald-500">{plan.price}</p>

              <div className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    {feature.includes('🔒') ? <Lock size={16} className="text-orange-400" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                    <p className={`font-bold ${plan.featured ? 'text-white/90' : 'text-slate-700'}`}>{feature}</p>
                  </div>
                ))}
              </div>

              <Link href={plan.name === 'GRATUIT' ? '/register' : '/upgrade'} className={`mt-8 block rounded-2xl px-5 py-4 text-center font-black ${plan.featured ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl justify-center px-5 py-8">
          <AmdyLabsBrand />
        </div>
      </footer>
    </main>
  )
}
