import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Globe,
  HelpCircle,
  MessageCircle,
  QrCode,
  TrendingUp,
  Users,
  UserPlus,
  Wallet,
  Zap,
} from 'lucide-react'

const STEPS = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Inscrivez-vous gratuitement',
    desc: 'Remplissez le formulaire en 2 minutes. Aucun frais, aucune formation requise.',
  },
  {
    n: '02',
    icon: QrCode,
    title: 'Recevez votre code unique AGT-XXXXXX',
    desc: 'Après validation par notre équipe, vous recevez votre code personnalisé et votre lien de parrainage.',
  },
  {
    n: '03',
    icon: Users,
    title: 'Partagez avec les commerçants de votre région',
    desc: 'Partagez votre lien via WhatsApp, réseaux sociaux ou en personne. Chaque inscription est trackée automatiquement.',
  },
  {
    n: '04',
    icon: Wallet,
    title: 'Encaissez 50 000 XOF via Wave ou Orange Money',
    desc: 'Chaque mois où vous atteignez 20 abonnés payants, votre commission est versée sous 48h.',
  },
]

const PROFILES = [
  { emoji: '🎓', label: 'Étudiants', desc: 'Gagnez un revenu entre les cours sans quitter le campus.' },
  { emoji: '🛒', label: 'Vendeurs', desc: 'Proposez CaissePro aux boutiques que vous visitez chaque jour.' },
  { emoji: '📱', label: 'Influenceurs', desc: 'Monétisez votre audience en recommandant un outil africain.' },
  { emoji: '💼', label: 'Entrepreneurs', desc: 'Ajoutez une source de revenus récurrente à votre activité.' },
]

const FAQS = [
  {
    q: 'Comment suis-je payé ?',
    a: 'Par Wave ou Orange Money, chaque mois dès que vous atteignez votre objectif de 20 abonnés payants. Le paiement est effectué sous 48h après validation.',
  },
  {
    q: "Y a-t-il des frais pour devenir agent ?",
    a: "Non, devenir agent CaissePro est totalement gratuit. Nous ne prenons aucun frais d'inscription ni de formation.",
  },
  {
    q: 'Quand est-ce que je reçois ma commission ?',
    a: 'Dès que vous atteignez 20 abonnés payants dans le mois en cours. Vous recevez une notification WhatsApp dès l\'objectif atteint.',
  },
  {
    q: 'Dans quels pays puis-je recruter ?',
    a: "Toute l'Afrique — francophone et anglophone : Sénégal, Côte d'Ivoire, Mali, Cameroun, Ghana, Nigeria, Kenya, Rwanda et bien d'autres.",
  },
]

export default function CareersPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/caissepro-logo.png" alt="CaissePro" width={120} height={40} className="h-9 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/agents/login"
              className="hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-black text-white backdrop-blur-sm hover:bg-white/20 transition-all sm:inline-flex"
            >
              Espace agent
            </Link>
            <Link
              href="/agents"
              className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
            >
              Postuler maintenant
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-24 pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm font-black text-emerald-300 backdrop-blur-sm">
            <Briefcase size={14} /> Programme Agents CaissePro
          </div>
          <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white md:text-7xl">
            Rejoignez l'équipe
            <span className="block bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">CaissePro</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-xl font-semibold leading-relaxed text-white/60">
            Aidez les commerçants africains à digitaliser leur business et gagnez des commissions chaque mois.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-500/25 hover:bg-emerald-400 transition-all"
            >
              Postuler maintenant <ArrowRight size={20} />
            </Link>
            <Link
              href="/agents/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-black text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              Déjà agent ? Se connecter
            </Link>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-6 text-center">
            {[
              ['50 000', 'XOF / mois'],
              ['20', 'Abonnés objectif'],
              ['0 XOF', "Frais d'inscription"],
            ].map(([val, label]) => (
              <div key={label} className="glass rounded-[1.5rem] px-4 py-5">
                <p className="text-3xl font-black text-emerald-400 md:text-4xl">{val}</p>
                <p className="mt-1 text-sm font-bold text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Card */}
      <section className="mx-auto max-w-5xl px-5 py-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 shadow-2xl shadow-emerald-500/20 glow-emerald-strong md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-200">Commission mensuelle</p>
              <h2 className="mt-2 text-5xl font-black leading-none md:text-6xl">50 000 XOF</h2>
              <p className="mt-3 text-lg font-bold text-white/80">pour 20 nouveaux abonnés payants par mois</p>
              <Link
                href="/agents"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-emerald-700 shadow-xl hover:bg-emerald-50 transition-all"
              >
                Postuler maintenant <ArrowRight size={16} />
              </Link>
            </div>
            <ul className="space-y-3">
              {[
                "Paiement via Wave ou Orange Money",
                "Versement sous 48h dès l'objectif atteint",
                "Suivi en temps réel sur votre dashboard",
                "Disponible dans toute l'Afrique",
                "Aucun plafond de revenus sur plusieurs mois",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-semibold text-white/90">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-200" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">COMMENT ÇA MARCHE</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Simple comme bonjour</h2>
            <p className="mt-4 text-lg font-semibold text-white/50">4 étapes pour commencer à gagner</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="glass rounded-[2rem] p-7 transition-all hover:bg-white/15 hover:-translate-y-0.5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                    <Icon size={22} />
                  </div>
                  <span className="text-2xl font-black text-white/20">{n}</span>
                </div>
                <h3 className="text-lg font-black leading-snug text-white">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who can apply */}
      <section className="bg-slate-950 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">QUI PEUT POSTULER</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Ouvert à tous en Afrique</h2>
            <p className="mt-4 text-lg font-semibold text-white/50">Afrique francophone et anglophone — partout sur le continent</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PROFILES.map(({ emoji, label, desc }) => (
              <div key={label} className="glass rounded-[2rem] p-7 transition-all hover:bg-white/15 hover:-translate-y-0.5">
                <div className="mb-4 text-4xl">{emoji}</div>
                <h3 className="text-xl font-black text-white">{label}</h3>
                <p className="mt-2 text-sm font-semibold text-white/50">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-sm font-bold text-white/30">
            <Globe size={14} />
            <span>Sénégal · Côte d&apos;Ivoire · Mali · Cameroun · Ghana · Nigeria · Kenya · Rwanda · et plus</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-900 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">AVANTAGES</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Pourquoi devenir agent ?</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: DollarSign, title: 'Revenu récurrent',    desc: 'Chaque mois que vous atteignez votre objectif, vous êtes payé automatiquement via mobile money.', color: 'bg-emerald-500/20 text-emerald-300' },
              { icon: TrendingUp, title: 'Croissance illimitée', desc: 'Plus vous recrutez de commerçants actifs, plus votre réseau travaille pour vous chaque mois.',   color: 'bg-blue-500/20 text-blue-300' },
              { icon: MessageCircle, title: 'Support dédié',     desc: "Accès à un groupe WhatsApp d'agents CaissePro avec ressources marketing et support prioritaire.", color: 'bg-violet-500/20 text-violet-300' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass rounded-[2rem] p-8 transition-all hover:bg-white/15 hover:-translate-y-0.5">
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

      {/* FAQ */}
      <section className="bg-slate-950 px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">FAQ</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Questions fréquentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="glass rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <HelpCircle size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                  <div>
                    <h3 className="font-black text-white">{q}</h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-white/50">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-slate-900 px-5 py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="glass-dark rounded-[2.5rem] px-8 py-16 glow-emerald">
            <Zap className="mx-auto text-emerald-400" size={40} />
            <h2 className="mt-5 text-4xl font-black text-white md:text-5xl">Prêt à rejoindre CaissePro ?</h2>
            <p className="mt-4 text-lg font-semibold text-white/50">
              Inscription gratuite · Disponible dans toute l&apos;Afrique
            </p>
            <Link
              href="/agents"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-black text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 transition-all"
            >
              Postuler maintenant <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white">C</div>
            <span className="font-black text-white">CaissePro</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <Link href="/agents" className="hover:text-emerald-400 transition-colors">Devenir agent</Link>
            <Link href="/agents/login" className="hover:text-white transition-colors">Espace agent</Link>
            <Link href="/legal" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
          <p className="text-xs font-semibold text-white/30">© {new Date().getFullYear()} CaissePro.</p>
        </div>
      </footer>
    </main>
  )
}
