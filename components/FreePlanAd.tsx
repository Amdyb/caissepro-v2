'use client'

import Link from 'next/link'
import { Crown, Sparkles } from 'lucide-react'

type Props = {
  title?: string
  text?: string
}

export default function FreePlanAd({
  title = 'Passez à Business',
  text = 'Supprimez les publicités, activez votre boutique en ligne et débloquez les outils premium.'
}: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500 p-3 text-white shadow-lg shadow-amber-500/20">
            <Sparkles size={24} />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
              <Crown size={14} />
              Version gratuite
            </div>

            <h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">{text}</p>
          </div>
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-white transition hover:bg-amber-600"
        >
          <Crown size={18} />
          Upgrade
        </Link>
      </div>
    </div>
  )
}
