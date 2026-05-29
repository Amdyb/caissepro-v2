'use client'

import { PLAN_LIMITS, PlanFeature, PlanName, canAccessFeature } from '@/lib/plans'
import { Lock, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'

export type Plan = PlanName

const PLAN_LABELS: Record<PlanName, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  business: 'Business',
  premium: 'Premium',
}

function getRequiredPlanLabel(feature: PlanFeature): string {
  const order: PlanName[] = ['free', 'starter', 'business', 'premium']
  for (const plan of order) {
    if (canAccessFeature(plan, feature)) return PLAN_LABELS[plan]
  }
  return 'Premium'
}

type Props = {
  currentPlan: PlanName
  feature: PlanFeature
  children: ReactNode
  popup?: boolean
}

export default function UpgradeGate({ currentPlan, feature, children, popup = false }: Props) {
  const [showModal, setShowModal] = useState(false)

  const hasAccess = canAccessFeature(currentPlan, feature)

  if (hasAccess) return <>{children}</>

  const requiredLabel = getRequiredPlanLabel(feature)

  if (popup) {
    return (
      <>
        <div onClick={() => setShowModal(true)} className="cursor-pointer">
          {children}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-3xl">
                  🚀
                </div>
                <h2 className="text-xl font-black text-slate-950">Votre business mérite mieux 🚀</h2>
                <p className="text-sm font-semibold text-slate-500">
                  Passez à un plan supérieur pour débloquer cette fonctionnalité et commencer à vendre plus.
                </p>
                <Link
                  href="/upgrade"
                  className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  Voir les plans
                </Link>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      <div className="pointer-events-none select-none opacity-40 blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px]">
        <div className="mx-4 flex max-w-xs flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
            <Lock className="text-amber-600" size={22} />
          </div>
          <div>
            <p className="font-black text-slate-950">Fonctionnalité verrouillée</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Disponible à partir du plan{' '}
              <span className="font-black text-emerald-600">{requiredLabel}</span>
            </p>
          </div>
          <Link
            href="/upgrade"
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
          >
            Passer au plan {requiredLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
