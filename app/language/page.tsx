'use client'

import AppShell from '@/components/AppShell'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

const LANGUAGES = [
  {
    code: 'fr',
    label: 'Français',
    native: 'Français',
    flag: '🇫🇷',
    description: 'Interface complète en français',
  },
  {
    code: 'wo',
    label: 'Wolof',
    native: 'Wolof',
    flag: '🇸🇳',
    description: 'Langue nationale du Sénégal',
  },
  {
    code: 'en',
    label: 'English',
    native: 'English',
    flag: '🇬🇧',
    description: 'Full English interface',
  },
]

const STORAGE_KEY = 'caissepro_language'

export default function LanguagePage() {
  const [selected, setSelected] = useState('fr')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSelected(stored)
  }, [])

  function save(code: string) {
    setSelected(code)
    localStorage.setItem(STORAGE_KEY, code)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AppShell title="Langue" subtitle="Choisissez la langue de l'interface CaissePro.">
      <div className="mx-auto max-w-lg">
        {saved && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            <Check size={16} /> Préférence de langue enregistrée.
          </div>
        )}

        <div className="space-y-3">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => save(lang.code)}
                className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-5 text-left transition ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-4xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className="text-base font-black text-slate-950">{lang.native}</p>
                  <p className="text-sm font-bold text-slate-500">{lang.description}</p>
                </div>
                {isSelected && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check size={15} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-700">Wolof et English sont en cours de traduction.</p>
          <p className="mt-1 text-xs font-bold text-amber-600">L'interface reste en français jusqu'à la disponibilité complète de la traduction.</p>
        </div>
      </div>
    </AppShell>
  )
}
