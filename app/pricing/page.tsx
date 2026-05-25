'use client'

import PaymentModal from '@/components/PaymentModal'
import { supabase } from '@/lib/supabaseClient'
import { Check, Crown, Rocket, ShieldCheck, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0',
    amount: 0,
    audience: 'Démarrer, tester',
    icon: Store,
    highlighted: false,
    isPaid: false,
    features: [
      '1 utilisateur',
      '10 produits max',
      'Caisse basique',
      'Publicités affichées',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '5 000',
    amount: 5000,
    audience: 'Petites boutiques',
    icon: Rocket,
    highlighted: true,
    isPaid: true,
    features: [
      'Produits illimités',
      'Reçus WhatsApp',
      'Client Doit',
      'Rapports avancés',
      'Sans publicité',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '15 000',
    amount: 15000,
    audience: 'Boutiques en croissance',
    icon: ShieldCheck,
    highlighted: false,
    isPaid: true,
    features: [
      'Tout Starter +',
      'Boutique en ligne',
      '5 employés',
      'Paiements mobiles',
      'Tontine: 5 groupes / 100 membres',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '35 000',
    amount: 35000,
    audience: 'Multi-succursales',
    icon: Crown,
    highlighted: false,
    isPaid: true,
    features: [
      'Tout Business +',
      'Multi-succursales',
      'Domaine personnalisé',
      'Employés illimités',
      'Tontine illimitée + export PDF',
      'Support prioritaire',
    ],
  },
]

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      setUserEmail(userData.user.email || '')
      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()
      const member: any = membership
      if (member) {
        setBusinessId(member.business_id)
        setBusinessName(member.businesses?.name || '')
      }
    }
    loadUser()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          businessId={businessId}
          businessName={businessName}
          userEmail={userEmail}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex rounded-full bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
            CaissePro — Plans & Tarifs
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Une caisse moderne pour chaque commerce africain.
          </h1>
          <p className="mt-5 text-lg font-semibold text-slate-600">
            Choisissez le plan adapté à votre boutique. Payable par Wave ou Orange Money.
          </p>
        </div>

        {/* Promo banner */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-white shadow-xl shadow-emerald-600/20">
          <Sparkles size={18} className="shrink-0" />
          <p className="font-black">Offre de lancement : Payez 1 mois, obtenez 2 mois d'utilisation !</p>
          <Sparkles size={18} className="shrink-0" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          {PLANS.map((plan) => {
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
                {plan.isPaid && (
                  <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    plan.highlighted ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                  }`}>
                    2 MOIS OFFERTS
                  </div>
                )}

                <div className={`mb-6 mt-4 inline-flex rounded-2xl p-4 ${plan.highlighted ? 'bg-white/15' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon size={28} />
                </div>

                <h2 className="text-2xl font-black">{plan.name}</h2>
                <p className={`mt-2 text-sm font-bold ${plan.highlighted ? 'text-white/80' : 'text-slate-500'}`}>
                  {plan.audience}
                </p>

                <div className="mt-6">
                  {plan.isPaid ? (
                    <p className="text-3xl font-black">
                      {plan.price} <span className={`text-base font-bold ${plan.highlighted ? 'text-white/70' : 'text-slate-400'}`}>XOF/mois</span>
                    </p>
                  ) : (
                    <p className="text-3xl font-black">Gratuit</p>
                  )}
                </div>

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

                {plan.isPaid ? (
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className={`mt-8 block w-full rounded-2xl px-5 py-4 text-center text-sm font-black transition hover:scale-[1.02] active:scale-[0.98] ${
                      plan.highlighted
                        ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                        : 'bg-slate-950 text-white hover:bg-slate-800'
                    }`}
                  >
                    Choisir {plan.name}
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className="mt-8 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Commencer gratuitement
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-black text-slate-950">
            Paiement par Wave ou Orange Money — activation sous 24h.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Après paiement, envoyez votre reçu sur WhatsApp et votre compte sera activé rapidement.
          </p>
        </div>
      </section>
    </main>
  )
}
