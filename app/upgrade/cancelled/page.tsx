'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function UpgradeCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-100">
          <XCircle className="text-red-500" size={48} />
        </div>

        <h1 className="text-4xl font-black text-slate-950">Paiement annulé</h1>

        <p className="mt-4 text-base font-semibold text-slate-500">
          Vous avez annulé le paiement. Votre abonnement n'a pas été modifié.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/upgrade"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Réessayer le paiement
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-base font-black text-slate-700 transition hover:bg-slate-50"
          >
            Retour au tableau de bord
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Des questions ? Contactez-nous sur WhatsApp au +221 78 458 11 11
        </p>
      </div>
    </main>
  )
}
