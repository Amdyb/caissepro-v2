'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  CheckCircle2,
  ClipboardCopy,
  LogOut,
  MessageCircle,
  QrCode,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const COUNTRY_FLAGS: Record<string, string> = {
  'Sénégal': '🇸🇳', "Côte d'Ivoire": '🇨🇮', 'Mali': '🇲🇱', 'Burkina Faso': '🇧🇫',
  'Guinée': '🇬🇳', 'Cameroun': '🇨🇲', 'Togo': '🇹🇬', 'Bénin': '🇧🇯',
  'Niger': '🇳🇪', 'Mauritanie': '🇲🇷', 'Gambie': '🇬🇲', 'Sierra Leone': '🇸🇱',
  'Ghana': '🇬🇭', 'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Rwanda': '🇷🇼',
  'Tanzanie': '🇹🇿', 'Ouganda': '🇺🇬', 'RDC': '🇨🇩', 'Maroc': '🇲🇦',
  'Tunisie': '🇹🇳', 'Algérie': '🇩🇿', 'Égypte': '🇪🇬',
}

function cfa(n: number) {
  return `${Number(n || 0).toLocaleString('fr-FR')} XOF`
}

function LeadBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:       'bg-emerald-100 text-emerald-700',
    registered: 'bg-amber-100  text-amber-700',
    cancelled:  'bg-red-100    text-red-700',
  }
  const labels: Record<string, string> = { paid: 'Payé', registered: 'Inscrit', cancelled: 'Annulé' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function CommBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:        'bg-emerald-100 text-emerald-700',
    pending:     'bg-amber-100  text-amber-700',
    not_reached: 'bg-red-100    text-red-700',
  }
  const labels: Record<string, string> = { paid: 'Payé', pending: 'En attente', not_reached: 'Non atteint' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function AgentDashboard() {
  const router = useRouter()
  const [agent, setAgent] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/agents/login'); return }

      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('email', userData.user.email)
        .maybeSingle()

      if (!agentData || agentData.status !== 'active') {
        router.push('/agents/login')
        return
      }

      setAgent(agentData)

      const [leadsRes, commsRes] = await Promise.all([
        supabase
          .from('agent_leads')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('agent_commissions')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('month', { ascending: false }),
      ])

      setLeads(leadsRes.data ?? [])
      setCommissions(commsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/agents/login')
  }

  function copyLink() {
    navigator.clipboard.writeText(registerLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `Gérez votre boutique avec CaissePro! Inscrivez-vous avec mon code ${agent.invite_code}: ${registerLink}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Chargement...</p>
      </main>
    )
  }

  const registerLink   = `https://caissepro.app/register?agent=${agent.invite_code}`
  const qrUrl          = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registerLink)}`
  const paidThisMonth  = leads.filter((l) => l.paid_at?.slice(0, 7) === currentMonth && l.status === 'paid')
  const pendingTotal   = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + (c.amount ?? 0), 0)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/caissepro-logo.png" alt="CaissePro" width={100} height={32} className="h-8 w-auto" />
            </Link>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Espace Agent</p>
              <p className="text-sm font-black leading-tight text-slate-950">
                Bonjour, {agent.full_name.split(' ')[0]} 👋
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">

        {/* ── Stats row ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Signups this month */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                <Users size={20} className="text-blue-600" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                Ce mois
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-950">
              {paidThisMonth.length}
              <span className="text-xl font-bold text-slate-300">/20</span>
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-500">Signups ce mois</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${paidThisMonth.length >= 20 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (paidThisMonth.length / 20) * 100)}%` }}
              />
            </div>
            <p className={`mt-1.5 text-xs font-black ${paidThisMonth.length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {paidThisMonth.length >= 20
                ? '🎉 Objectif atteint!'
                : `${20 - paidThisMonth.length} abonnés restants`}
            </p>
          </div>

          {/* Pending commission */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                <Wallet size={20} className="text-amber-600" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                En attente
              </span>
            </div>
            <p className="mt-4 text-2xl font-black leading-tight text-slate-950">{cfa(pendingTotal)}</p>
            <p className="mt-0.5 text-sm font-bold text-slate-500">Commission en attente</p>
          </div>

          {/* Total earned */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                Total
              </span>
            </div>
            <p className="mt-4 text-2xl font-black leading-tight text-slate-950">
              {cfa(agent.total_commissions_earned ?? 0)}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-500">Total gagné</p>
          </div>

          {/* Total leads */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50">
                <Users size={20} className="text-violet-600" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                Tous temps
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-950">{leads.length}</p>
            <p className="mt-0.5 text-sm font-bold text-slate-500">Leads totaux</p>
          </div>
        </div>

        {/* ── Invite code card ── */}
        <div className="overflow-hidden rounded-[2rem] bg-emerald-600 p-8 text-white shadow-xl md:p-10">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-200">Votre code unique</p>
          <p className="mt-2 text-5xl font-black tracking-widest md:text-6xl">{agent.invite_code}</p>
          <p className="mt-2 text-sm font-semibold text-white/60">
            Partagez ce code avec les commerçants pour les enrôler dans CaissePro.
          </p>

          {/* Link row */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 truncate rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-white/50">Votre lien</p>
              <p className="mt-0.5 truncate text-sm font-black">{registerLink}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow transition hover:bg-emerald-50"
              >
                <ClipboardCopy size={15} />
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                <MessageCircle size={15} /> WhatsApp
              </button>
            </div>
          </div>

          {/* QR code */}
          <div className="mt-6 flex items-center gap-5">
            <div className="rounded-2xl bg-white p-3 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR Code" className="h-24 w-24 rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-black">
                <QrCode size={16} /> QR Code
              </div>
              <p className="mt-1 max-w-xs text-xs font-semibold text-white/60">
                Les commerçants scannent ce QR code pour s'inscrire directement avec votre code.
              </p>
            </div>
          </div>
        </div>

        {/* ── Leads table ── */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-slate-950">
            Mes leads{' '}
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
              {leads.length}
            </span>
          </h2>
          {leads.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-bold text-slate-400">Aucun lead pour l&apos;instant.</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                Partagez votre lien pour commencer à recruter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Boutique', 'Pays', 'Email', 'Date inscription', 'Plan', 'Statut'].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-black uppercase tracking-wider text-slate-400 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 pr-4 font-bold text-slate-950">{lead.business_name || '—'}</td>
                      <td className="py-3.5 pr-4 font-semibold text-slate-600">
                        {COUNTRY_FLAGS[lead.country] && <span className="mr-1">{COUNTRY_FLAGS[lead.country]}</span>}
                        {lead.country || '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500">{lead.email || '—'}</td>
                      <td className="py-3.5 pr-4 text-slate-500">
                        {lead.signed_up_at ? new Date(lead.signed_up_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-3.5 pr-4 font-semibold text-slate-600">{lead.plan || '—'}</td>
                      <td className="py-3.5"><LeadBadge status={lead.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Commission history ── */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-slate-950">
            Historique des commissions{' '}
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
              {commissions.length}
            </span>
          </h2>
          {commissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-bold text-slate-400">Aucune commission enregistrée.</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                Atteignez 20 abonnés payants dans le mois pour débloquer votre commission de 50 000 XOF.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Mois', 'Inscriptions', 'Objectif atteint', 'Montant', 'Statut', 'Date paiement'].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-black uppercase tracking-wider text-slate-400 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 pr-4 font-black text-slate-950">{c.month}</td>
                      <td className="py-3.5 pr-4 font-bold text-slate-700">
                        {c.signups_count}
                        <span className="font-semibold text-slate-400">/20</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        {c.target_reached ? (
                          <span className="inline-flex items-center gap-1 font-black text-emerald-600">
                            <CheckCircle2 size={14} /> Oui
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Non</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 font-black text-slate-950">{cfa(c.amount)}</td>
                      <td className="py-3.5 pr-4"><CommBadge status={c.status} /></td>
                      <td className="py-3.5 text-slate-500">
                        {c.paid_at ? new Date(c.paid_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
