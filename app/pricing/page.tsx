import Link from 'next/link'
import { Check, Crown, Rocket, ShieldCheck, Store } from 'lucide-react'

const plans = [
  {
    name: 'Gratuit',
    price: '0 XOF',
    audience: 'Démarrer, tester',
    icon: Store,
    highlighted: false,
    features: [
      '1 utilisateur',
      '10 produits max',
      'Caisse basique',
      'Publicités affichées'
    ]
  },
  {
    name: 'Starter',
    price: '5 000 XOF/mois',
    audience: 'Petites boutiques',
    icon: Rocket,
    highlighted: true,
    features: [
      'Produits illimités',
      'Reçus WhatsApp',
      'Client Doit',
      'Rapports',
      'Sans publicité'
    ]
  },
  {
    name: 'Business',
    price: '15 000 XOF/mois',
    audience: 'Boutiques en croissance',
    icon: ShieldCheck,
    highlighted: false,
    features: [
      'Tout Starter +',
      'Boutique en ligne',
      '5 employés',
      'Paiements mobiles',
      'Tontine: 5 groupes / 100 membres'
    ]
  },
  {
    name: 'Premium',
    price: '35 000 XOF/mois',
    audience: 'Multi-succursales',
    icon: Crown,
    highlighted: false,
    features: [
      'Tout Business +',
      'Multi-succursales',
      'Domaine personnalisé',
      'Employés illimités',
      'Tontine illimitée + export PDF',
      'Support prioritaire'
    ]
  }
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex rounded-full bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
            CaissePro — Plans & Tarifs
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Une caisse moderne pour chaque commerce africain.
          </h1>

          <p className="mt-5 text-lg font-semibold text-slate-600">
            Choisissez le plan adapté à votre boutique. Payable par Wave, Orange Money ou carte bancaire.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-6 shadow-sm ${
                  plan.highlighted
                    ? 'border-emerald-300 bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'
                    : 'border-slate-200 bg-white text-slate-950'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">
                    Recommandé
                  </div>
                )}

                <div className={`mb-6 inline-flex rounded-2xl p-4 ${plan.highlighted ? 'bg-white/15' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon size={28} />
                </div>

                <h2 className="text-2xl font-black">{plan.name}</h2>
                <p className={`mt-2 text-sm font-bold ${plan.highlighted ? 'text-white/80' : 'text-slate-500'}`}>
                  {plan.audience}
                </p>

                <p className="mt-6 text-3xl font-black">{plan.price}</p>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className={plan.highlighted ? 'text-white' : 'text-emerald-600'} size={18} />
                      <span className={`text-sm font-bold ${plan.highlighted ? 'text-white/90' : 'text-slate-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className={`mt-8 block rounded-2xl px-5 py-4 text-center text-sm font-black transition ${
                    plan.highlighted
                      ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  Commencer
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-black text-slate-950">
            Paiement disponible par Wave, Orange Money ou carte bancaire.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Les intégrations de paiement seront activées progressivement selon le pays et le type de commerce.
          </p>
        </div>
      </section>
    </main>
  )
}
