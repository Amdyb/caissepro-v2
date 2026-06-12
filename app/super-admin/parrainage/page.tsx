'use client'

import { supabase } from '@/lib/supabaseClient'
import { Gift, Users, TrendingUp, Award, Download, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Referral = {
  id: string
  referrer_business_id: string | null
  referred_business_id: string | null
  referral_code: string
  referred_email: string | null
  referred_phone: string | null
  status: string | null
  reward_type: string | null
  reward_value: number | null
  created_at: string
}

const CONVERTED = ['signed_up', 'active', 'upgraded', 'rewarded']

const STATUS_LABEL: Record<string, string> = {
  invited: 'Invité',
  signed_up: 'Inscrit',
  active: 'Actif',
  upgraded: 'Upgrade',
  rewarded: 'Récompensé',
}

const STATUS_STYLE: Record<string, string> = {
  invited: 'bg-white/10 text-white/60',
  signed_up: 'bg-sky-400/20 text-sky-300',
  active: 'bg-emerald-400/20 text-emerald-300',
  upgraded: 'bg-amber-400/20 text-amber-300',
  rewarded: 'bg-violet-400/20 text-violet-300',
}

function monthKey(iso: string) {
  return iso.slice(0, 7) // YYYY-MM
}

export default function SuperAdminParrainagePage() {
  const [loading, setLoading] = useState(true)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({})
  const [month, setMonth] = useState('all')
  const [parrain, setParrain] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [refResult, bizResult] = await Promise.all([
      supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('businesses').select('id, name').limit(2000),
    ])
    setReferrals((refResult.data || []) as Referral[])
    const map: Record<string, string> = {}
    for (const b of bizResult.data || []) map[(b as any).id] = (b as any).name
    setBusinessNames(map)
    setLoading(false)
  }

  function nameFor(id: string | null) {
    if (!id) return '—'
    return businessNames[id] || id.slice(0, 8)
  }

  const months = useMemo(() => {
    const set = new Set<string>()
    referrals.forEach((r) => set.add(monthKey(r.created_at)))
    return Array.from(set).sort().reverse()
  }, [referrals])

  const parrains = useMemo(() => {
    const set = new Set<string>()
    referrals.forEach((r) => r.referrer_business_id && set.add(r.referrer_business_id))
    return Array.from(set)
  }, [referrals])

  const filtered = useMemo(() => {
    return referrals.filter((r) => {
      if (month !== 'all' && monthKey(r.created_at) !== month) return false
      if (parrain !== 'all' && r.referrer_business_id !== parrain) return false
      return true
    })
  }, [referrals, month, parrain])

  const stats = useMemo(() => {
    const total = filtered.length
    const converted = filtered.filter((r) => CONVERTED.includes(r.status || '')).length
    const rewarded = filtered.filter((r) => r.status === 'rewarded')
    const rewardsValue = rewarded.reduce((sum, r) => sum + Number(r.reward_value || 0), 0)
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0
    return { total, converted, rate, rewardedCount: rewarded.length, rewardsValue }
  }, [filtered])

  async function markRewarded(r: Referral) {
    setBusyId(r.id)
    const { error } = await supabase
      .from('referrals')
      .update({ status: 'rewarded', updated_at: new Date().toISOString() })
      .eq('id', r.id)
    setBusyId(null)
    if (error) {
      setMessage(error.message)
      setTimeout(() => setMessage(''), 5000)
      return
    }
    setReferrals((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'rewarded' } : x)))
  }

  function exportCsv() {
    const headers = ['Parrain', 'Filleul', 'Email', 'Telephone', 'Code', 'Statut', 'Recompense', 'Date']
    const rows = filtered.map((r) => [
      nameFor(r.referrer_business_id),
      nameFor(r.referred_business_id),
      r.referred_email || '',
      r.referred_phone || '',
      r.referral_code,
      STATUS_LABEL[r.status || 'invited'] || r.status || '',
      r.reward_value ? String(r.reward_value) : '',
      new Date(r.created_at).toLocaleDateString('fr-FR'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `parrainage-${month === 'all' ? 'tout' : month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cards = [
    { title: 'Parrainages', value: stats.total, icon: Users, color: 'text-emerald-300' },
    { title: 'Convertis', value: stats.converted, icon: TrendingUp, color: 'text-sky-300' },
    { title: 'Taux conversion', value: `${stats.rate}%`, icon: Award, color: 'text-amber-300' },
    { title: 'Récompenses', value: stats.rewardedCount, icon: Gift, color: 'text-violet-300' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/15 p-3">
            <Gift className="text-emerald-300" size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black">Parrainage</h1>
            <p className="text-sm font-semibold text-white/50">Suivi du programme de parrainage entre boutiques.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 hover:bg-white/10">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-500">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-black text-red-200">{message}</div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <Icon className={c.color} />
              <p className="mt-4 text-sm font-bold text-white/50">{c.title}</p>
              <p className="mt-1 text-3xl font-black">{c.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-white outline-none"
        >
          <option value="all">Tous les mois</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={parrain}
          onChange={(e) => setParrain(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-white outline-none"
        >
          <option value="all">Tous les parrains</option>
          {parrains.map((p) => (
            <option key={p} value={p}>
              {nameFor(p)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="hidden grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.6fr] gap-4 border-b border-white/10 px-6 py-4 text-[11px] font-black uppercase tracking-wider text-white/40 lg:grid">
          <span>Parrain</span>
          <span>Filleul</span>
          <span>Date</span>
          <span>Statut</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <p className="px-6 py-10 text-center font-bold text-white/40">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-10 text-center font-bold text-white/40">Aucun parrainage.</p>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 gap-2 border-b border-white/5 px-6 py-4 last:border-0 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.6fr] lg:items-center lg:gap-4"
            >
              <div>
                <p className="font-black">{nameFor(r.referrer_business_id)}</p>
                <p className="text-xs font-bold text-white/30">Code: {r.referral_code}</p>
              </div>
              <div>
                <p className="font-bold">{r.referred_business_id ? nameFor(r.referred_business_id) : r.referred_email || r.referred_phone || 'Invité'}</p>
                {r.reward_value ? <p className="text-xs font-bold text-emerald-300/70">{r.reward_value} {r.reward_type || ''}</p> : null}
              </div>
              <div className="text-sm font-semibold text-white/50">{new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_STYLE[r.status || 'invited'] || 'bg-white/10 text-white/60'}`}>
                  {STATUS_LABEL[r.status || 'invited'] || r.status}
                </span>
              </div>
              <div className="lg:text-right">
                {r.status !== 'rewarded' && CONVERTED.includes(r.status || '') ? (
                  <button
                    onClick={() => markRewarded(r)}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-black text-violet-300 hover:bg-violet-500/25 disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} /> Récompenser
                  </button>
                ) : r.status === 'rewarded' ? (
                  <span className="text-xs font-bold text-violet-300/60">Récompensé</span>
                ) : (
                  <span className="text-xs font-bold text-white/20">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
