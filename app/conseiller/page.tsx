'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import {
  BarChart3,
  Check,
  Crown,
  HandCoins,
  Lock,
  Megaphone,
  Newspaper,
  Package,
  PenSquare,
  Send,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
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

// Hardcoded teaser shown to non-premium users — NO API call. Shows the kind of
// advice Premium delivers so they see the value without us paying for it.
const SAMPLE_TIP =
  "Vos boissons fraîches se vendent surtout le weekend : mettez-les en avant à l'entrée le vendredi et samedi, et proposez un pack de 3 à prix réduit. Vous pourriez augmenter votre panier moyen de 15%."

const PREMIUM_BENEFITS = [
  'Analyse de vos ventes en temps réel',
  'Conseils marketing personnalisés',
  'Stratégies pour augmenter vos revenus',
  'Conseils adaptés à votre type de commerce',
]

export default function ConseillerPage() {
  const { businessId, fullName, plan, loading } = useBusinessData()
  const isPremium = plan === 'premium'

  const [tab, setTab] = useState<'business' | 'marketing'>('business')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, asking])

  // Non-premium: never call the API — just open the upgrade prompt.
  async function ask(question: string) {
    if (!isPremium) {
      setShowUpgrade(true)
      return
    }
    const q = question.trim()
    if (!q || !businessId || asking) return

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
    }
  }

  if (loading) {
    return (
      <AppShell title="Coach Entrepreneur" subtitle="Des conseils adaptés à votre commerce.">
        <div className="mx-auto max-w-3xl"><p className="font-bold text-slate-600">Chargement...</p></div>
      </AppShell>
    )
  }

  const prompts = tab === 'business' ? BUSINESS_PROMPTS : MARKETING_PROMPTS

  return (
    <AppShell title="Coach Entrepreneur" subtitle="Des conseils adaptés à votre commerce.">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Welcome */}
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Sparkles size={22} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-slate-950">Bonjour {fullName || ''}!</h2>
              <p className="text-sm font-semibold text-slate-500">J&apos;analyse votre activité et vous aide à vendre plus.</p>
            </div>
            {!isPremium && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                <Crown size={12} /> Premium
              </span>
            )}
          </div>
        </div>

        {/* Non-premium teaser: an example of what Premium delivers (no API cost) */}
        {!isPremium && (
          <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              <Sparkles size={11} /> Exemple
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-700">{SAMPLE_TIP}</p>
            <p className="mt-3 text-xs font-bold text-slate-400">
              Voici le type de conseil que votre Conseiller Premium génère à partir de vos vraies données.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setTab('business')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'business' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Conseils Business</button>
          <button onClick={() => setTab('marketing')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'marketing' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Marketing & Promotion</button>
        </div>

        {/* Preset questions — locked appearance for non-premium */}
        <div className="grid gap-3 sm:grid-cols-2">
          {prompts.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => ask(label)}
              disabled={asking}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition disabled:opacity-50 ${
                isPremium
                  ? 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
                  : 'border-slate-200 bg-slate-50 hover:border-amber-300'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isPremium ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                <Icon size={18} />
              </div>
              <span className={`flex-1 text-sm font-black ${isPremium ? 'text-slate-950' : 'text-slate-500'}`}>{label}</span>
              {!isPremium && <Lock size={14} className="shrink-0 text-amber-500" />}
            </button>
          ))}
        </div>

        {/* Conversation (premium only) */}
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

        {/* Ask box (premium) or upgrade CTA (non-premium) */}
        {isPremium ? (
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
        ) : (
          <button
            onClick={() => setShowUpgrade(true)}
            className="flex w-full items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-400"
          >
            <Lock size={16} className="shrink-0 text-amber-500" />
            <span className="flex-1">Posez votre question...</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white">
              <Crown size={13} /> Premium
            </span>
          </button>
        )}
      </div>

      {/* Upgrade prompt modal (non-premium) */}
      {showUpgrade && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center" onClick={() => setShowUpgrade(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUpgrade(false)} className="absolute right-4 top-4 rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
              <X size={18} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Crown className="text-amber-600" size={28} />
            </div>
            <h3 className="text-center text-xl font-black text-slate-950">
              Le Coach Entrepreneur est réservé aux abonnés Premium
            </h3>
            <p className="mt-2 text-center text-sm font-semibold text-slate-500">
              Débloquez votre conseiller business personnel qui analyse vos ventes et vous aide à gagner plus.
            </p>

            <div className="mt-5 space-y-2.5">
              {PREMIUM_BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-800">{b}</span>
                </div>
              ))}
            </div>

            <Link
              href="/upgrade"
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Crown size={18} /> Passer à Premium
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  )
}
