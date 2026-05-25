'use client'

import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import { CSSProperties, useCallback, useEffect, useState } from 'react'

const TOUR_KEY = 'caissepro_tour_done'

type Step = { id: string; title: string; desc: string; position: 'bottom' | 'top' }

const STEPS: Step[] = [
  {
    id: 'tour-stats',
    title: "Vue d'ensemble",
    desc: "Vos ventes du jour, de la semaine, le stock critique et les créances clients — tout en un coup d'oeil.",
    position: 'bottom',
  },
  {
    id: 'tour-vendre-fab',
    title: 'Vendre en 1 clic',
    desc: "Ce bouton flottant ouvre la caisse depuis n'importe quelle page. Rapide et toujours accessible.",
    position: 'top',
  },
  {
    id: 'tour-nav-products',
    title: 'Gérer vos produits',
    desc: 'Ajoutez, modifiez et archivez vos produits. Le stock se met à jour automatiquement après chaque vente.',
    position: 'bottom',
  },
  {
    id: 'tour-nav-sales',
    title: 'Historique des ventes',
    desc: 'Retrouvez toutes vos ventes, imprimez les reçus et envoyez-les directement par WhatsApp.',
    position: 'bottom',
  },
  {
    id: 'tour-nav-storefront',
    title: 'Boutique en ligne',
    desc: 'Votre vitrine publique avec un lien partageable et QR code. Vos clients commandent via WhatsApp.',
    position: 'bottom',
  },
]

type Rect = { top: number; left: number; width: number; height: number }

function getTargetRect(id: string): Rect | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(id)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const PAD = 10
const TOOLTIP_W = 290

export default function TutorialTour() {
  const [welcome, setWelcome] = useState(false)
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    if (!localStorage.getItem(TOUR_KEY)) setWelcome(true)

    function onRestart() {
      localStorage.removeItem(TOUR_KEY)
      setStep(0)
      setActive(false)
      setWelcome(true)
    }
    window.addEventListener('restart-tour', onRestart)
    return () => window.removeEventListener('restart-tour', onRestart)
  }, [])

  const refreshRect = useCallback(() => {
    if (!active) return
    setRect(getTargetRect(STEPS[step].id))
  }, [active, step])

  useEffect(() => {
    refreshRect()
    window.addEventListener('resize', refreshRect)
    window.addEventListener('scroll', refreshRect, true)
    return () => {
      window.removeEventListener('resize', refreshRect)
      window.removeEventListener('scroll', refreshRect, true)
    }
  }, [refreshRect])

  function startTour() {
    setWelcome(false)
    setStep(0)
    setActive(true)
    setTimeout(() => setRect(getTargetRect(STEPS[0].id)), 150)
  }

  function close() {
    localStorage.setItem(TOUR_KEY, '1')
    setWelcome(false)
    setActive(false)
  }

  function goNext() {
    if (step < STEPS.length - 1) {
      const next = step + 1
      setStep(next)
      setTimeout(() => setRect(getTargetRect(STEPS[next].id)), 80)
    } else {
      close()
    }
  }

  function goPrev() {
    if (step > 0) {
      const prev = step - 1
      setStep(prev)
      setTimeout(() => setRect(getTargetRect(STEPS[prev].id)), 80)
    }
  }

  function tooltipStyle(): CSSProperties {
    if (!rect) return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    const center = rect.left + rect.width / 2
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800
    const left = Math.min(Math.max(center - TOOLTIP_W / 2, 12), vw - TOOLTIP_W - 12)
    if (STEPS[step].position === 'top') {
      return { position: 'fixed', top: Math.max(rect.top - 190 - PAD, 12), left }
    }
    return { position: 'fixed', top: rect.top + rect.height + PAD + 8, left }
  }

  return (
    <>
      {welcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600">
              <Sparkles className="text-white" size={26} />
            </div>
            <h2 className="text-2xl font-black text-slate-950">Bienvenue sur CaissePro !</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              Voulez-vous faire une rapide visite des fonctionnalités clés ? Cela prend moins d'une minute.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={startTour}
                className="rounded-2xl bg-emerald-600 py-4 font-black text-white transition hover:bg-emerald-700"
              >
                Commencer la visite
              </button>
              <button
                onClick={close}
                className="rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Passer pour l'instant
              </button>
              <button onClick={close} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                Ne plus afficher
              </button>
            </div>
          </div>
        </div>
      )}

      {active && (
        <>
          {rect && (
            <div
              className="pointer-events-none fixed z-[150]"
              style={{
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                borderRadius: 16,
                border: '2px solid #16a34a',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
              }}
            />
          )}

          <div
            className="fixed z-[160] rounded-[1.5rem] bg-white p-6 shadow-2xl"
            style={{ ...tooltipStyle(), width: TOOLTIP_W }}
          >
            <div className="mb-3 flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: i === step ? 24 : 8, backgroundColor: i === step ? '#16a34a' : '#e2e8f0' }}
                />
              ))}
            </div>

            <h3 className="text-base font-black text-slate-950">{STEPS[step].title}</h3>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-500">{STEPS[step].desc}</p>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={step === 0}
                className="flex items-center gap-1 text-sm font-black text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
              >
                <ChevronLeft size={15} /> Précédent
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={close}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50"
                >
                  <X size={13} />
                </button>
                <button
                  onClick={goNext}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  {step < STEPS.length - 1 ? (
                    <><span>Suivant</span><ChevronRight size={13} /></>
                  ) : (
                    <span>Terminer</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
