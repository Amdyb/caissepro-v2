'use client'

import { supabase } from '@/lib/supabaseClient'
import {
  BarChart3,
  Building2,
  CreditCard,
  Gift,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

function cfa(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} CFA`
}

const QUICK_LINKS = [
  { label: 'Boutiques', href: '/super-admin/businesses', icon: Building2, desc: 'Gérer les marchands' },
  { label: 'Abonnements', href: '/super-admin/subscriptions', icon: CreditCard, desc: 'Valider les paiements' },
  { label: 'Parrainage', href: '/super-admin/parrainage', icon: Gift, desc: 'Suivi des parrainages' },
  { label: 'Statistiques', href: '/super-admin/analytics', icon: BarChart3, desc: 'Vue globale' },
  { label: 'Admins', href: '/super-admin/admins', icon: ShieldCheck, desc: "Équipe d'administration" },
]

export default function SuperAdminOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [adminCount, setAdminCount] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [bizResult, reqResult, subResult, adminResult] = await Promise.all([
      supabase.from('businesses').select('id, name, slug, business_type, plan, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('upgrade_requests').select('id, business_name, plan, price, status, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('subscriptions').select('id, plan, status, expires_at').limit(2000),
      supabase.from('admin_users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])
    setBusinesses(bizResult.data || [])
    setRequests(reqResult.data || [])
    setSubscriptions(subResult.data || [])
    setAdminCount(adminResult.count || 0)
    setLoading(false)
  }

  const stats = useMemo(() => {
    const now = Date.now()
    const pending = requests.filter((r) => r.status === 'pending')
    const activeSubs = subscriptions.filter(
      (s) => s.status === 'active' && (!s.expires_at || new Date(s.expires_at).getTime() > now)
    )
    const approvedRevenue = requests
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + Number(String(r.price || '0').replace(/\D/g, '')), 0)
    return { pending, activeSubs: activeSubs.length, approvedRevenue }
  }, [requests, subscriptions])

  if (loading) {
    return <div className="px-5 py-10 font-black text-white/70">Chargement...</div>
  }

  const cards = [
    { label: 'Boutiques', value: businesses.length, icon: Building2, color: 'text-emerald-300' },
    { label: 'Paiements à valider', value: stats.pending.length, icon: Clock, color: stats.pending.length > 0 ? 'text-amber-300' : 'text-white/40' },
    { label: 'Abonnements actifs', value: stats.activeSubs, icon: CreditCard, color: 'text-sky-300' },
    { label: 'Revenus validés', value: cfa(stats.approvedRevenue), icon: BarChart3, color: 'text-emerald-300', small: true },
    { label: 'Admins', value: adminCount, icon: ShieldCheck, color: 'text-violet-300' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">Control Center</p>
        <h1 className="mt-1 text-4xl font-black">Tableau de bord</h1>
        <p className="mt-1 text-sm font-semibold text-white/50">Vue d&apos;ensemble de la plateforme CaissePro.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <Icon className={c.color} />
              <p className="mt-4 text-sm font-bold text-white/50">{c.label}</p>
              <p className={`mt-1 font-black ${c.small ? 'text-2xl' : 'text-4xl'} ${c.color}`}>{c.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-emerald-400/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-500/15 p-3">
                  <Icon className="text-emerald-300" size={22} />
                </div>
                <div>
                  <p className="text-lg font-black">{link.label}</p>
                  <p className="text-xs font-semibold text-white/40">{link.desc}</p>
                </div>
              </div>
              <ArrowRight className="text-white/20 transition group-hover:translate-x-1 group-hover:text-emerald-300" size={20} />
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending payments */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">Paiements à valider</h2>
            <Link href="/super-admin/subscriptions" className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-500">
              Ouvrir
            </Link>
          </div>
          <div className="space-y-3">
            {stats.pending.length === 0 ? (
              <p className="rounded-2xl bg-white/5 p-5 text-sm font-bold text-white/40">Aucun paiement en attente.</p>
            ) : (
              stats.pending.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <div>
                    <p className="font-black">{r.business_name || 'Boutique'}</p>
                    <p className="text-xs font-bold text-white/40">{r.plan} · {r.price}</p>
                  </div>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-black uppercase text-amber-300">En attente</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent businesses */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">Boutiques récentes</h2>
            <Link href="/super-admin/businesses" className="text-sm font-black text-emerald-300 hover:text-emerald-200">
              Tout voir
            </Link>
          </div>
          <div className="space-y-3">
            {businesses.slice(0, 6).map((b) => (
              <Link key={b.id} href={`/super-admin/businesses/${b.id}`} className="block rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black">{b.name || 'Sans nom'}</p>
                    <p className="text-xs font-bold text-white/40">/{b.slug || 'no-slug'} · {b.business_type || 'retail'}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase text-white/60">{b.plan || 'free'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
