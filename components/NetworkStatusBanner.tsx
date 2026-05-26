'use client'

import { getPendingCounts, syncPendingData } from '@/lib/offlineStore'
import { supabase } from '@/lib/supabaseClient'
import { RefreshCw, Wifi, WifiOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function NetworkStatusBanner() {
  const [online, setOnline] = useState(true)
  const [showRestored, setShowRestored] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncedCount, setSyncedCount] = useState(0)
  const syncingRef = useRef(false)

  async function refreshPendingCount() {
    try {
      const counts = await getPendingCounts()
      setPendingCount(counts.total)
    } catch { /* IndexedDB unavailable */ }
  }

  async function runSync() {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const result = await syncPendingData(supabase)
      if (result.synced > 0) setSyncedCount(result.synced)
      await refreshPendingCount()
    } catch { /* sync failed silently */ } finally {
      setSyncing(false)
      syncingRef.current = false
    }
  }

  useEffect(() => {
    setOnline(navigator.onLine)
    refreshPendingCount()

    function handleOnline() {
      setOnline(true)
      setShowRestored(true)
      setDismissed(false)
      runSync()
      setTimeout(() => setShowRestored(false), 5000)
    }

    function handleOffline() {
      setOnline(false)
      setShowRestored(false)
      setDismissed(false)
      setSyncedCount(0)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offline-queue-changed', refreshPendingCount)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-queue-changed', refreshPendingCount)
    }
  }, [])

  if (dismissed) return null

  if (!online) {
    return (
      <div className="fixed inset-x-0 top-0 z-[99999] bg-slate-900 px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WifiOff size={18} className="shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-black">Mode hors ligne</p>
              <p className="text-xs font-semibold text-white/70">
                Les ventes seront synchronisées automatiquement à la reconnexion.
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                    {pendingCount} en attente
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X size={14} />
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
            {syncing
              ? <RefreshCw size={18} className="shrink-0 animate-spin" />
              : <Wifi size={18} className="shrink-0" />
            }
            <div>
              <p className="text-sm font-black">Connexion rétablie</p>
              <p className="text-xs font-semibold text-white/85">
                {syncing
                  ? 'Synchronisation en cours...'
                  : syncedCount > 0
                    ? `${syncedCount} opération${syncedCount > 1 ? 's' : ''} synchronisée${syncedCount > 1 ? 's' : ''} avec succès.`
                    : 'Vous pouvez continuer à utiliser CaissePro normalement.'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowRestored(false)} className="rounded-full bg-white/15 p-2 hover:bg-white/25">
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Pending items badge when back online and banner dismissed
  if (online && pendingCount > 0) {
    return (
      <div className="fixed inset-x-0 top-0 z-[99999] bg-amber-500 px-4 py-2.5 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className={`shrink-0 ${syncing ? 'animate-spin' : ''}`} />
            <p className="text-sm font-black">
              {pendingCount} vente{pendingCount > 1 ? 's' : ''} en attente de synchronisation
            </p>
          </div>
          <button
            onClick={runSync}
            disabled={syncing}
            className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-black hover:bg-white/30 disabled:opacity-60"
          >
            {syncing ? 'Sync...' : 'Synchroniser'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
