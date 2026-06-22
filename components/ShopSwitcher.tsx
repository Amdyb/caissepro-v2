'use client'

import { ShopOption } from '@/lib/storefront'
import { Check, ChevronDown, Store } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// A demo shop gets an orange "DÉMO" badge; every real shop gets an emerald
// "PRINCIPALE" badge — so multi-boutique users always know which is which.
export function ShopBadge({ isDemo }: { isDemo: boolean }) {
  return isDemo ? (
    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-700">
      Démo
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
      Principale
    </span>
  )
}

// Shown at the top of every storefront page so multi-boutique users always know
// which shop they are editing, and can switch. Single-shop users only see the
// "Vous personnalisez" banner (no dropdown).
export default function ShopSwitcher({
  shops,
  selectedId,
  onChange,
}: {
  shops: ShopOption[]
  selectedId: string | null
  onChange: (id: string) => void
}) {
  const current = shops.find((s) => s.id === selectedId)
  const multi = shops.length > 1
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Store size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Vous personnalisez</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-black text-slate-950">
                {current?.name || 'Ma boutique'}{current?.is_demo ? ' (DÉMO)' : ''}
              </p>
              {current && <ShopBadge isDemo={current.is_demo} />}
            </div>
          </div>
        </div>

        {multi && (
          <div ref={ref} className="relative sm:min-w-[240px]">
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-emerald-700">Boutique active</label>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-left font-black text-slate-800 outline-none focus:border-emerald-500"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{current?.name || 'Choisir'}</span>
                {current && <ShopBadge isDemo={current.is_demo} />}
              </span>
              <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                {shops.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { onChange(s.id); setOpen(false) }}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-black text-slate-800">{s.name}</span>
                      <ShopBadge isDemo={s.is_demo} />
                    </span>
                    {s.id === selectedId && <Check size={16} className="shrink-0 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
