'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { generateUniqueSlug } from '@/lib/generateUniqueSlug'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Store, Lock, Sparkles, ArrowRight } from 'lucide-react'

const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: 'retail', label: 'Commerce & Boutique' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'beauty', label: 'Salon & Beauté' },
  { value: 'pharmacy', label: 'Pharmacie' },
  { value: 'garage', label: 'Garage & Auto' },
  { value: 'btp', label: 'BTP & Services' },
  { value: 'tontine', label: 'Tontine' },
  { value: 'rental', label: 'Location & Immobilier' },
  { value: 'wholesale', label: 'Grossiste' },
  { value: 'laundry', label: 'Laverie & Pressing' },
]

const SELECTED_BIZ_KEY = 'caissepro_selected_business_id'

export default function CreateBusinessPage() {
  const router = useRouter()
  const { plan, allBusinesses, loading } = useBusinessData()
  const [name, setName] = useState('')
  const [type, setType] = useState('retail')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isPremium = plan === 'premium'
  const shopCount = allBusinesses.length

  async function handleCreate() {
    setError('')
    if (!name.trim()) { setError('Entrez le nom de la boutique.'); return }
    if (shopCount >= 5) { setError('Vous avez atteint la limite de 5 boutiques.'); return }

    setSubmitting(true)
    try {
      const slug = await generateUniqueSlug(name)
      const { data, error: rpcError } = await supabase.rpc('create_additional_business', {
        p_name: name.trim(),
        p_type: type,
        p_slug: slug,
      })
      if (rpcError) throw new Error(rpcError.message)

      const newId = data as string
      // switch the app to the new shop and send to onboarding
      if (typeof window !== 'undefined') localStorage.setItem(SELECTED_BIZ_KEY, newId)
      router.push('/onboarding')
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la création de la boutique.')
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Nouvelle boutique" subtitle="Créez une boutique supplémentaire pour votre compte Premium.">
      <div className="mx-auto max-w-lg">
        {!loading && !isPremium ? (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
            <Lock className="mx-auto h-8 w-8 text-amber-500" />
            <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">Fonctionnalité Premium</h2>
            <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              La gestion de plusieurs boutiques est réservée au plan Premium. Passez à Premium pour créer jusqu'à 5 boutiques.
            </p>
            <a href="/upgrade" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">
              <Sparkles className="h-4 w-4" /> Passer à Premium
            </a>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 dark:bg-emerald-950/50"><Store className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">Boutique {shopCount + 1} / 5</p>
                <p className="text-xs font-bold text-slate-400">Chaque boutique a ses propres produits, ventes et employés.</p>
              </div>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{error}</div>}

            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Nom de la boutique</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boutique Médina"
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Type d'activité</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mb-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <button
              onClick={handleCreate}
              disabled={submitting || shopCount >= 5}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Création...' : <>Créer la boutique <ArrowRight className="h-4 w-4" /></>}
            </button>

            {shopCount >= 5 && <p className="mt-3 text-center text-xs font-bold text-amber-600">Limite de 5 boutiques atteinte.</p>}
          </div>
        )}
      </div>
    </AppShell>
  )
}
