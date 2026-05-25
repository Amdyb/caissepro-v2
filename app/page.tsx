import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Package,
  QrCode,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'POS rapide',
    desc: 'Encaissez en quelques secondes depuis votre téléphone. Wave, Orange Money, espèces et crédit client.',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: MessageCircle,
    title: 'Reçus WhatsApp',
    desc: 'Envoyez le reçu de chaque vente directement sur WhatsApp. Vos clients gardent la trace.',
    color: 'bg-sky-50 text-sky-700',
  },
  {
    icon: Store,
    title: 'Boutique en ligne',
    desc: 'Votre vitrine publique avec logo, bannière et lien partageable. Commandez via WhatsApp.',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    icon: Package,
    title: 'Gestion du stock',
    desc: 'Stock mis à jour automatiquement après chaque vente. Alertes produits en rupture.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: TrendingUp,
    title: 'Rapports & Finances',
    desc: "Chiffre d'affaires, dépenses, bénéfice net et capital global. Tout en temps réel.",
    color: 'bg-teal-50 text-teal-700',
  },
  {
    icon: QrCode,
    title: 'QR Code boutique',
    desc: 'Générez votre QR code et affichez-le en caisse. Vos clients scannent et commandent.',
    color: 'bg-rose-50 text-rose-700',
  },
]

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    desc: 'Pour démarrer',
    features: ['POS basique', 'Jusqu\'à 50 produits', '1 utilisateur', 'Historique des ventes', 'Reçus WhatsApp'],
    cta: 'Commencer gratuitement',
    href: '/register',
    featured: false,
  },
  {
    name: 'Starter',
    price: '5 000',
    period: '/mois',
    desc: 'Pour les commerces actifs',
    features: ['Produits illimités', 'Boutique en ligne', 'Import CSV produits', '3 employés', 'Rapports avancés', 'Support prioritaire'],
    cta: 'Choisir Starter',
    href: '/register',
    featured: true,
  },
  {
    name: 'Business',
    price: '15 000',
    period: '/mois',
    desc: 'Pour grandir vite',
    features: ['Tout Starter', 'Employés illimités', 'Multi-boutiques', 'Analytics avancées', 'API accès', 'Onboarding dédié'],
    cta: 'Choisir Business',
    href: '/register',
    featured: false,
  },
  {
    name: 'Premium',
    price: '35 000',
    period: '/mois',
    desc: 'Pour les grandes enseignes',
    features: ['Tout Business', 'Support 24/7', 'Intégrations sur mesure', 'SLA garanti', 'Manager de compte dédié', 'Formation équipe'],
    cta: 'Nous contacter',
    href: '/register',
    featured: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'Fatou Diallo',
    business: 'Boutique Mode — Dakar',
    text: 'Depuis CaissePro, je gère ma boutique depuis mon téléphone. Mes clientes reçoivent leur reçu WhatsApp et elles adorent.',
    stars: 5,
  },
  {
    name: 'Moussa Konaté',
    business: 'Épicerie Centrale — Abidjan',
    text: "Je vois mes ventes en temps réel, mon stock se met à jour automatiquement. J'ai économisé des heures chaque semaine.",
    stars: 5,
  },
  {
    name: 'Aminata Traoré',
    business: 'Salon de beauté — Bamako',
    text: 'La boutique en ligne m\'a permis de toucher des clients que je ne connaissais pas. Simple, moderne, africain.',
    stars: 5,
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">C</div>
            <span className="text-xl font-black text-slate-950">CaissePro</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 lg:flex">
            <a href="#features" className="hover:text-emerald-700">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-emerald-700">Tarifs</a>
            <a href="#testimonials" className="hover:text-emerald-700">Témoignages</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/register" className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 to-white px-5 pb-24 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
            <Sparkles size={14} /> Pensé pour les commerces d'Afrique de l'Ouest
          </div>

          <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-7xl">
            La caisse enregistreuse
            <span className="block text-emerald-600">de l'Afrique moderne</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-xl font-semibold leading-relaxed text-slate-500">
            POS mobile, boutique en ligne, reçus WhatsApp et gestion de stock. Tout ce dont votre commerce a besoin — en un seul outil.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-600/25 hover:bg-emerald-700"
            >
              Essayer gratuitement <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-black text-slate-700 hover:bg-slate-50"
            >
              Se connecter
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 text-center">
            {[
              ['500+', 'Commerces actifs'],
              ['50 000+', 'Ventes enregistrées'],
              ['5 pays', "Afrique de l'Ouest"],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl font-black text-emerald-600 md:text-4xl">{val}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mb-14 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">FONCTIONNALITÉS</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Tout pour gérer votre commerce</h2>
          <p className="mt-4 text-lg font-semibold text-slate-500">Simple à utiliser. Puissant pour grandir.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-[2rem] border border-slate-100 bg-slate-50 p-7 transition hover:border-emerald-200 hover:bg-white hover:shadow-lg">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-950 px-5 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">TARIFS</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Simple. Clair. Abordable.</h2>
            <p className="mt-4 text-lg font-semibold text-white/60">Commencez gratuitement. Passez au plan supérieur quand vous êtes prêt.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-[2rem] border p-7 ${
                  plan.featured
                    ? 'border-emerald-500 bg-emerald-600 shadow-2xl shadow-emerald-500/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/50">{plan.desc}</p>
                  <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="mb-1 text-sm font-bold text-white/60">XOF{plan.period}</span>
                  </div>
                </div>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 size={15} className={plan.featured ? 'text-white' : 'text-emerald-400'} />
                      <span className={plan.featured ? 'text-white' : 'text-white/80'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-8 block rounded-2xl py-3.5 text-center font-black transition ${
                    plan.featured
                      ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mb-14 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">TÉMOIGNAGES</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Ils font confiance à CaissePro</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ name, business, text, stars }) => (
            <div key={name} className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8">
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">"{text}"</p>
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="font-black text-slate-950">{name}</p>
                <p className="text-xs font-bold text-slate-400">{business}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-5 pb-24 text-center">
        <div className="rounded-[2.5rem] bg-emerald-600 px-8 py-16 shadow-2xl shadow-emerald-600/20">
          <Zap className="mx-auto text-white/70" size={40} />
          <h2 className="mt-5 text-4xl font-black text-white md:text-5xl">Prêt à moderniser votre commerce ?</h2>
          <p className="mt-4 text-lg font-semibold text-white/70">Créez votre compte gratuit en moins de 2 minutes.</p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-black text-emerald-700 shadow-xl hover:bg-emerald-50"
          >
            Commencer gratuitement <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">C</div>
            <span className="font-black text-slate-950">CaissePro</span>
            <span className="text-xs font-semibold text-slate-400">par Amdy Labs</span>
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <Link href="/legal" className="hover:text-slate-700">Mentions légales</Link>
            <Link href="/help" className="hover:text-slate-700">Aide</Link>
            <Link href="/login" className="hover:text-slate-700">Connexion</Link>
            <Link href="/register" className="hover:text-emerald-700">Inscription</Link>
          </div>
          <p className="text-xs font-semibold text-slate-400">© {new Date().getFullYear()} CaissePro. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  )
}
