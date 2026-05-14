'use client'

import { getStoredLocale, locales, Locale, setStoredLocale } from '@/lib/i18n'
import { Languages } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [locale, setLocale] = useState<Locale>('fr')

  useEffect(() => {
    setLocale(getStoredLocale())

    function onLocaleChange(event: any) {
      setLocale(event.detail || getStoredLocale())
    }

    window.addEventListener('localechange', onLocaleChange)
    return () => window.removeEventListener('localechange', onLocaleChange)
  }, [])

  function changeLocale(next: Locale) {
    setLocale(next)
    setStoredLocale(next)
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm ${compact ? 'scale-90' : ''}`}>
      <Languages size={18} className="text-slate-500" />
      <select
        value={locale}
        onChange={(e) => changeLocale(e.target.value as Locale)}
        className="bg-transparent text-sm font-black text-slate-700 outline-none"
        aria-label="Language"
      >
        {locales.map((item) => (
          <option key={item.code} value={item.code}>
            {item.native}
          </option>
        ))}
      </select>
    </div>
  )
}
