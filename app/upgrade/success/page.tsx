'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'Pro'

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 2)
  const expiryLabel = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    let confetti: any
    import('canvas-confetti').then((module) => {
      confetti = module.default
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
      })
      setTimeout(() => confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#f59e0b'],
      }), 400)
      setTimeout(() => confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#ec4899'],
      }), 600)
    })
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-600 shadow-2xl shadow-emerald-600/30">
          <CheckCircle2 className="text-white" size={52} />
        </div>

        <h1 className="text-4xl font-black text-slate-950">Abonnement activé !</h1>

        <p className="mt-4 text-base font-semibold text-slate-500">
          Félicitations ! Votre plan{' '}
          <span className="font-black text-emerald-600">{plan}</span>{' '}
          est maintenant actif pour 2 mois.
        </p>

        <div className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm text-left space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Plan</span>
            <span className="font-black text-slate-900">{plan}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Durée</span>
            <span className="font-black text-slate-900">2 mois</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Expire le</span>
            <span className="font-black text-slate-900">{expiryLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Statut</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Actif
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Aller au tableau de bord
          <ChevronRight size={18} />
        </Link>
      </div>
    </main>
  )
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
