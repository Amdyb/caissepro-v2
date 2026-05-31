import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Globe,
  MessageCircle,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'

const STEPS = [
  { n: '01', title: 'Inscrivez-vous gratuitement', desc: 'Remplissez le formulaire en 2 minutes. Aucun frais, aucune formation requise.' },
  { n: '02', title: 'Recevez votre code unique', desc: 'Après validation, vous recevez votre code AGT-XXXXXX et votre lien personnalisé.' },
  { n: '03', title: 'Partagez avec les commerçants', desc: 'Partagez votre lien avec les commerçants de votre région via WhatsApp, réseaux sociaux ou en personne.' },
  { n: '04', title: 'Encaissez vos commissions', desc: 'Chaque mois où vous atteignez 20 abonnés payants, recevez 50 000 XOF via Wave ou Orange Money.' },
]

const PROFILES = [
  { icon: '🎓', label: 'Étudiants', desc: 'Gagnez un revenu complémentaire entre les cours.' },
  { icon: '📱', label: 'Influenceurs', desc: 'Monétisez votre audience en recommandant un outil utile.' },
  { icon: '🛒', label: 'Vendeurs', desc: 'Proposez CaissePro aux commerces que vous visitez.' },
  { icon: '💼', label: 'Entrepreneurs', desc: 'Ajoutez une source de revenus récurrente à votre activité.' },
]

const FAQS = [
  {
    q: 'Comment suis-je payé ?',
    a: 'Par Wave ou Orange Money, chaque mois dès que vous atteignez votre objectif de 20 abonnés payants.',
  },
  {
    q: "Y a-t-il des frais pour devenir agent ?",
    a: "Non, devenir agent CaissePro est totalement gratuit. Nous ne prenons aucun frais d'inscription.",
  },
  {
    q: 'Quand est-ce que je reçois ma commission ?',
    a: 'Dès que vous atteignez 20 abonnés payants dans le mois en cours. Le paiement est effectué sous 48h.',
  },
  {
    q: 'Dans quels pays puis-je recruter ?',
    a: "Toute l'Afrique francophone et anglophone : Sénégal, Côte d'Ivoire, Mali, Cameroun, Ghana, Nigeria et bien d'autres.",
  },
]

export default function CareersPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">C</div>
            <span className="text-xl font-black text-slate-950">CaissePro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/agents" className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">
              Postuler maintenant
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 to-white px-5 pb-24 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
            <Briefcase size={14} /> Devenez Agent CaissePro
          </div>
          <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-7xl">
            Rejoignez l'équipe
            <span className="block text-emerald-600">CaissePro</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-xl font-semibold leading-relaxed text-slate-500">
            Aidez les commerçants africains à digitaliser leur business et gagnez des commissions chaque mois.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-600/25 hover:bg-emerald-700"
            >
              Postuler maintenant <ArrowRight size={20} />
            </Link>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-6 text-center">
            {[
              ['50 000', 'XOF/mois max'],
              ['20', 'Abonnés objectif'],
              ['0 XOF', "Frais d'inscription"],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl font-black text-emerald-600 md:text-4xl">{val}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Card */}
      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="overflow-hidden rounded-[2rem] bg-emerald-600 p-8 text-white shadow-2xl shadow-emerald-600/20 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-200">Commission mensuelle</p>
              <h2 className="mt-2 text-5xl font-black md:text-6xl">50 000 XOF</h2>
              <p className="mt-3 text-lg font-bold text-white/80">pour 20 nouveaux abonnés payants par mois</p>
            </div>
            <div className="space-y-3">
              {[
                'Paiement via Wave ou Orange Money',
                'Pas de plafond sur plusieurs mois',
                'Suivi en temps réel sur votre dashboard',
                'Disponible dans toute l\'Afrique',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-200" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-14 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">COMMENT ÇA MARCHE</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Simple comme bonjour</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="rounded-[2rem] border border-slate-100 bg-slate-50 p-7 transition hover:border-emerald-200 hover:bg-white hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white">
                {n}
              </div>
              <h3 className="text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who can apply */}
      <section className="bg-slate-950 px-5 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">QUI PEUT POSTULER</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Ouvert à tous en Afrique</h2>
            <p className="mt-4 text-lg font-semibold text-white/60">Afrique entière — francophone et anglophone</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PROFILES.map(({ icon, label, desc }) => (
              <div key={label} className="rounded-[2rem] border border-white/10 bg-white/5 p-7 transition hover:border-emerald-500/30 hover:bg-white/10">
                <div className="mb-4 text-4xl">{icon}</div>
                <h3 className="text-xl font-black">{label}</h3>
                <p className="mt-2 text-sm font-semibold text-white/60">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-3 text-sm font-bold text-white/40">
            <Globe size={16} />
            <span>Sénégal · Côte d&apos;Ivoire · Mali · Cameroun · Ghana · Nigeria · Rwanda · et plus</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-14 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">AVANTAGES</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Pourquoi devenir agent ?</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Wallet, title: 'Revenu récurrent', desc: 'Chaque mois que vous atteignez votre objectif, vous êtes payé automatiquement.', color: 'bg-emerald-50 text-emerald-700' },
            { icon: TrendingUp, title: 'Croissance illimitée', desc: 'Plus vous recrutez de commerçants actifs, plus votre réseau travaille pour vous.', color: 'bg-blue-50 text-blue-700' },
            { icon: MessageCircle, title: 'Support dédié', desc: 'Accès à un groupe WhatsApp d\'agents CaissePro avec support et ressources marketing.', color: 'bg-violet-50 text-violet-700' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8 transition hover:border-emerald-200 hover:bg-white hover:shadow-lg">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">FAQ</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Questions fréquentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-black text-slate-950">{q}</h3>
                  <ChevronDown size={18} className="mt-1 shrink-0 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="rounded-[2.5rem] bg-emerald-600 px-8 py-16 shadow-2xl shadow-emerald-600/20">
          <Zap className="mx-auto text-white/70" size={40} />
          <h2 className="mt-5 text-4xl font-black text-white md:text-5xl">Prêt à rejoindre CaissePro ?</h2>
          <p className="mt-4 text-lg font-semibold text-white/70">Inscription gratuite · Disponible dans toute l'Afrique</p>
          <Link
            href="/agents"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-black text-emerald-700 shadow-xl hover:bg-emerald-50"
          >
            Postuler maintenant <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">C</div>
            <span className="font-black text-slate-950">CaissePro</span>
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <Link href="/" className="hover:text-slate-700">Accueil</Link>
            <Link href="/agents" className="hover:text-emerald-700">Devenir agent</Link>
            <Link href="/agents/login" className="hover:text-slate-700">Connexion agent</Link>
          </div>
          <p className="text-xs font-semibold text-slate-400">© {new Date().getFullYear()} CaissePro.</p>
        </div>
      </footer>
    </main>
  )
}
