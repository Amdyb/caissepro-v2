'use client'

import { useEffect, useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function isAppInstalled() {
  if (typeof window === 'undefined') return false

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true

  return isStandalone
}

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const installed = isAppInstalled()
    const dismissed = localStorage.getItem('caissepro-install-dismissed') === 'true'

    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)

    setIsIOS(ios)

    if (installed || dismissed) {
      setShowPrompt(false)
      return
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)

      setTimeout(() => {
        if (!isAppInstalled()) {
          setShowPrompt(true)
        }
      }, 1500)
    }

    function handleAppInstalled() {
      setShowPrompt(false)
      setInstallEvent(null)
      localStorage.setItem('caissepro-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (ios) {
      setTimeout(() => {
        if (!isAppInstalled()) {
          setShowPrompt(true)
        }
      }, 1500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function installApp() {
    if (!installEvent) return

    await installEvent.prompt()

    const choice = await installEvent.userChoice

    if (choice.outcome === 'accepted') {
      setShowPrompt(false)
      localStorage.setItem('caissepro-installed', 'true')
    } else {
      localStorage.setItem('caissepro-install-dismissed', 'true')
      setShowPrompt(false)
    }

    setInstallEvent(null)
  }

  function dismissPrompt() {
    localStorage.setItem('caissepro-install-dismissed', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-lg">
                <Smartphone size={30} />
              </div>

              <div>
                <h3 className="text-xl font-black">Installer CaissePro</h3>
                <p className="mt-1 text-sm font-semibold text-white/85">
                  Accès rapide depuis votre écran d’accueil.
                </p>
              </div>
            </div>

            <button
              onClick={dismissPrompt}
              className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {isIOS && !installEvent ? (
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Sur iPhone/iPad:
              </p>

              <ol className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                <li>1. Appuyez sur le bouton Partager dans Safari.</li>
                <li>2. Choisissez “Ajouter à l’écran d’accueil”.</li>
                <li>3. Appuyez sur “Ajouter”.</li>
              </ol>

              <button
                onClick={dismissPrompt}
                className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white"
              >
                Compris
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Utilisez CaissePro comme une vraie application: plus rapide, plus propre, sans taper l’adresse web.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={dismissPrompt}
                  className="rounded-2xl border border-slate-300 bg-white py-4 font-black text-slate-700 hover:bg-slate-50"
                >
                  Plus tard
                </button>

                <button
                  onClick={installApp}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <Download size={18} />
                  Installer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
