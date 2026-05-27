'use client'

import AppShell from '@/components/AppShell'
import PaymentModal from '@/components/PaymentModal'
import { supabase } from '@/lib/supabaseClient'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Rocket,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const PLAN_LEVELS: Record<string, number> = { free: 0, starter: 1, business: 2, premium: 3 }

const PLAN_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  free:     { label: 'Gratuit',  color: 'text-slate-600',   bg: 'bg-slate-100',   icon: null },
  starter:  { label: 'Starter',  color: 'text-blue-700',    bg: 'bg-blue-100',    icon: Rocket },
  business: { label: 'Business', color: 'text-violet-700',  bg: 'bg-violet-100',  icon: ShieldCheck },
  premium:  { label: 'Premium',  color: 'text-amber-700',   bg: 'bg-amber-100',   icon: Crown },
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    '10 produits maximum',
    '1 employé',
    'Caisse POS complète',
    'Mode hors ligne',
    'Reçus manuels',
  ],
  starter: [
    '500 produits',
    '3 employés',
    'Ventes illimitées',
    'Reçus WhatsApp automatiques',
    'Boutique en ligne',
    'Rapports basiques',
    'Mode hors ligne',
  ],
  business: [
    '5 000 produits',
    '10 employés',
    'Tout Starter inclus',
    'Rapports avancés',
    'Gestion fournisseurs',
    'Client Doit avancé',
    'QR Code boutique',
    'Parrainage',
    'Notifications WhatsApp',
  ],
  premium: [
    'Produits illimités',
    'Employés illimités',
    'Tout Business inclus',
    'API WhatsApp Business',
    'Multi-boutiques',
    'Support prioritaire',
    'Personnalisation complète',
    'Capital global',
  ],
}

const UPGRADE_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '5 000',
    amount: 5000,
    icon: Rocket,
    features: PLAN_FEATURES.starter,
  },
  {
    id: 'business',
    name: 'Business',
    price: '15 000',
    amount: 15000,
    icon: ShieldCheck,
    features: PLAN_FEATURES.business,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '35 000',
    amount: 35000,
    icon: Crown,
    features: PLAN_FEATURES.premium,
  },
]

type UpgradeRequest = {
  id: string
  plan: string
  price: string
  status: string
  created_at: string
}

type Subscription = {
  plan: string
  status: string
  expires_at: string | null
  started_at: string | null
}

export default function SubscriptionPage() {
  const [business, setBusiness] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [history, setHistory] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<typeof UPGRADE_PLANS[0] | null>(null)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      setUserEmail(userData.user.email || '')

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(id, name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership
      if (!member) { setLoading(false); return }

      const bizId = member.business_id
      setBusiness({ id: bizId, name: member.businesses?.name || '' })

      const [subResult, histResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('plan, status, expires_at, started_at')
          .eq('business_id', bizId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('upgrade_requests')
          .select('id, plan, price, status, created_at')
          .eq('business_id', bizId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (subResult.data) setSubscription(subResult.data)
      if (histResult.data) setHistory(histResult.data)

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

  const currentPlan = subscription?.plan || 'free'
  const currentLevel = PLAN_LEVELS[currentPlan] ?? 0
  const meta = PLAN_META[currentPlan] || PLAN_META.free
  const PlanIcon = meta.icon
  const exp = subscription?.expires_at
  const days = exp ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000) : null
  const isActive = !!subscription && currentPlan !== 'free'
  const isExpired = isActive && days !== null && days <= 0

  const statusColor = !isActive
    ? 'text-slate-500'
    : isExpired
    ? 'text-red-600'
    : days !== null && days <= 30
    ? 'text-amber-600'
    : 'text-emerald-600'

  const statusBg = !isActive
    ? 'bg-slate-50 border-slate-200'
    : isExpired
    ? 'bg-red-50 border-red-200'
    : days !== null && days <= 30
    ? 'bg-amber-50 border-amber-200'
    : 'bg-emerald-50 border-emerald-200'

  const plansToShow = UPGRADE_PLANS.filter((p) => PLAN_LEVELS[p.id] > currentLevel)
  const canRenew = isActive && currentPlan !== 'free'
  const renewPlan = UPGRADE_PLANS.find((p) => p.id === currentPlan)

  const statusBadgeText = !isActive
    ? 'Plan gratuit'
    : isExpired
    ? 'Expiré'
    : `${days} jour${days !== 1 ? 's' : ''} restants`

  return (
    <AppShell title="Mon abonnement" subtitle="Gérez votre plan et votre historique de paiements.">
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          businessId={business?.id || null}
          businessName={business?.name || ''}
          userEmail={userEmail}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      <div className="mx-auto max-w-4xl space-y-8">

        {/* Current plan card */}
        <div className={`rounded-[2rem] border p-6 ${statusBg}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {PlanIcon ? (
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bg}`}>
                  <PlanIcon size={26} className={meta.color} />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Sparkles size={26} className="text-slate-400" />
                </div>
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Plan actuel</p>
                <h2 className="text-3xl font-black text-slate-950 dark:text-white">{meta.label}</h2>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-black ${
                !isActive ? 'bg-slate-200 text-slate-600' :
                isExpired ? 'bg-red-100 text-red-700' :
                days !== null && days <= 30 ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {isExpired ? <XCircle size={14} /> : isActive ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                {statusBadgeText}
              </span>
            </div>
          </div>

          {isActive && !isExpired && exp && (
            <div className="mt-5 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <CalendarDays size={15} />
                Expire le {new Date(exp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {subscription?.started_at && (
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Clock size={15} />
                  Depuis le {new Date(subscription.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          )}

          {isExpired && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle size={16} />
              Votre abonnement a expiré. Renouvelez pour continuer à utiliser toutes les fonctionnalités.
            </div>
          )}
        </div>

        {/* Included features */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">Inclus dans votre plan</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {(PLAN_FEATURES[currentPlan] || PLAN_FEATURES.free).map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Renew current plan */}
        {canRenew && renewPlan && (
          <div className="flex items-center justify-between rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div>
              <p className="font-black text-emerald-800 dark:text-emerald-300">Renouveler votre abonnement</p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-600">
                {renewPlan.price} XOF/mois — Offre : payez 1 mois, obtenez 2 mois
              </p>
            </div>
            <button
              onClick={() => setSelectedPlan(renewPlan)}
              className="shrink-0 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow hover:bg-emerald-700"
            >
              Renouveler
            </button>
          </div>
        )}

        {/* Upgrade options */}
        {plansToShow.length > 0 && (
          <div>
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-lg shadow-emerald-600/20">
              <Sparkles size={16} className="shrink-0" />
              <p className="font-black">Offre de lancement : Payez 1 mois, obtenez 2 mois d'utilisation !</p>
            </div>

            <div className={`grid gap-6 ${plansToShow.length === 1 ? 'md:grid-cols-1 max-w-sm' : plansToShow.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
              {plansToShow.map((plan) => {
                const Icon = plan.icon
                return (
                  <div
                    key={plan.id}
                    className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white">
                      2 MOIS OFFERTS
                    </div>
                    <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white">{plan.name}</h3>
                    <p className="mt-1 text-2xl font-black text-emerald-600">
                      {plan.price} <span className="text-sm font-bold text-slate-400">XOF/mois</span>
                    </p>
                    <div className="mt-4 space-y-2">
                      {plan.features.slice(0, 5).map((f) => (
                        <p key={f} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                          {f}
                        </p>
                      ))}
                      {plan.features.length > 5 && (
                        <p className="text-xs font-bold text-slate-400">+ {plan.features.length - 5} autres fonctionnalités</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="mt-5 w-full rounded-2xl bg-emerald-600 py-3.5 font-black text-white shadow hover:bg-emerald-700"
                    >
                      Passer à {plan.name}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment history */}
        {history.length > 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-700">
              <h3 className="font-black text-slate-950 dark:text-white">Historique des demandes</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {history.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-black text-slate-950 dark:text-white">Plan {req.plan}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-400">
                      {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {req.price && <> · {req.price}</>}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {req.status === 'approved' ? 'Approuvé' : req.status === 'rejected' ? 'Rejeté' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && currentPlan === 'free' && (
          <p className="text-center text-sm font-semibold text-slate-400">Aucun historique de paiement.</p>
        )}
      </div>
    </AppShell>
  )
}
