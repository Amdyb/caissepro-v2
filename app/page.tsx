import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  LayoutGrid,
  MessageCircle,
  Moon,
  Play,
  QrCode,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Reçus WhatsApp auto',
    desc: 'Envoyez automatiquement le reçu de chaque vente sur WhatsApp. Vos clients gardent la trace sans effort.',
    color: 'bg-sky-500/20 text-sky-300',
  },
  {
    icon: WifiOff,
    title: 'Mode hors ligne',
    desc: 'CaissePro fonctionne sans connexion internet. Vos ventes sont synchronisées dès que le réseau revient.',
    color: 'bg-slate-500/20 text-slate-300',
  },
  {
    icon: LayoutGrid,
    title: '10+ types de commerces',
    desc: "Boutique, restaurant, salon, pharmacie, garage, BTP, tontine, location... CaissePro s'adapte à votre activité.",
    color: 'bg-violet-500/20 text-violet-300',
  },
  {
    icon: Users,
    title: 'Programme de parrainage',
    desc: "Parrainez d'autres commerçants et gagnez des récompenses. Votre réseau grandit, votre business aussi.",
    color: 'bg-amber-500/20 text-amber-300',
  },
  {
    icon: Moon,
    title: 'Mode sombre',
    desc: 'Interface adaptée pour travailler confortablement à toute heure, de jour comme de nuit.',
    color: 'bg-indigo-500/20 text-indigo-300',
  },
  {
    icon: QrCode,
    title: 'QR Code boutique',
    desc: 'Générez votre QR code et affichez-le en caisse. Vos clients scannent et commandent instantanément.',
    color: 'bg-rose-500/20 text-rose-300',
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
    text: "La boutique en ligne m'a permis de toucher des clients que je ne connaissais pas. Simple, moderne, africain.",
    stars: 5,
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/30">C</div>
            <span className="text-xl font-black text-white">CaissePro</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-bold text-white/60 lg:flex">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-black text-white backdrop-blur-sm hover:bg-white/20 transition-all sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/register" className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 transition-all">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pb-28 pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-48 w-48 rounded-full bg-emerald-400/5 blur-3xl" />

        {/* Floating decorative glass cards */}
        <div className="pointer-events-none absolute right-8 top-24 hidden rotate-6 xl:block">
          <div className="glass rounded-[1.5rem] p-4 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-black text-white/70">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              Vente enregistrée
            </div>
            <p className="mt-1 text-lg font-black text-white">12 500 XOF</p>
          </div>
        </div>
        <div className="pointer-events-none absolute left-8 bottom-32 hidden -rotate-3 xl:block">
          <div className="glass rounded-[1.5rem] p-4 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <CheckCircle2 size={12} />
              Reçu WhatsApp envoyé
            </div>
            <p className="mt-1 text-sm font-bold text-white/70">+221 77 xxx xx xx</p>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Announcement pill */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm font-black text-emerald-300 backdrop-blur-sm">
              <Sparkles size={14} /> Pensé pour les commerces d'Afrique de l'Ouest
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/60 backdrop-blur-sm">
              <WifiOff size={14} /> Fonctionne sans internet
            </div>
          </div>

          <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white md:text-7xl">
            La caisse enregistreuse
            <span className="block bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              de l'Afrique moderne
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-xl font-semibold leading-relaxed text-white/60">
            POS mobile, boutique en ligne, reçus WhatsApp et gestion de stock. Tout ce dont votre commerce a besoin — en un seul outil.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 transition-all"
            >
              Essayer gratuitement <ArrowRight size={20} />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-black text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <Play size={18} className="text-emerald-400" /> Voir la demo
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-14 grid grid-cols-3 gap-6 text-center">
            {[
              ['10+', 'Types de commerces'],
              ['WhatsApp', 'Reçus automatiques'],
              ['Offline', 'Mode hors ligne'],
            ].map(([val, label]) => (
              <div key={label} className="glass rounded-[1.5rem] px-4 py-5">
                <p className="text-3xl font-black text-emerald-400 md:text-4xl">{val}</p>
                <p className="mt-1 text-sm font-bold text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative bg-gradient-to-b from-slate-950 to-slate-900 px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">FONCTIONNALITÉS</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl text-white">Tout pour gérer votre commerce</h2>
            <p className="mt-4 text-lg font-semibold text-white/50">Simple à utiliser. Puissant pour grandir.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass rounded-[2rem] p-7 transition-all hover:bg-white/15 hover:shadow-xl hover:-translate-y-0.5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo showcase ── */}
      <section className="bg-emerald-600 px-5 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-200">BOUTIQUE DEMO</p>
              <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                Voyez CaissePro<br />en action
              </h2>
              <p className="mt-5 text-lg font-semibold text-white/80">
                Voici a quoi ressemble votre boutique CaissePro. Explorez "Boutique Dakar Style" — mode africaine, boutique en ligne publique, caisse POS en direct.
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-black text-emerald-700 shadow-xl hover:bg-emerald-50 transition-all"
                >
                  <Store size={16} /> Voir la boutique
                </Link>
                <Link
                  href="/pos"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-black text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <Zap size={16} /> Essayer la caisse
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Boubou Brode Homme',  price: '25 000', img: 'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=400&q=80' },
                { name: 'Robe Wax Femme',       price: '18 000', img: 'https://images.unsplash.com/photo-1681545290284-679e6291c440?w=400&q=80' },
                { name: 'Tissu Bazin Riche',    price: '35 000', img: 'https://images.unsplash.com/photo-1552710307-537199cd41c0?w=400&q=80' },
                { name: 'Sandales Cuir Teinte', price: '12 000', img: 'https://images.unsplash.com/photo-1645944235766-54aade0e09bf?w=400&q=80' },
              ].map((p) => (
                <div key={p.name} className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
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

      {/* ── Pricing ── */}
      <section id="pricing" className="relative bg-slate-950 px-5 py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">TARIFS</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Simple. Clair. Abordable.</h2>
            <p className="mt-4 text-lg font-semibold text-white/50">Commencez gratuitement. Passez au plan supérieur quand vous êtes prêt.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-[2rem] p-7 transition-all ${
                  plan.featured
                    ? 'border border-emerald-400/50 bg-white/10 shadow-2xl shadow-emerald-500/10 backdrop-blur-md glow-emerald'
                    : 'glass'
                }`}
              >
                {plan.price !== '0' && (
                  <div className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    plan.featured ? 'bg-emerald-400 text-slate-950' : 'bg-white/20 text-white'
                  }`}>
                    2 MOIS OFFERTS
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">{plan.desc}</p>
                  <h3 className="mt-2 text-2xl font-black text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.featured ? 'text-emerald-300' : 'text-white'}`}>{plan.price}</span>
                    <span className="mb-1 text-sm font-bold text-white/40">XOF{plan.period}</span>
                  </div>
                </div>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 size={15} className={plan.featured ? 'text-emerald-400' : 'text-emerald-500/60'} />
                      <span className="text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-8 block rounded-2xl py-3.5 text-center font-black transition-all ${
                    plan.featured
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-500/40'
                      : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="bg-slate-900 px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">TÉMOIGNAGES</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Ils font confiance à CaissePro</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, business, text, stars }) => (
              <div key={name} className="glass rounded-[2rem] p-8">
                <div className="flex gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-5 text-sm font-semibold leading-7 text-white/60">"{text}"</p>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="font-black text-white">{name}</p>
                  <p className="text-xs font-bold text-white/40">{business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent section ── */}
      <section className="relative overflow-hidden bg-slate-950 px-5 py-24">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-400">PROGRAMME AGENTS</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">
                Devenez Agent CaissePro
              </h2>
              <p className="mt-5 text-lg font-semibold leading-relaxed text-white/60">
                Gagnez <strong className="text-white">50 000 XOF par mois</strong> en recommandant CaissePro aux commerçants de votre région.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 font-black text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                >
                  Devenir Agent <ArrowRight size={18} />
                </Link>
              </div>
              <p className="mt-4 text-sm font-bold text-white/30">
                Inscription gratuite · Disponible dans toute l'Afrique
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { icon: Briefcase, label: 'Gratuit',      desc: 'Aucun frais pour rejoindre',     color: 'bg-emerald-500/20 text-emerald-300' },
                { icon: TrendingUp, label: '50 000 XOF',  desc: 'Commission mensuelle objectif',  color: 'bg-blue-500/20 text-blue-300' },
                { icon: Users,      label: "Toute l'Afrique", desc: 'Recrutez partout',           color: 'bg-violet-500/20 text-violet-300' },
              ].map(({ icon: Icon, label, desc, color }) => (
                <div key={label} className="glass rounded-[1.5rem] p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 font-black text-white">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-white/50">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 px-5 py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="glass-dark rounded-[2.5rem] px-8 py-16 glow-emerald">
            <Zap className="mx-auto text-emerald-400" size={40} />
            <h2 className="mt-5 text-4xl font-black text-white md:text-5xl">Prêt à moderniser votre commerce ?</h2>
            <p className="mt-4 text-lg font-semibold text-white/50">Créez votre compte gratuit en moins de 2 minutes.</p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-black text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-500/40 transition-all"
            >
              Commencer gratuitement <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-slate-950 px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white">C</div>
            <span className="font-black text-white">CaissePro</span>
            <span className="text-xs font-semibold text-white/30">par Amdy Labs</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-white/40">
            <Link href="/legal" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/help" className="hover:text-white transition-colors">Aide</Link>
            <Link href="/careers" className="hover:text-emerald-400 transition-colors">Carrières</Link>
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-emerald-400 transition-colors">Inscription</Link>
          </div>
          <p className="text-xs font-semibold text-white/30">© {new Date().getFullYear()} CaissePro. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  )
}
