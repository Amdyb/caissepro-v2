'use client'

import { supabase } from '@/lib/supabaseClient'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

const DURATION_OPTIONS = [
  { label: '1 mois',  months: 1 },
  { label: '2 mois',  months: 2 },
  { label: '3 mois',  months: 3 },
  { label: '6 mois',  months: 6 },
  { label: '12 mois', months: 12 },
]

type UpgradeRequest = {
  id: string
  business_id: string
  business_name: string | null
  user_email: string | null
  plan: string
  price: string | null
  status: string | null
  whatsapp_sent: boolean | null
  created_at: string
  approved_at: string | null
  rejected_at: string | null
}

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminUpgradeRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<Record<string, number>>({})

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      if (!ADMIN_EMAILS.includes(userData.user.email || '')) {
        // Allow managers explicitly granted the subscription-approval permission
        const { data: perm } = await supabase
          .from('business_members')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('can_approve_subscriptions', true)
          .limit(1)
          .maybeSingle()
        if (!perm) { router.push('/dashboard'); return }
      }
      await loadRequests()
    }
    init()
  }, [router])

  async function loadRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('upgrade_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      setMessage({ text: error.message, ok: false })
    } else {
      setRequests((data || []) as UpgradeRequest[])
    }
    setLoading(false)
  }

  function getDuration(id: string) {
    return selectedDuration[id] ?? 2
  }

  async function approveRequest(request: UpgradeRequest) {
    const months = getDuration(request.id)
    const now = new Date()
    const expiresAt = addMonths(now, months)

    setApprovingId(request.id)
    setMessage(null)

    await supabase.from('subscriptions').delete().eq('business_id', request.business_id)
    const { error: subError } = await supabase.from('subscriptions').insert({
      business_id: request.business_id,
      plan: request.plan.toLowerCase(),
      status: 'active',
      starts_at: now.toISOString(),
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    if (subError) {
      setMessage({ text: subError.message, ok: false })
      setApprovingId(null)
      return
    }

    await supabase.from('businesses').update({ plan: request.plan.toLowerCase() }).eq('id', request.business_id)

    await supabase
      .from('upgrade_requests')
      .update({ status: 'approved', approved_at: now.toISOString() })
      .eq('id', request.id)

    setRequests((prev) =>
      prev.map((r) => r.id === request.id ? { ...r, status: 'approved', approved_at: now.toISOString() } : r)
    )
    setMessage({ text: `Plan ${request.plan} approuve pour ${request.business_name || 'cette boutique'} — expire le ${expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`, ok: true })
    setApprovingId(null)
  }

  async function rejectRequest(request: UpgradeRequest) {
    if (!confirm('Rejeter cette demande ?')) return

    const { error } = await supabase
      .from('upgrade_requests')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', request.id)

    if (error) { setMessage({ text: error.message, ok: false }); return }

    setRequests((prev) =>
      prev.map((r) => r.id === request.id ? { ...r, status: 'rejected' } : r)
    )
    setMessage({ text: 'Demande rejetee.', ok: false })
  }

  const filtered = requests.filter((r) => {
    if (tab === 'pending')  return !r.status || r.status === 'pending'
    if (tab === 'approved') return r.status === 'approved'
    if (tab === 'rejected') return r.status === 'rejected'
    return true
  })

  const pendingCount  = requests.filter((r) => !r.status || r.status === 'pending').length
  const approvedCount = requests.filter((r) => r.status === 'approved').length
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'pending',  label: 'En attente', count: pendingCount },
    { key: 'approved', label: 'Approuvees',  count: approvedCount },
    { key: 'rejected', label: 'Rejetees',   count: rejectedCount },
    { key: 'all',      label: 'Toutes',     count: requests.length },
  ]

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Admin</p>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Demandes d'abonnement</h1>
          </div>
          <button
            onClick={loadRequests}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-3xl font-black text-amber-700 dark:text-amber-400">{pendingCount}</p>
            <p className="mt-1 text-xs font-black uppercase text-amber-600">En attente</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{approvedCount}</p>
            <p className="mt-1 text-xs font-black uppercase text-emerald-600">Approuvees</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-3xl font-black text-red-700 dark:text-red-400">{rejectedCount}</p>
            <p className="mt-1 text-xs font-black uppercase text-red-600">Rejetees</p>
          </div>
        </div>

        {/* Feedback */}
        {message && (
          <div className={`mb-5 rounded-2xl p-4 text-sm font-bold ${message.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-black transition ${
                tab === key
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  tab === key ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-black text-slate-400">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-600 dark:bg-slate-800">
            <Clock className="mx-auto text-slate-300" size={40} />
            <p className="mt-4 font-black text-slate-400">Aucune demande</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const isPending = !req.status || req.status === 'pending'
              const isApproved = req.status === 'approved'
              const duration = getDuration(req.id)

              return (
                <div key={req.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-slate-950 dark:text-white">
                          {req.business_name || 'Boutique'}
                        </p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          isApproved ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {isApproved ? 'Approuve' : req.status === 'rejected' ? 'Rejete' : 'En attente'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {req.user_email || '—'} · Plan <span className="font-black text-slate-700 dark:text-slate-200">{req.plan}</span>
                        {req.price ? ` · ${req.price}` : ''}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Demande le {fmtDate(req.created_at)}
                        {isApproved && req.approved_at && ` · Approuve le ${fmtDate(req.approved_at)}`}
                        {req.status === 'rejected' && req.rejected_at && ` · Rejete le ${fmtDate(req.rejected_at)}`}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-slate-300 dark:text-slate-600">
                        ID {req.id.slice(0, 12)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {req.user_email && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${req.business_name || ''}, votre demande de plan ${req.plan} CaissePro a ete validee. Bonne continuation !`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          <ExternalLink size={12} />
                          WhatsApp
                        </a>
                      )}

                      {isPending && (
                        <>
                          {/* Duration picker */}
                          <select
                            value={duration}
                            onChange={(e) => setSelectedDuration((prev) => ({ ...prev, [req.id]: Number(e.target.value) }))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                          >
                            {DURATION_OPTIONS.map((opt) => (
                              <option key={opt.months} value={opt.months}>{opt.label}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => approveRequest(req)}
                            disabled={approvingId === req.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={13} />
                            {approvingId === req.id ? 'En cours...' : `Approuver (${duration} mois)`}
                          </button>

                          <button
                            onClick={() => rejectRequest(req)}
                            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <XCircle size={13} />
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
