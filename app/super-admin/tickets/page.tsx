'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext } from '@/lib/superAdmin'
import {
  TICKET_CATEGORIES,
  TICKET_STATUS_META,
  TICKET_STATUS_ORDER,
  categoryLabel,
  statusMeta,
  type SupportTicket,
  type TicketReply,
  type TicketStatus,
} from '@/lib/tickets'
import { AlertTriangle, ArrowLeft, Clock, Inbox, Loader2, RefreshCw, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Admin = { user_id: string | null; name: string | null; email: string }

const STATUS_RANK: Record<string, number> = { open: 0, en_cours: 1, resolu: 2, ferme: 3 }

export default function SuperAdminTicketsPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [tab, setTab] = useState<'all' | TicketStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [me, setMe] = useState<{ id: string | null; name: string }>({ id: null, name: 'Support' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const ctx = await getAdminContext()
    const { data: userData } = await supabase.auth.getUser()
    setMe({ id: userData.user?.id || null, name: ctx?.email?.split('@')[0] || 'Support' })

    const [tRes, aRes] = await Promise.all([
      supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }).limit(1000),
      supabase.from('admin_users').select('user_id, name, email').eq('status', 'active'),
    ])
    setTickets((tRes.data as SupportTicket[]) || [])
    setAdmins((aRes.data as Admin[]) || [])
    setLoading(false)
  }

  async function openTicket(t: SupportTicket) {
    setSelected(t)
    setReplies([])
    const { data } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: true })
    setReplies((data as TicketReply[]) || [])
  }

  function patchTicket(id: string, patch: Partial<SupportTicket>) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s))
  }

  async function updateField(t: SupportTicket, patch: Partial<SupportTicket>) {
    setBusy(true)
    const payload = { ...patch, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('support_tickets').update(payload).eq('id', t.id)
    setBusy(false)
    if (!error) patchTicket(t.id, patch)
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !replyText.trim()) return
    setSending(true)

    const { data, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: selected.id,
        author_id: me.id,
        author_name: me.name,
        is_admin: true,
        message: replyText.trim(),
      })
      .select('*')
      .single()

    if (error) { setSending(false); return }

    // Move to "en cours" + bump updated_at.
    const newStatus: TicketStatus = selected.status === 'open' ? 'en_cours' : selected.status
    await supabase
      .from('support_tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', selected.id)
    patchTicket(selected.id, { status: newStatus })

    // Web push to the ticket creator (non-blocking).
    if (selected.user_id) {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [selected.user_id],
          type: 'ticket',
          title: `Réponse à votre ticket ${selected.ticket_number || ''}`.trim(),
          body: replyText.trim().slice(0, 140),
          url: '/my-tickets',
        }),
      }).catch(() => {})
    }

    // Notify the ticket creator by WhatsApp if a phone is on file.
    if (selected.phone) {
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selected.phone,
          body: `CaissePro Support — réponse à votre ticket ${selected.ticket_number}\n\n${replyText.trim()}\n\nRépondez depuis caissepro.app/my-tickets`,
        }),
      }).catch(() => null)
    }

    setReplies((prev) => [...prev, data as TicketReply])
    setReplyText('')
    setSending(false)
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      open: tickets.filter((t) => t.status === 'open').length,
      enCours: tickets.filter((t) => t.status === 'en_cours').length,
      resolvedToday: tickets.filter((t) => t.status === 'resolu' && (t.updated_at || '').slice(0, 10) === today).length,
    }
  }, [tickets])

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => (tab === 'all' ? true : t.status === tab))
      .filter((t) => (categoryFilter === 'all' ? true : (t.category || 'autre') === categoryFilter))
      .sort((a, b) => {
        const pa = a.priority === 'urgent' ? 0 : 1
        const pb = b.priority === 'urgent' ? 0 : 1
        const sa = STATUS_RANK[a.status] ?? 9
        const sb = STATUS_RANK[b.status] ?? 9
        // Open/en_cours first, urgent first, then most recent.
        if (sa !== sb) return sa - sb
        if (pa !== pb) return pa - pb
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
  }, [tickets, tab, categoryFilter])

  if (selected) {
    return (
      <ThreadView
        ticket={selected}
        replies={replies}
        admins={admins}
        busy={busy}
        sending={sending}
        replyText={replyText}
        setReplyText={setReplyText}
        onReply={sendReply}
        onBack={() => setSelected(null)}
        onStatus={(s) => updateField(selected, { status: s })}
        onPriority={(p) => updateField(selected, { priority: p })}
        onAssign={(uid) => updateField(selected, { assigned_to: uid })}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/15 p-3"><Inbox className="text-emerald-300" size={26} /></div>
          <div>
            <h1 className="text-3xl font-black">Tickets de support</h1>
            <p className="text-sm font-semibold text-white/50">Gérez les demandes des commerçants.</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 hover:bg-white/10">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[2rem] border border-orange-400/30 bg-orange-400/5 p-6">
          <Clock className="text-orange-300" />
          <p className="mt-4 text-sm font-bold text-white/50">Total ouverts</p>
          <p className="mt-1 text-3xl font-black text-orange-300">{stats.open}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <Loader2 className="text-blue-300" />
          <p className="mt-4 text-sm font-bold text-white/50">En cours</p>
          <p className="mt-1 text-3xl font-black text-blue-300">{stats.enCours}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <AlertTriangle className="text-emerald-300" />
          <p className="mt-4 text-sm font-bold text-white/50">Résolus aujourd&apos;hui</p>
          <p className="mt-1 text-3xl font-black text-emerald-300">{stats.resolvedToday}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([['all', 'Tous'], ...TICKET_STATUS_ORDER.map((s) => [s, TICKET_STATUS_META[s].label] as const)] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${tab === key ? 'bg-emerald-600 text-white' : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {label}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="ml-auto rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm font-black text-white outline-none"
        >
          <option value="all">Toutes catégories</option>
          {TICKET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center font-bold text-white/40">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center font-bold text-white/40">Aucun ticket.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const meta = statusMeta(t.status)
            return (
              <button
                key={t.id}
                onClick={() => openTicket(t)}
                className="flex w-full items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black text-white/70">{t.ticket_number}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${meta.badge}`}>{meta.label}</span>
                    {t.priority === 'urgent' && <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-black text-red-300">Urgent</span>}
                    <span className="text-xs font-bold text-white/40">{categoryLabel(t.category)}</span>
                  </div>
                  <p className="mt-1.5 truncate font-black text-white">{t.subject}</p>
                  <p className="mt-0.5 text-xs font-semibold text-white/40">
                    {t.name} · {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ThreadView({
  ticket, replies, admins, busy, sending, replyText, setReplyText, onReply, onBack, onStatus, onPriority, onAssign,
}: {
  ticket: SupportTicket
  replies: TicketReply[]
  admins: Admin[]
  busy: boolean
  sending: boolean
  replyText: string
  setReplyText: (v: string) => void
  onReply: (e: React.FormEvent) => void
  onBack: () => void
  onStatus: (s: TicketStatus) => void
  onPriority: (p: 'normal' | 'urgent') => void
  onAssign: (uid: string) => void
}) {
  const meta = statusMeta(ticket.status)
  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-white/70 hover:text-white">
        <ArrowLeft size={16} /> Retour aux tickets
      </button>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Conversation */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black text-white/70">{ticket.ticket_number}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${meta.badge}`}>{meta.label}</span>
            {ticket.priority === 'urgent' && <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-black text-red-300">Urgent</span>}
          </div>
          <h2 className="mt-3 text-2xl font-black text-white">{ticket.subject}</h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-black text-white/50">{ticket.name}{ticket.phone ? ` · ${ticket.phone}` : ''}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-white/80">{ticket.message}</p>
              <p className="mt-2 text-[11px] font-bold text-white/30">{new Date(ticket.created_at).toLocaleString('fr-FR')}</p>
            </div>
            {replies.map((r) => (
              <div key={r.id} className={`rounded-2xl p-4 ${r.is_admin ? 'border border-emerald-400/20 bg-emerald-400/10' : 'bg-white/5'}`}>
                <p className={`text-xs font-black ${r.is_admin ? 'text-emerald-300' : 'text-white/50'}`}>
                  {r.is_admin ? `${r.author_name || 'Support'} (admin)` : (r.author_name || 'Client')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-white/80">{r.message}</p>
                <p className="mt-2 text-[11px] font-bold text-white/30">{new Date(r.created_at).toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>

          <form onSubmit={onReply} className="mt-5 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Répondre au client..."
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
            />
            <button type="submit" disabled={sending || !replyText.trim()} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/40">Statut</p>
            <select
              value={ticket.status}
              disabled={busy}
              onChange={(e) => onStatus(e.target.value as TicketStatus)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-white outline-none"
            >
              {TICKET_STATUS_ORDER.map((s) => <option key={s} value={s}>{TICKET_STATUS_META[s].label}</option>)}
            </select>

            <p className="mb-2 mt-4 text-xs font-black uppercase tracking-wide text-white/40">Priorité</p>
            <select
              value={ticket.priority}
              disabled={busy}
              onChange={(e) => onPriority(e.target.value as 'normal' | 'urgent')}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-white outline-none"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>

            <p className="mb-2 mt-4 text-xs font-black uppercase tracking-wide text-white/40">Assigné à</p>
            <select
              value={ticket.assigned_to || ''}
              disabled={busy}
              onChange={(e) => onAssign(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-white outline-none"
            >
              <option value="">Non assigné</option>
              {admins.filter((a) => a.user_id).map((a) => (
                <option key={a.user_id} value={a.user_id as string}>{a.name || a.email}</option>
              ))}
            </select>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm">
            <p className="font-black text-white">Contact</p>
            <p className="mt-2 font-semibold text-white/60">{ticket.email || '—'}</p>
            <p className="font-semibold text-white/60">{ticket.phone || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
