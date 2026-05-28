'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

export type Plan = 'free' | 'starter' | 'business' | 'premium'

const PLAN_LEVELS: Record<Plan, number> = { free: 0, starter: 1, business: 2, premium: 3 }
const PLAN_LABELS: Record<Plan, string> = { free: 'Gratuit', starter: 'Starter', business: 'Business', premium: 'Premium' }

type Props = {
  currentPlan: Plan
  requiredPlan: Plan
  feature: string
  children: ReactNode
}

export default function UpgradeGate({ currentPlan, requiredPlan, feature, children }: Props) {
  if (PLAN_LEVELS[currentPlan] >= PLAN_LEVELS[requiredPlan]) return <>{children}</>

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      <div className="pointer-events-none select-none opacity-40 blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px]">
        <div className="mx-4 flex max-w-xs flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
            <Lock className="text-amber-600" size={22} />
          </div>
          <div>
            <p className="font-black text-slate-950">{feature}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Disponible à partir du plan{' '}
              <span className="font-black text-emerald-600">{PLAN_LABELS[requiredPlan]}</span>
            </p>
          </div>
          <Link
            href="/upgrade"
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
          >
            Passer au plan {PLAN_LABELS[requiredPlan]}
          </Link>
        </div>
      </div>
    </div>
  )
}
