'use client'

import { useEffect } from 'react'

export const THEME_KEY = 'theme-preference'

export function computeIsDark(preference: string | null): boolean {
  if (preference === 'dark') return true
  if (preference === 'light') return false
  // auto: dark between 19:00 and 06:00
  const hour = new Date().getHours()
  return hour >= 19 || hour < 6
}

export function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function getThemePreference(): string {
  if (typeof window === 'undefined') return 'auto'
  return localStorage.getItem(THEME_KEY) || 'auto'
}

export function setThemePreference(preference: 'auto' | 'light' | 'dark') {
  localStorage.setItem(THEME_KEY, preference)
  applyTheme(computeIsDark(preference))
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { preference } }))
}

export default function DarkModeProvider() {
  useEffect(() => {
    const pref = getThemePreference()
    applyTheme(computeIsDark(pref))

    // Re-evaluate auto mode every minute (catches hour boundary crossings)
    const interval = setInterval(() => {
      if (getThemePreference() === 'auto') {
        applyTheme(computeIsDark('auto'))
      }
    }, 60_000)

    // React to manual changes from other tabs/components
    function onThemeChanged() {
      applyTheme(computeIsDark(getThemePreference()))
    }
    window.addEventListener('theme-changed', onThemeChanged)

    return () => {
      clearInterval(interval)
      window.removeEventListener('theme-changed', onThemeChanged)
    }
  }, [])

  return null
}
