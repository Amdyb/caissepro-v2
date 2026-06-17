'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HelpCircle, Loader2, MessageCircle, Send, Ticket, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { TICKET_CATEGORIES } from '@/lib/tickets'

const SUPPORT_WHATSAPP = '15863442378'
const SUPPORT_TEXT = "Bonjour, j'ai besoin d'aide avec CaissePro:"
const SELECTED_BIZ_KEY = 'caissepro_selected_business_id'

// Routes where the bubble must NOT appear (public storefront).
const HIDDEN_PREFIXES = ['/shop/']

type View = 'menu' | 'form' | 'success'

export default function SupportBubble() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticketNumber, setTicketNumber] = useState('')

  const [form, setForm] = useState({
    category: 'connexion',
    subject: '',
    message: '',
    name: '',
    phone: '',
    email: '',
  })

  // Open straight to the form when triggered from the help page.
  useEffect(() => {
    function openToForm() {
      setOpen(true)
      goToForm()
    }
    window.addEventListener('open-support-ticket', openToForm)
    return () => window.removeEventListener('open-support-ticket', openToForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const waUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(SUPPORT_TEXT)}`

  async function goToForm() {
    setView('form')
    setError('')
    // Auto-fill from the logged-in user, if any.
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return
      let name = ''
      let phone = ''
      const bizId = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_BIZ_KEY) : null
      const { data: m } = await supabase
        .from('business_members')
        .select('full_name, businesses(phone)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (m) {
        name = (m as any).full_name || ''
        phone = (m as any).businesses?.phone || ''
      }
      setForm((f) => ({
        ...f,
        email: f.email || user.email || '',
        name: f.name || name,
        phone: f.phone || phone,
      }))
      void bizId
    } catch {
      /* prefill is best-effort */
    }
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.subject.trim() || !form.message.trim()) {
      setError('Veuillez remplir le nom, le sujet et le message.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: userData } = await supabase.auth.getUser()
      const bizId = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_BIZ_KEY) : null

      const { data, error: insErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userData.user?.id ?? null,
          business_id: bizId || null,
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          category: form.category,
          subject: form.subject.trim(),
          message: form.message.trim(),
        })
        .select('ticket_number, subject, name')
        .single()

      if (insErr) {
        setError(insErr.message)
        setLoading(false)
        return
      }

      const num = data?.ticket_number || ''
      setTicketNumber(num)

      // Notify the support line by WhatsApp (non-blocking).
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+${SUPPORT_WHATSAPP}`,
          body: `NOUVEAU TICKET ${num}\nDe: ${form.name}\nCatégorie: ${form.category}\nSujet: ${form.subject}\n\n${form.message}\n\nTél: ${form.phone || '—'} · Email: ${form.email || '—'}`,
        }),
      }).catch(() => null)

      // Notify all admins in-app (non-blocking).
      fetch('/api/notifications/new-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_number: num, subject: form.subject, name: form.name }),
      }).catch(() => null)

      setView('success')
      setForm((f) => ({ ...f, subject: '', message: '' }))
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setOpen(false)
    setView('menu')
    setError('')
  }

  return (
    <div className="fixed bottom-5 right-5 z-[600] print:hidden">
      {open ? (
        <div className="w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="text-sm font-black">Support CaissePro</span>
            </div>
            <button onClick={reset} aria-label="Fermer" className="rounded-lg p-1 text-white/80 hover:bg-white/10">
              <X size={16} />
            </button>
          </div>

          {/* MENU */}
          {view === 'menu' && (
            <div className="p-5">
              <p className="text-sm font-semibold text-slate-600">Besoin d&apos;aide ? Choisissez une option :</p>
              <button
                onClick={goToForm}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <Ticket size={16} /> Créer un ticket de support
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <MessageCircle size={16} /> Contacter sur WhatsApp
              </a>
              <Link
                href="/help"
                onClick={reset}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <HelpCircle size={16} /> Voir la page d&apos;aide
              </Link>
            </div>
          )}

          {/* FORM */}
          {view === 'form' && (
            <form onSubmit={submitTicket} className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
              <div>
                <label className="text-xs font-black text-slate-600">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                >
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Sujet *"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez votre problème *"
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Votre nom *"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Téléphone"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </div>

              {error && <p className="rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-700">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Envoi...</> : <><Send size={15} /> Envoyer</>}
                </button>
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Retour
                </button>
              </div>
            </form>
          )}

          {/* SUCCESS */}
          {view === 'success' && (
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <Ticket className="text-emerald-600" size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-950">Ticket créé !</h3>
              <p className="mt-2 text-sm font-bold text-slate-600">
                Numéro : <span className="text-emerald-700">{ticketNumber || '—'}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Nous vous répondrons sous 24h.</p>
              <Link
                href="/my-tickets"
                onClick={reset}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700"
              >
                Voir mes tickets
              </Link>
              <button
                onClick={() => setView('menu')}
                className="mt-2 w-full rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setOpen(true); setView('menu') }}
          aria-label="Support"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 transition hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
          <MessageCircle size={24} className="relative" />
        </button>
      )}
    </div>
  )
}
