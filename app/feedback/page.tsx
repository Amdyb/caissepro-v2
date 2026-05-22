'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Bug, Lightbulb, LifeBuoy, MessageSquare, Send, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

const feedbackTypes = [
  { value: 'feedback', label: 'Retour général', icon: MessageSquare },
  { value: 'bug', label: 'Problème / Bug', icon: Bug },
  { value: 'feature_request', label: 'Nouvelle fonctionnalité', icon: Lightbulb },
  { value: 'support', label: 'Besoin d’aide', icon: LifeBuoy },
  { value: 'praise', label: 'Témoignage positif', icon: Star }
]

const priorities = [
  { value: 'low', label: 'Faible' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Important' },
  { value: 'urgent', label: 'Urgent' }
]

export default function FeedbackPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    type: 'feedback',
    priority: 'normal',
    title: '',
    message: ''
  })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      setUserId(userData.user.id)

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      setBusinessId(membership?.business_id || null)
    }

    init()
  }, [])

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('merchant_feedback').insert({
      business_id: businessId,
      user_id: userId,
      type: form.type,
      priority: form.priority,
      title: form.title,
      message: form.message,
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setForm({ type: 'feedback', priority: 'normal', title: '', message: '' })
    setMessage('Merci. Votre retour a été envoyé à l’équipe CaissePro.')
  }

  return (
    <AppShell title="Retours & Suggestions" subtitle="Aidez-nous à améliorer CaissePro pendant la bêta.">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8">
          <h1 className="text-5xl font-black tracking-tight text-slate-950">Votre avis compte.</h1>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
            Signalez un bug, proposez une idée ou dites-nous ce qui bloque votre commerce. Les meilleurs retours des bêta testeurs guideront les prochaines améliorations.
          </p>
        </div>

        {message && (
          <div className={`mb-6 rounded-2xl p-4 text-sm font-bold ${message.includes('Merci') ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={submitFeedback} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6">
            <div>
              <label className="mb-3 block text-sm font-black text-slate-700">Type de retour</label>
              <div className="grid gap-3 md:grid-cols-5">
                {feedbackTypes.map((item) => {
                  const Icon = item.icon
                  const active = form.type === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: item.value })}
                      className={`rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'}`}
                    >
                      <Icon size={22} />
                      <p className="mt-3 text-xs font-black leading-tight">{item.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-emerald-500"
              >
                {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Titre</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-emerald-500"
                placeholder="Ex: Je n’arrive pas à ajouter un produit"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Description</label>
              <textarea
                required
                rows={8}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-emerald-500"
                placeholder="Expliquez ce qui s’est passé, ce que vous attendiez, ou l’idée que vous aimeriez voir dans CaissePro."
              />
            </div>

            <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-60">
              <Send size={20} />
              {loading ? 'Envoi...' : 'Envoyer le retour'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
