'use client'

import { DEFAULT_THEME, getThemePreference, setThemePreference } from '@/components/DarkModeProvider'
import { Clock, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type ThemePref = 'auto' | 'light' | 'dark'

// Cycle order starts at the default (dark) so the first tap moves to light.
const CYCLE: ThemePref[] = ['dark', 'light', 'auto']

const ICONS: Record<ThemePref, typeof Sun> = { auto: Clock, light: Sun, dark: Moon }
const LABELS: Record<ThemePref, string> = { auto: 'Auto', light: 'Clair', dark: 'Sombre' }

export default function DarkModeToggle({ className = '' }: { className?: string }) {
  const [pref, setPref] = useState<ThemePref>(DEFAULT_THEME)

  useEffect(() => {
    setPref((getThemePreference() as ThemePref) || DEFAULT_THEME)

    function onThemeChanged(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.preference) setPref(detail.preference)
    }
    window.addEventListener('theme-changed', onThemeChanged)
    return () => window.removeEventListener('theme-changed', onThemeChanged)
  }, [])

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(pref) + 1) % CYCLE.length]
    setPref(next)
    setThemePreference(next)
  }

  const Icon = ICONS[pref]

  return (
    <button
      onClick={cycle}
      title={`Thème : ${LABELS[pref]} — cliquer pour changer`}
      className={`flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${className}`}
    >
      <Icon size={15} />
      <span className="hidden sm:inline">{LABELS[pref]}</span>
    </button>
  )
}
