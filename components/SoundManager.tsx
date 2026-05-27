'use client'

import { playClick, playError, playSale, playSuccess, resumeContext } from '@/lib/sounds'
import { useEffect } from 'react'

export default function SoundManager() {
  useEffect(() => {
    function initOnGesture() {
      resumeContext()
    }
    window.addEventListener('click', initOnGesture, { once: true })
    window.addEventListener('touchstart', initOnGesture, { once: true })
    window.addEventListener('keydown', initOnGesture, { once: true })

    function onSale() { playSale() }
    function onError() { playError() }
    function onClick() { playClick() }
    function onSuccess() { playSuccess() }

    window.addEventListener('play-sale', onSale)
    window.addEventListener('play-error', onError)
    window.addEventListener('play-click', onClick)
    window.addEventListener('play-success', onSuccess)

    return () => {
      window.removeEventListener('click', initOnGesture)
      window.removeEventListener('touchstart', initOnGesture)
      window.removeEventListener('keydown', initOnGesture)
      window.removeEventListener('play-sale', onSale)
      window.removeEventListener('play-error', onError)
      window.removeEventListener('play-click', onClick)
      window.removeEventListener('play-success', onSuccess)
    }
  }, [])

  return null
}
