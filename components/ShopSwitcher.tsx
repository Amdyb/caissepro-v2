'use client'

import { ShopOption } from '@/lib/storefront'
import { Store } from 'lucide-react'

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

  return (
    <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Store size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Vous personnalisez</p>
            <p className="text-lg font-black text-slate-950">{current?.name || 'Ma boutique'}</p>
          </div>
        </div>

        {multi && (
          <div className="sm:min-w-[220px]">
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-emerald-700">Boutique active</label>
            <select
              value={selectedId || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-2xl border border-emerald-300 bg-white px-4 py-3 font-black text-slate-800 outline-none focus:border-emerald-500"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
