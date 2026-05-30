'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'

export default function UpgradeSuccessPage() {
  const [confetti, setConfetti] = useState<{ id: number; left: string; color: string; delay: string; duration: string }[]>([])

  useEffect(() => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    setConfetti(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: `${Math.random() * 1.5}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
      }))
    )
  }, [])

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 2)
  const expiryLabel = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-50 px-6">
      {/* Confetti */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute top-0 h-3 w-1.5 rounded-full opacity-0"
            style={{
              left: c.left,
              backgroundColor: c.color,
              animationName: 'confettiFall',
              animationDuration: c.duration,
              animationDelay: c.delay,
              animationTimingFunction: 'ease-in',
              animationFillMode: 'forwards',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-600 shadow-2xl shadow-emerald-600/40">
          <CheckCircle2 className="text-white" size={48} />
        </div>

        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-700">
          <Sparkles size={12} />
          Paiement confirmé
        </div>

        <h1 className="mt-4 text-4xl font-black text-slate-950">
          Votre abonnement<br />est activé !
        </h1>

        <p className="mt-4 text-base font-semibold text-slate-500">
          Profitez de toutes les fonctionnalités CaissePro<br />
          jusqu'au <span className="font-black text-slate-800">{expiryLabel}</span>
        </p>

        <div className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Durée</span>
            <span className="font-black text-slate-900">2 mois</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-500">Expire le</span>
            <span className="font-black text-slate-900">{expiryLabel}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
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
          Accéder au tableau de bord
          <ChevronRight size={18} />
        </Link>

        <Link
          href="/upgrade"
          className="mt-3 inline-block text-sm font-bold text-slate-400 hover:text-slate-600"
        >
          Voir les autres plans
        </Link>
      </div>
    </main>
  )
}
