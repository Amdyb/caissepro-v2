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
      'POS complet',
      'Ventes illimitées',
      'Reçus WhatsApp automatiques',
      '3 employés',
      'Boutique en ligne',
      'Rapports basiques',
      'Mode hors ligne',
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
      '10 employés',
      'Rapports avancés',
      'Gestion fournisseurs',
      'Client Doit avancé',
      'Notifications WhatsApp',
      'QR Code boutique',
      'Parrainage',
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
      'API WhatsApp Business',
      'Multi-boutiques',
      'Support prioritaire',
      'Personnalisation complète',
      'Capital global',
      'Raccourcis personnalisés',
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

        {/* Comparison table */}
        <div className="mt-12">
          <h2 className="mb-6 text-center text-xl font-black text-slate-950 dark:text-white">Comparaison détaillée</h2>
          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-left font-black text-slate-500 dark:text-slate-400">Fonctionnalité</th>
                  {['Starter', 'Business', 'Premium'].map((name) => (
                    <th key={name} className="px-6 py-4 text-center font-black text-slate-950 dark:text-white">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Caisse POS',               starter: 'Complet',       business: 'Complet',      premium: 'Complet' },
                  { feature: 'Ventes',                   starter: 'Illimitées',    business: 'Illimitées',   premium: 'Illimitées' },
                  { feature: 'Employés',                 starter: '3',             business: '10',           premium: 'Illimités' },
                  { feature: 'Reçus WhatsApp',           starter: 'Automatiques',  business: 'Automatiques', premium: 'API Business' },
                  { feature: 'Boutique en ligne',        starter: '✓',             business: '✓',            premium: '✓' },
                  { feature: 'Mode hors ligne',          starter: '✓',             business: '✓',            premium: '✓' },
                  { feature: 'Rapports',                 starter: 'Basiques',      business: 'Avancés',      premium: 'Avancés' },
                  { feature: 'Gestion fournisseurs',     starter: '—',             business: '✓',            premium: '✓' },
                  { feature: 'Client Doit avancé',       starter: '—',             business: '✓',            premium: '✓' },
                  { feature: 'QR Code boutique',         starter: '—',             business: '✓',            premium: '✓' },
                  { feature: 'Parrainage',               starter: '—',             business: '✓',            premium: '✓' },
                  { feature: 'Multi-boutiques',          starter: '—',             business: '—',            premium: '✓' },
                  { feature: 'Raccourcis personnalisés', starter: '—',             business: '—',            premium: '✓' },
                  { feature: 'Capital global',           starter: '—',             business: '—',            premium: '✓' },
                  { feature: 'Support',                  starter: 'Standard',      business: 'Standard',     premium: 'Prioritaire' },
                ].map(({ feature, starter, business, premium }, i) => (
                  <tr key={feature} className={i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/60 dark:bg-slate-700/30'}>
                    <td className="px-6 py-3.5 font-bold text-slate-700 dark:text-slate-300">{feature}</td>
                    {[starter, business, premium].map((val, j) => (
                      <td key={j} className={`px-6 py-3.5 text-center font-semibold ${
                        val === '—' ? 'text-slate-300 dark:text-slate-600' :
                        val === '✓' ? 'text-emerald-600' :
                        'text-slate-700 dark:text-slate-300'
                      }`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
