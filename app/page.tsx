import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  MessageCircle,
  Moon,
  Play,
  QrCode,
  Sparkles,
  Star,
  Store,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Reçus WhatsApp auto',
    desc: 'Envoyez automatiquement le reçu de chaque vente sur WhatsApp. Vos clients gardent la trace sans effort.',
    color: 'bg-sky-50 text-sky-700',
  },
  {
    icon: WifiOff,
    title: 'Mode hors ligne',
    desc: 'CaissePro fonctionne sans connexion internet. Vos ventes sont synchronisées dès que le réseau revient.',
    color: 'bg-slate-100 text-slate-700',
  },
  {
    icon: LayoutGrid,
    title: '10+ types de commerces',
    desc: 'Boutique, restaurant, salon, pharmacie, garage, BTP, tontine, location... CaissePro s\'adapte à votre activité.',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    icon: Users,
    title: 'Programme de parrainage',
    desc: 'Parrainez d\'autres commerçants et gagnez des récompenses. Votre réseau grandit, votre business aussi.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Moon,
    title: 'Mode sombre',
    desc: 'Interface adaptée pour travailler confortablement à toute heure, de jour comme de nuit.',
    color: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: QrCode,
    title: 'QR Code boutique',
    desc: 'Générez votre QR code et affichez-le en caisse. Vos clients scannent et commandent instantanément.',
    color: 'bg-rose-50 text-rose-700',
  },
]

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    desc: 'Pour démarrer',
    features: ['POS de base', '50 ventes/mois', 'Reçus WhatsApp (wa.me)', '1 employé', 'Boutique en ligne basique'],
    cta: 'Commencer gratuitement',
    href: '/register',
    featured: false,
  },
  {
    name: 'Starter',
    price: '5 000',
    period: '/mois',
    desc: 'Pour les commerces actifs',
    features: ['POS complet', 'Ventes illimitées', 'Reçus WhatsApp automatiques', '3 employés', 'Boutique en ligne', 'Rapports basiques', 'Mode hors ligne'],
    cta: 'Choisir Starter',
    href: '/pricing',
    featured: true,
  },
  {
    name: 'Business',
    price: '15 000',
    period: '/mois',
    desc: 'Pour grandir vite',
    features: ['Tout Starter +', '10 employés', 'Rapports avancés', 'Gestion fournisseurs', 'Client Doit avancé', 'Notifications WhatsApp', 'QR Code boutique', 'Parrainage'],
    cta: 'Choisir Business',
    href: '/pricing',
    featured: false,
  },
  {
    name: 'Premium',
    price: '35 000',
    period: '/mois',
    desc: 'Pour les grandes enseignes',
    features: ['Tout Business +', 'Employés illimités', 'API WhatsApp Business', 'Multi-boutiques', 'Support prioritaire', 'Personnalisation complète', 'Capital global', 'Raccourcis personnalisés'],
    cta: 'Voir les tarifs',
    href: '/pricing',
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
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
              <Sparkles size={14} /> Pensé pour les commerces d'Afrique de l'Ouest
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm">
              <WifiOff size={14} /> Fonctionne sans internet
            </div>
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
              href="/demo"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-black text-slate-700 hover:bg-slate-50"
            >
              <Play size={18} className="text-emerald-600" /> Voir la demo
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 text-center">
            {[
              ['10+', 'Types de commerces'],
              ['WhatsApp', 'Reçus automatiques'],
              ['Offline', 'Mode hors ligne'],
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

      {/* Demo showcase */}
      <section className="bg-emerald-600 px-5 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-200">BOUTIQUE DEMO</p>
              <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                Voyez CaissePro<br />en action
              </h2>
              <p className="mt-5 text-lg font-semibold text-white/80">
                Explorez "Boutique Dakar Style" — une vraie boutique de mode africaine avec 8 produits, boutique en ligne publique et caisse POS operationnelle.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  '8 produits avec photos reelles',
                  'Boutique en ligne navigable',
                  'Commandes WhatsApp activees',
                  'Paiement Wave & Orange Money',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm font-bold text-white/90">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-200" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/shop/demo"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-black text-emerald-700 shadow-xl hover:bg-emerald-50"
                >
                  <Store size={16} /> Voir la boutique
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3.5 font-black text-white hover:bg-white/10"
                >
                  En savoir plus <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Mini product grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Boubou Brode Homme',  price: '25 000', img: 'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=400&q=80' },
                { name: 'Robe Wax Femme',       price: '18 000', img: 'https://images.unsplash.com/photo-1681545290284-679e6291c440?w=400&q=80' },
                { name: 'Tissu Bazin Riche',    price: '35 000', img: 'https://images.unsplash.com/photo-1552710307-537199cd41c0?w=400&q=80' },
                { name: 'Sandales Cuir Teinte', price: '12 000', img: 'https://images.unsplash.com/photo-1645944235766-54aade0e09bf?w=400&q=80' },
              ].map((p) => (
                <div key={p.name} className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm">
                  <div className="aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-black text-white leading-tight">{p.name}</p>
                    <p className="mt-0.5 text-xs font-bold text-emerald-200">{p.price} CFA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                className={`relative flex flex-col rounded-[2rem] border p-7 ${
                  plan.featured
                    ? 'border-emerald-500 bg-emerald-600 shadow-2xl shadow-emerald-500/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {plan.price !== '0' && (
                  <div className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    plan.featured ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white'
                  }`}>
                    2 MOIS OFFERTS
                  </div>
                )}
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
