'use client'

import { supabase } from '@/lib/supabaseClient'
import type { AppNotification } from '@/lib/notifications'
import {
  Bell,
  CheckCheck,
  Package,
  ReceiptText,
  ShoppingBag,
  CreditCard,
  UserPlus,
  Info,
} from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'

const TYPE_ICON: Record<string, typeof Bell> = {
  sale: ReceiptText,
  order: ShoppingBag,
  low_stock: Package,
  subscription: CreditCard,
  agent: UserPlus,
  info: Info,
}

const TYPE_COLOR: Record<string, string> = {
  sale: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
  order: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400',
  low_stock: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
  subscription: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400',
  agent: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400',
  info: 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = items.filter((n) => !n.read).length

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setItems((data as AppNotification[]) || [])
    setLoading(false)
  }

  // Initial fetch for the unread badge.
  useEffect(() => {
    load()
  }, [])

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) load()
  }

  async function markRead(n: AppNotification) {
    if (n.read) return
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
  }

  async function markAllRead() {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-black text-slate-950 dark:text-white">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <CheckCheck size={14} /> Tout lire
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-bold text-slate-400">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                Aucune notification.
              </p>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICON[n.type] || Info
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/40 ${
                      n.read ? '' : 'bg-emerald-50/40 dark:bg-emerald-900/10'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${TYPE_COLOR[n.type] || TYPE_COLOR.info}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-black text-slate-950 dark:text-white">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                      </span>
                      {n.message && (
                        <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {n.message}
                        </span>
                      )}
                      <span className="mt-1 block text-[11px] font-bold text-slate-400">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(NotificationBell)
