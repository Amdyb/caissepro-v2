'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DarkModeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('caissepro_dark_mode', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('caissepro_dark_mode', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${className}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
