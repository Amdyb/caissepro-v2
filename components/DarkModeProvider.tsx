'use client'

import { useEffect } from 'react'

export default function DarkModeProvider() {
  useEffect(() => {
    const stored = localStorage.getItem('caissepro_dark_mode')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return null
}
