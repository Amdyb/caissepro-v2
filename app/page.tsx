import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  Users,
  Wallet,
  Zap
} from 'lucide-react'

const businessTypes = [
  'Boutiques',
  'Supérettes',
  'Restaurants',
  'Salons de coiffure',
  'Pharmacies',
  'Magasins électroniques',
  'Vape shops',
  'Cosmétiques',
  'Quincailleries',
  'Grossistes',
  'Fast-food',
  'Services'
]

const features = [
  {
    title: 'Caisse rapide',
    text: 'Vendez plus vite avec un POS simple, moderne et adapté aux équipes.',
    icon: ShoppingCart
  },
  {
    title: 'Stock intelligent',
    text: 'Suivez les produits, les images, les alertes stock bas et les réassorts.',
    icon: Package
  },
  {
    title: 'Clients & fidélité',
    text: 'Gardez vos clients, points fidélité, achats et dettes Client Doit.',
    icon: Users
  },
  {
    title: 'Rapports & profits',
    text: 'Analysez les ventes, dépenses, bénéfices et performances de votre boutique.',
    icon: BarChart3
  },
  {
    title: 'Reçus & factures',
    text: 'Imprimez, partagez et personnalisez vos reçus avec votre logo.',
    icon: ReceiptText
  },
  {
    title: 'Multi-boutiques',
    text: 'Gérez plusieurs magasins, branches, équipes et stocks.',
    icon: Building2
  }
]

const plans = [
  {
    name: 'Starter',
    price: '5 000',
    period: 'CFA / mois',
    description: 'Pour commencer avec une seule boutique.',
    badge: 'Simple',
    icon: Store,
    features: [
      '1 boutique',
      'Caisse POS',
      'Produits & stock',
      'Historique des ventes',
      'Clients de base',
      'Reçus simples'
    ],
    cta: 'Commencer'
  },
  {
    name: 'Pro',
    price: '12 000',
    period: 'CFA / mois',
    description: 'Pour les boutiques sérieuses qui veulent grandir.',
    badge: 'Populaire',
    icon: Crown,
    featured: true,
    features: [
      'Tout Starter',
      'Client Doit',
      'Fidélité clients',
      'Dépenses & profits',
      'Fournisseurs',
      'Achats / réassort',
      'Analytics avancés',
      'Branding boutique'
    ],
    cta: 'Choisir Pro'
  },
  {
    name: 'Business',
    price: '25 000',
    period: 'CFA / mois',
    description: 'Pour multi-boutiques, franchises et équipes.',
    badge: 'Premium',
    icon: ShieldCheck,
    features: [
      'Tout Pro',
      'Multi-boutiques',
      'Employés & permissions',
      'Rapports complets',
      'Support prioritaire',
      'Options personnalisées',
      'Préparation boutique en ligne',
      'Accompagnement setup'
    ],
    cta: 'Contacter'
  }
]

const paymentLogos = [
  { name: 'Wave', className: 'bg-sky-50 text-sky-700 border-sky-100' },
  { name: 'Orange Money', className: 'bg-orange-50 text-orange-700 border-orange-100' },
  { name: 'Free Money', className: 'bg-red-50 text-red-700 border-red-100' },
  { name: 'Cash', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { name: 'Carte', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  { name: 'Client Doit', className: 'bg-amber-50 text-amber-700 border-amber-100' }
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <ShoppingCart size={24} />
            </div>

            <div>
              <p className="text-xl font-black">CaissePro</p>
              <p className="text-xs font-bold text-slate-500">POS pour l’Afrique</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-black text-slate-600 md:flex">
            <a href="#features" className="hover:text-emerald-700">Fonctions</a>
            <a href="#business" className="hover:text-emerald-700">Business</a>
            <a href="#payments" className="hover:text-emerald-700">Paiements</a>
            <a href="#pricing" className="hover:text-emerald-700">Prix</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 md:block"
            >
              Connexion
            </Link>

            <Link
              href="/login"
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Démarrer
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
              <Zap size={16} />
              Caisse moderne pour boutiques africaines
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
              Gérez votre boutique comme une grande entreprise.
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              CaissePro aide les commerces à vendre, gérer le stock, suivre les clients,
              accepter plusieurs paiements et comprendre les profits — simplement.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Essayer maintenant
                <ArrowRight size={18} />
              </Link>

              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-7 py-4 font-black text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Voir les prix
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-950">POS</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Caisse rapide</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-950">Stock</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Alertes & réassort</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-950">CFA</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Pensé local</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-300">Aujourd’hui</p>
                    <p className="text-3xl font-black">245 000 CFA</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <BarChart3 />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <Package className="text-emerald-300" />
                    <p className="mt-4 text-sm font-bold text-white/70">Produits</p>
                    <p className="text-2xl font-black">128</p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-4">
                    <Users className="text-emerald-300" />
                    <p className="mt-4 text-sm font-bold text-white/70">Clients</p>
                    <p className="text-2xl font-black">342</p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl bg-white p-4 text-slate-950">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-black">Dernière vente</p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Wave</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <span className="font-bold">Produit premium</span>
                      <span className="font-black">15 000 CFA</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <span className="font-bold">Accessoire</span>
                      <span className="font-black">5 000 CFA</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-4">
                    <span className="font-black">Total</span>
                    <span className="text-2xl font-black text-emerald-700">20 000 CFA</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:block">
              <p className="text-sm font-bold text-slate-500">Stock faible</p>
              <p className="mt-1 text-2xl font-black text-amber-600">7 produits</p>
            </div>
          </div>
        </div>
      </section>

      <section id="payments" className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black">Paiements adaptés au marché local</h2>
              <p className="mt-2 font-semibold text-slate-600">
                CaissePro prépare votre commerce pour Cash, Wave, Orange Money, Free Money, carte et Client Doit.
              </p>
            </div>

            <CreditCard className="text-emerald-600" size={34} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {paymentLogos.map((payment) => (
              <div
                key={payment.name}
                className={`flex min-h-24 items-center justify-center rounded-3xl border px-4 text-center text-lg font-black shadow-sm ${payment.className}`}
              >
                {payment.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Toutes les fonctions essentielles pour gérer votre commerce.
          </h2>
          <p className="mt-4 text-lg font-semibold text-slate-600">
            Une seule plateforme pour vendre, suivre, encaisser et comprendre votre business.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <div key={feature.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-6 inline-flex rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <Icon size={28} />
                </div>

                <h3 className="text-2xl font-black">{feature.title}</h3>
                <p className="mt-3 font-semibold leading-7 text-slate-600">{feature.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="business" className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-emerald-300">
                Pour plusieurs types de business
              </div>

              <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                CaissePro s’adapte à votre activité.
              </h2>

              <p className="mt-5 text-lg font-semibold leading-8 text-white/70">
                Que vous vendiez des produits, services, repas, accessoires ou articles en boutique,
                CaissePro reste simple pour vos employés et puissant pour le propriétaire.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-black text-white hover:bg-emerald-700"
                >
                  Créer ma boutique
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-7 py-4 font-black text-white hover:bg-white/15"
                >
                  Comparer les plans
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {businessTypes.map((type) => (
                <div key={type} className="rounded-3xl border border-white/10 bg-white/5 p-4 font-black text-white/90">
                  <CheckCircle2 className="mb-3 text-emerald-400" size={20} />
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Plans simples pour chaque niveau.
          </h2>
          <p className="mt-4 text-lg font-semibold text-slate-600">
            Vous pourrez ajuster les prix selon vos abonnés et vos marchés.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon

            return (
              <div
                key={plan.name}
                className={`relative rounded-[2rem] border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl ${
                  plan.featured
                    ? 'border-emerald-300 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-950'
                }`}
              >
                <div className={`mb-6 inline-flex rounded-2xl p-4 ${plan.featured ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon size={30} />
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-3xl font-black">{plan.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${plan.featured ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {plan.badge}
                  </span>
                </div>

                <p className={`font-semibold leading-7 ${plan.featured ? 'text-white/70' : 'text-slate-600'}`}>
                  {plan.description}
                </p>

                <div className="mt-7">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className={`ml-2 font-bold ${plan.featured ? 'text-white/60' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                </div>

                <Link
                  href="/login"
                  className={`mt-7 block rounded-2xl px-5 py-4 text-center font-black ${
                    plan.featured
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className={plan.featured ? 'text-emerald-300' : 'text-emerald-600'} size={19} />
                      <p className={`font-bold ${plan.featured ? 'text-white/85' : 'text-slate-700'}`}>
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-[2rem] bg-emerald-600 p-10 text-center text-white shadow-2xl shadow-emerald-600/20 md:p-16">
          <Smartphone className="mx-auto mb-6" size={46} />

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Prêt à moderniser votre boutique ?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold text-white/85">
            Lancez CaissePro, ajoutez vos produits, encaissez vos ventes et suivez votre business en temps réel.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-emerald-700 hover:bg-slate-50"
            >
              Commencer maintenant
              <ArrowRight size={18} />
            </Link>

            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-7 py-4 font-black text-white hover:bg-emerald-800"
            >
              Voir les abonnements
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <ShoppingCart size={20} />
            </div>
            <p className="font-black">CaissePro</p>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            POS, stock, clients et analytics pour commerces modernes.
          </p>
        </div>
      </footer>
    </main>
  )
}
