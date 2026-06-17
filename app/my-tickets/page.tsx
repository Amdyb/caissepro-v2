'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { categoryLabel, statusMeta, type SupportTicket, type TicketReply } from '@/lib/tickets'
import { ArrowLeft, Loader2, MessageSquare, Send, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function MyTicketsPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id || null
      setUserId(uid)
      setUserName(userData.user?.email?.split('@')[0] || 'Vous')
      if (!uid) { setLoading(false); return }
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
      setTickets((data as SupportTicket[]) || [])
      setLoading(false)
    }
    load()
  }, [])

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

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !replyText.trim()) return
    setSending(true)
    const { data, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: selected.id,
        author_id: userId,
        author_name: userName,
        is_admin: false,
        message: replyText.trim(),
      })
      .select('*')
      .single()
    setSending(false)
    if (error) return
    setReplies((prev) => [...prev, data as TicketReply])
    setReplyText('')
  }

  return (
    <AppShell title="Mes tickets" subtitle="Suivez vos demandes de support.">
      <div className="mx-auto max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={28} /></div>
        ) : selected ? (
          <TicketThread
            ticket={selected}
            replies={replies}
            onBack={() => setSelected(null)}
            replyText={replyText}
            setReplyText={setReplyText}
            onReply={sendReply}
            sending={sending}
          />
        ) : tickets.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Ticket className="mx-auto mb-4 text-slate-300" size={44} />
            <p className="font-black text-slate-700 dark:text-white">Aucun ticket pour l&apos;instant.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Utilisez la bulle de support en bas à droite pour créer un ticket.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const meta = statusMeta(t.status)
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">{t.ticket_number}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${meta.badge}`}>{meta.label}</span>
                      <span className="text-xs font-bold text-slate-400">{categoryLabel(t.category)}</span>
                    </div>
                    <p className="mt-1.5 truncate font-black text-slate-950 dark:text-white">{t.subject}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <MessageSquare size={18} className="shrink-0 text-slate-300" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function TicketThread({
  ticket, replies, onBack, replyText, setReplyText, onReply, sending,
}: {
  ticket: SupportTicket
  replies: TicketReply[]
  onBack: () => void
  replyText: string
  setReplyText: (v: string) => void
  onReply: (e: React.FormEvent) => void
  sending: boolean
}) {
  const meta = statusMeta(ticket.status)
  const closed = ticket.status === 'ferme'
  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-emerald-700 dark:text-slate-300">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">{ticket.ticket_number}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${meta.badge}`}>{meta.label}</span>
          <span className="text-xs font-bold text-slate-400">{categoryLabel(ticket.category)}</span>
        </div>
        <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{ticket.subject}</h2>

        <div className="mt-5 space-y-3">
          {/* Original message */}
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/40">
            <p className="text-xs font-black text-slate-500">{ticket.name}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-700 dark:text-slate-200">{ticket.message}</p>
            <p className="mt-2 text-[11px] font-bold text-slate-400">{new Date(ticket.created_at).toLocaleString('fr-FR')}</p>
          </div>

          {replies.map((r) => (
            <div key={r.id} className={`rounded-2xl p-4 ${r.is_admin ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-700/40'}`}>
              <p className={`text-xs font-black ${r.is_admin ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>
                {r.is_admin ? 'Support CaissePro' : (r.author_name || 'Vous')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-700 dark:text-slate-200">{r.message}</p>
              <p className="mt-2 text-[11px] font-bold text-slate-400">{new Date(r.created_at).toLocaleString('fr-FR')}</p>
            </div>
          ))}
        </div>

        {closed ? (
          <p className="mt-5 rounded-2xl bg-slate-100 p-3 text-center text-sm font-bold text-slate-500 dark:bg-slate-700">Ce ticket est fermé.</p>
        ) : (
          <form onSubmit={onReply} className="mt-5 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Votre réponse..."
              className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
