'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isInstalled() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

function getSnoozedUntil(): number {
  try {
    return Number(localStorage.getItem('caissepro-install-snooze') || '0')
  } catch {
    return 0
  }
}

function setSnoozeDays(days: number) {
  try {
    localStorage.setItem('caissepro-install-snooze', String(Date.now() + days * 86_400_000))
  } catch {}
}

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [mounted, setMounted] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (isInstalled() || getSnoozedUntil() > Date.now()) return

    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream
    setIsIOS(ios)

    function show() {
      if (isInstalled() || getSnoozedUntil() > Date.now()) return
      setMounted(true)
      // double rAF so the browser has painted the initial (offscreen) state before animating
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)))
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      clearTimeout(timer.current)
      timer.current = setTimeout(show, 600)
    }

    function onInstalled() {
      slideOut()
      setSnoozeDays(365)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    if (ios) {
      timer.current = setTimeout(show, 600)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      clearTimeout(timer.current)
    }
  }, [])

  function slideOut(cb?: () => void) {
    setAnimateIn(false)
    setTimeout(() => {
      setMounted(false)
      cb?.()
    }, 320)
  }

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    setSnoozeDays(outcome === 'accepted' ? 365 : 7)
    setInstallEvent(null)
    slideOut()
  }

  function dismiss() {
    setSnoozeDays(3)
    slideOut()
  }

  function close() {
    setSnoozeDays(7)
    slideOut()
  }

  if (!mounted) return null

  return (
    <div
      aria-live="polite"
      role="dialog"
      aria-label="Installer CaissePro"
      className="fixed inset-x-0 bottom-0 z-[9999] p-3 sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm"
      style={{
        transform: animateIn ? 'translateY(0)' : 'translateY(calc(100% + 12px))',
        opacity: animateIn ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease',
        willChange: 'transform, opacity',
      }}
    >
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">

        {/* Coloured header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-5 py-4">
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition-colors hover:bg-white/25"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>

          <div className="flex items-center gap-3.5 pr-9">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-md">
              <img src="/icons/caissepro-icon.svg" alt="" className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                Application mobile
              </p>
              <h3 className="text-lg font-black leading-tight text-white">Installer CaissePro</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-4">
          {isIOS && !installEvent ? (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                3 étapes sur iPhone / iPad
              </p>
              <div className="space-y-2">
                {([
                  ['⬆️', 'Appuyez sur', 'Partager', 'dans Safari'],
                  ['➕', 'Choisissez', "Sur l'écran d'accueil", ''],
                  ['✅', 'Appuyez sur', 'Ajouter', ''],
                ] as const).map(([icon, pre, bold, post], i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-lg leading-none">{icon}</span>
                    <p className="text-sm text-slate-600">
                      {pre} <span className="font-black text-slate-950">{bold}</span> {post}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={dismiss}
                className="mt-4 w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-black text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Compris !
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 space-y-1.5">
                {([
                  ['⚡', "Accès instantané depuis l'écran d'accueil"],
                  ['📶', 'Fonctionne avec connexion lente ou nulle'],
                  ['🔒', 'Sécurisé et toujours à jour'],
                ] as const).map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <span className="text-base leading-none">{icon}</span>
                    <p className="text-sm font-semibold text-slate-700">{text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={dismiss}
                  className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-black text-slate-600 transition-colors hover:bg-slate-50 active:scale-[0.98]"
                >
                  Plus tard
                </button>
                <button
                  onClick={install}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <Download size={15} />
                  Installer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
