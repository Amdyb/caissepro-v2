'use client'

import { playClick, playError, playSale, playSuccess, resumeContext } from '@/lib/sounds'
import { useEffect } from 'react'

export default function SoundManager() {
  useEffect(() => {
    // Resume the shared AudioContext on first user gesture (browser autoplay policy)
    function initOnGesture() {
      resumeContext()
    }
    window.addEventListener('click', initOnGesture, { once: true })
    window.addEventListener('touchstart', initOnGesture, { once: true })
    window.addEventListener('keydown', initOnGesture, { once: true })

    const handlers: Array<[string, EventListener]> = [
      ['play-sale', playSale as EventListener],
      ['play-error', playError as EventListener],
      ['play-click', playClick as EventListener],
      ['play-success', playSuccess as EventListener],
    ]
    handlers.forEach(([event, fn]) => window.addEventListener(event, fn))

    return () => {
      window.removeEventListener('click', initOnGesture)
      window.removeEventListener('touchstart', initOnGesture)
      window.removeEventListener('keydown', initOnGesture)
      handlers.forEach(([event, fn]) => window.removeEventListener(event, fn))
    }
  }, [])

  return null
}
