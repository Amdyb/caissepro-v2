'use client'

import AppShell from '@/components/AppShell'
import PaymentModal from '@/components/PaymentModal'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Crown, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '5 000',
    amount: 5000,
    icon: Rocket,
    features: [
      'Produits illimités',
      'Reçus WhatsApp',
      'Client Doit',
      'Rapports avancés',
      'Boutique en ligne',
      'Sans publicité',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '15 000',
    amount: 15000,
    icon: ShieldCheck,
    features: [
      'Tout Starter +',
      'Multi-boutiques',
      '5 employés',
      'Analytics avancées',
      'Tontine: 5 groupes / 100 membres',
      'Support premium',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '35 000',
    amount: 35000,
    icon: Crown,
    features: [
      'Tout Business +',
      'Employés illimités',
      'Multi-succursales',
      'Domaine personnalisé',
      'Tontine illimitée + export PDF',
      'Support prioritaire 24/7',
    ],
  },
]

export default function UpgradePage() {
  const [business, setBusiness] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      setUserEmail(userData.user.email || '')
      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(id,name,business_type)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()
      const member: any = membership
      if (member?.businesses) {
        setBusiness({ ...member.businesses, id: member.business_id })
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-600">Chargement...</p>
      </main>
    )
  }

  return (
    <AppShell title="Mise à niveau" subtitle="Choisissez un plan pour votre boutique.">
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          businessId={business?.id || null}
          businessName={business?.name || ''}
          userEmail={userEmail}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      <div className="mx-auto max-w-5xl">
        {/* Boutique liée */}
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Boutique liée</p>
          <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            {business?.name || 'Aucune boutique trouvée'}
            {userEmail && <span className="ml-2 text-sm font-bold text-slate-400"> · {userEmail}</span>}
          </p>
        </div>

        {/* Promo banner */}
        <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-white shadow-xl shadow-emerald-600/20">
          <Sparkles size={18} className="shrink-0" />
          <p className="font-black">Offre de lancement : Payez 1 mois, obtenez 2 mois d'utilisation !</p>
          <Sparkles size={18} className="shrink-0" />
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white">
                  2 MOIS OFFERTS
                </div>

                <div className="mb-5 mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Icon size={26} />
                </div>

                <h3 className="text-2xl font-black text-slate-950 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-3xl font-black text-emerald-600">
                  {plan.price}{' '}
                  <span className="text-base font-bold text-slate-400">XOF/mois</span>
                </p>

                <div className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      {feature}
                    </p>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="mt-6 w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  Choisir {plan.name}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
