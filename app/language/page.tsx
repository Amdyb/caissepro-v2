'use client'

import AppShell from '@/components/AppShell'
import { Check, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const LANGUAGES = [
  { code: 'fr', label: 'Français', native: 'Français', flag: '🇫🇷', description: 'Interface complète en français' },
  { code: 'wo', label: 'Wolof', native: 'Wolof', flag: '🇸🇳', description: 'Langue nationale du Sénégal' },
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', description: 'Full English interface' },
]

const LANG_KEY = 'caissepro_language'
const DARK_KEY = 'caissepro_dark_mode'

export default function LanguagePage() {
  const [selected, setSelected] = useState('fr')
  const [saved, setSaved] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const storedLang = localStorage.getItem(LANG_KEY)
    if (storedLang) setSelected(storedLang)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function saveLang(code: string) {
    setSelected(code)
    localStorage.setItem(LANG_KEY, code)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggleDark() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem(DARK_KEY, 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem(DARK_KEY, 'light')
    }
  }

  return (
    <AppShell title="Langue & Affichage" subtitle="Préférences d'interface de CaissePro.">
      <div className="mx-auto max-w-lg space-y-5">
        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Check size={16} /> Préférence de langue enregistrée.
          </div>
        )}

        {/* Dark mode card */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-5 text-xl font-black text-slate-950 dark:text-white">Mode d'affichage</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { if (dark) toggleDark() }}
              className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition ${
                !dark
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500'
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${!dark ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-600 dark:text-slate-300'}`}>
                <Sun size={24} />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-950 dark:text-white">Mode clair</p>
                <p className="text-xs font-bold text-slate-400">Interface lumineuse</p>
              </div>
              {!dark && <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={13} /></div>}
            </button>

            <button
              onClick={() => { if (!dark) toggleDark() }}
              className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition ${
                dark
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700'
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-slate-700 text-violet-400' : 'bg-slate-100 text-slate-400'}`}>
                <Moon size={24} />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-950 dark:text-white">Mode sombre</p>
                <p className="text-xs font-bold text-slate-400">Interface noire</p>
              </div>
              {dark && <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={13} /></div>}
            </button>
          </div>
          <p className="mt-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
            Vous pouvez aussi basculer via le bouton <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 dark:border-slate-600"><Moon size={11} /></span> dans l'en-tête.
          </p>
        </div>

        {/* Language selector */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-5 text-xl font-black text-slate-950 dark:text-white">Langue</h2>
          <div className="space-y-3">
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code
              return (
                <button
                  key={lang.code}
                  onClick={() => saveLang(lang.code)}
                  className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-5 text-left transition ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="text-4xl">{lang.flag}</span>
                  <div className="flex-1">
                    <p className="text-base font-black text-slate-950 dark:text-white">{lang.native}</p>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{lang.description}</p>
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
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm font-black text-amber-700 dark:text-amber-400">Wolof et English sont en cours de traduction.</p>
            <p className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-500">L'interface reste en français jusqu'à la disponibilité complète de la traduction.</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
