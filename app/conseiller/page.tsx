'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import {
  BarChart3,
  Crown,
  HandCoins,
  Lightbulb,
  Megaphone,
  Newspaper,
  Package,
  PenSquare,
  Send,
  Sparkles,
  TrendingUp,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; text: string }

const BUSINESS_PROMPTS = [
  { label: 'Analyser mes ventes', icon: BarChart3 },
  { label: 'Réduire mes dettes', icon: HandCoins },
  { label: 'Optimiser mon stock', icon: Package },
  { label: 'Prévisions du mois', icon: TrendingUp },
]

const MARKETING_PROMPTS = [
  { label: 'Promouvoir sur les réseaux sociaux', icon: Megaphone },
  { label: 'Idées de publications', icon: Newspaper },
  { label: 'Créer une publicité', icon: PenSquare },
  { label: 'Plan marketing de la semaine', icon: Sparkles },
  { label: 'Avoir plus de clients', icon: UserPlus },
]

export default function ConseillerPage() {
  const { businessId, fullName, plan, loading } = useBusinessData()
  const isPremium = plan === 'premium'

  const [tab, setTab] = useState<'business' | 'marketing'>('business')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const [freeUsed, setFreeUsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const freeKey = businessId ? `conseiller_free_used_${businessId}` : ''

  useEffect(() => {
    if (freeKey) setFreeUsed(localStorage.getItem(freeKey) === '1')
  }, [freeKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, asking])

  const gated = !isPremium && freeUsed

  async function ask(question: string) {
    const q = question.trim()
    if (!q || !businessId || asking || gated) return

    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setAsking(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/conseiller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ businessId, question: q }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', text: res.ok ? (data.advice || 'Aucune réponse générée.') : (data.error || 'Conseiller indisponible.') }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Connexion impossible. Réessayez.' }])
    } finally {
      setAsking(false)
      if (!isPremium && freeKey) {
        setFreeUsed(true)
        localStorage.setItem(freeKey, '1')
      }
    }
  }

  if (loading) {
    return (
      <AppShell title="Votre Conseiller Commercial" subtitle="Des conseils adaptés à votre commerce.">
        <div className="mx-auto max-w-3xl"><p className="font-bold text-slate-600">Chargement...</p></div>
      </AppShell>
    )
  }

  const prompts = tab === 'business' ? BUSINESS_PROMPTS : MARKETING_PROMPTS

  return (
    <AppShell title="Votre Conseiller Commercial" subtitle="Des conseils adaptés à votre commerce.">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Welcome */}
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Sparkles size={22} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Bonjour {fullName || ''}!</h2>
              <p className="text-sm font-semibold text-slate-500">J&apos;analyse votre activité et vous aide à vendre plus.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setTab('business')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'business' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Conseils Business</button>
          <button onClick={() => setTab('marketing')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'marketing' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Marketing & Promotion</button>
        </div>

        {/* Preset questions */}
        <div className="grid gap-3 sm:grid-cols-2">
          {prompts.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => ask(label)}
              disabled={asking || gated}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Icon size={18} /></div>
              <span className="text-sm font-black text-slate-950">{label}</span>
            </button>
          ))}
        </div>

        {/* Conversation */}
        {messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-emerald-600 font-bold text-white' : 'whitespace-pre-wrap border border-slate-200 bg-white font-medium text-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-500 shadow-sm">
                  <Sparkles size={16} className="animate-pulse text-emerald-600" /> Votre conseiller analyse...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Upgrade gate (non-premium, after 1 free question) */}
        {gated ? (
          <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100"><Crown className="text-amber-600" size={26} /></div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white"><Sparkles size={12} /> Premium</div>
            <h3 className="text-xl font-black text-slate-950">Continuez avec le plan Premium</h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">Vous avez utilisé votre conseil gratuit. Passez à Premium pour des conseils illimités adaptés à votre commerce.</p>
            <Link href="/upgrade" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white hover:bg-emerald-700"><Crown size={18} /> Passer à Premium</Link>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={asking}
              className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500"
            />
            <button type="submit" disabled={asking || !input.trim()} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-50">
              <Send size={18} />
            </button>
          </form>
        )}

        {!isPremium && !freeUsed && (
          <p className="flex items-center justify-center gap-2 text-center text-xs font-bold text-slate-400">
            <Lightbulb size={13} className="text-amber-500" /> 1 conseil gratuit — Premium pour des conseils illimités.
          </p>
        )}
      </div>
    </AppShell>
  )
}
