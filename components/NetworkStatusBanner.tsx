'use client'

import { Wifi, WifiOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function NetworkStatusBanner() {
  const [online, setOnline] = useState(true)
  const [showRestored, setShowRestored] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setOnline(navigator.onLine)

    function handleOnline() {
      setOnline(true)
      setShowRestored(true)
      setDismissed(false)

      setTimeout(() => {
        setShowRestored(false)
      }, 4000)
    }

    function handleOffline() {
      setOnline(false)
      setShowRestored(false)
      setDismissed(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (dismissed) return null

  if (!online) {
    return (
      <div className="fixed inset-x-0 top-0 z-[99999] bg-red-600 px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WifiOff size={20} />
            <div>
              <p className="text-sm font-black">Connexion perdue</p>
              <p className="text-xs font-semibold text-white/85">Certaines actions peuvent échouer jusqu’au retour d’internet.</p>
            </div>
          </div>

          <button onClick={() => setDismissed(true)} className="rounded-full bg-white/15 p-2 hover:bg-white/25">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (showRestored) {
    return (
      <div className="fixed inset-x-0 top-0 z-[99999] bg-emerald-600 px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wifi size={20} />
            <div>
              <p className="text-sm font-black">Connexion rétablie</p>
              <p className="text-xs font-semibold text-white/85">Vous pouvez continuer à utiliser CaissePro normalement.</p>
            </div>
          </div>

          <button onClick={() => setShowRestored(false)} className="rounded-full bg-white/15 p-2 hover:bg-white/25">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  return null
}
