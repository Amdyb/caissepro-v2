'use client'

import Link from 'next/link'
import { Crown, Sparkles } from 'lucide-react'

export default function FreePlanBanner() {
  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 shadow-sm">
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-lg shadow-amber-500/20">
            <Sparkles size={24} />
          </div>

          <div>
            <div className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
              Plan Gratuit
            </div>

            <h3 className="text-2xl font-black text-slate-950">
              Débloquez tout le potentiel de CaissePro
            </h3>

            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
              Passez à Starter pour supprimer les publicités, débloquer les produits illimités,
              les reçus WhatsApp et le système Client Doit.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
          >
            <Crown size={18} />
            Voir les plans
          </Link>

          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Passer à Starter
          </Link>
        </div>
      </div>
    </div>
  )
}
