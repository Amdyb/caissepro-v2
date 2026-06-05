'use client'

import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <AppShell title="Chantiers" subtitle="Gestion des chantiers BTP">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <Clock size={36} className="text-yellow-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Fonctionnalité disponible bientôt</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            La gestion des chantiers est en cours de développement.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow transition hover:bg-emerald-700"
        >
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
      </div>
    </AppShell>
  )
}
