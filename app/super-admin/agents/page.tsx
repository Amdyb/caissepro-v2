'use client'

import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Loader2, PauseCircle, Plus, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

function cfa(n: number) {
  return `${Number(n || 0).toLocaleString('fr-FR')} XOF`
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    suspended: 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const label: Record<string, string> = {
    active: 'Actif', pending: 'En attente', suspended: 'Suspendu', rejected: 'Rejeté',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {label[status] || status}
    </span>
  )
}

type Agent = {
  id: string
  full_name: string
  email: string
  phone: string | null
  city: string | null
  country: string | null
  invite_code: string
  status: string
  total_signups: number
  total_commissions_earned: number
  created_at: string
}

type Commission = {
  id: string
  agent_id: string
  month: string
  signups_count: number
  target_reached: boolean
  amount: number
  status: string
  paid_at: string | null
  agents: { full_name: string; email: string } | null
}

export default function SuperAdminAgentsPage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [leadsCountMap, setLeadsCountMap] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState('')
  const [payRef, setPayRef] = useState('')
  const [creating, setCreating] = useState(false)
  const [newAgent, setNewAgent] = useState({ full_name: '', email: '', phone: '', city: '', country: 'Sénégal' })
  const [showCreate, setShowCreate] = useState(false)
  const [viewLeadsAgent, setViewLeadsAgent] = useState<string | null>(null)
  const [agentLeads, setAgentLeads] = useState<any[]>([])
  const [confirmChange, setConfirmChange] = useState<{ agent: Agent; status: string; label: string } | null>(null)
  const [applyingChange, setApplyingChange] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      if (!FOUNDER_EMAILS.includes(userData.user.email || '')) {
        const { data: admin } = await supabase
          .from('platform_admins')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .maybeSingle()
        if (!admin) { setLoading(false); return }
      }
      setAllowed(true)
      await loadAll()
      setLoading(false)
    }
    init()
  }, [])

  async function loadAll() {
    const [agentsRes, commsRes] = await Promise.all([
      supabase.from('agents').select('*').order('created_at', { ascending: false }),
      supabase.from('agent_commissions')
        .select('*, agents(full_name, email)')
        .eq('status', 'pending')
        .order('month', { ascending: false }),
    ])
    setAgents(agentsRes.data || [])
    setCommissions(commsRes.data || [])

    // Load this-month leads counts per agent
    const { data: leads } = await supabase
      .from('agent_leads')
      .select('agent_id, status, paid_at')
      .gte('created_at', `${currentMonth}-01`)
    const map: Record<string, number> = {}
    for (const l of leads || []) {
      if (l.paid_at?.slice(0, 7) === currentMonth) {
        map[l.agent_id] = (map[l.agent_id] || 0) + 1
      }
    }
    setLeadsCountMap(map)
  }

  async function applyStatusChange() {
    if (!confirmChange) return
    const { agent, status } = confirmChange
    setApplyingChange(true)
    await supabase.from('agents').update({ status, updated_at: new Date().toISOString() }).eq('id', agent.id)
    setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, status } : a))

    const messages: Record<string, string> = {
      active: 'Agent activé.', suspended: 'Agent suspendu.', rejected: 'Agent rejeté.', pending: 'Statut mis à jour.',
    }
    flash(messages[status] || 'Statut mis à jour.')

    // WhatsApp notifications (non-blocking)
    if (agent.phone) {
      let body: string | null = null
      if (status === 'active') {
        body = `Félicitations ${agent.full_name} ! Votre compte agent CaissePro a été activé. Votre code de parrainage : ${agent.invite_code || 'en cours d\'attribution'}. Commencez à recruter des commerçants et gagnez 50 000 XOF/mois !`
      } else if (status === 'suspended') {
        body = `Bonjour ${agent.full_name}, votre compte agent CaissePro a été suspendu. Contactez l'équipe CaissePro pour plus d'informations.`
      }
      if (body) {
        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: agent.phone, body }),
        }).catch(() => null)
      }
    }

    setApplyingChange(false)
    setConfirmChange(null)
  }

  function requestStatusChange(agent: Agent, status: string, label: string) {
    setConfirmChange({ agent, status, label })
  }

  async function markCommissionPaid(commId: string) {
    if (!payMethod) { flash('Veuillez saisir la méthode de paiement.'); return }
    const comm = commissions.find((c) => c.id === commId)
    if (!comm) return

    await supabase.from('agent_commissions').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: payMethod,
      payment_reference: payRef || null,
    }).eq('id', commId)

    // Update agent total_commissions_earned
    await supabase.rpc('calculate_monthly_commission', {
      p_agent_id: comm.agent_id,
      p_month: comm.month,
    })
    await supabase.from('agents').update({
      total_commissions_earned: (agents.find((a) => a.id === comm.agent_id)?.total_commissions_earned || 0) + comm.amount,
    }).eq('id', comm.agent_id)

    setCommissions((prev) => prev.filter((c) => c.id !== commId))
    setPayingId(null)
    setPayMethod('')
    setPayRef('')
    flash('Commission marquée comme payée.')
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const { error } = await supabase.from('agents').insert({
      ...newAgent,
      status: 'active',
      phone: newAgent.phone || null,
      city: newAgent.city || null,
    })
    if (error) { flash(error.message); setCreating(false); return }
    setShowCreate(false)
    setNewAgent({ full_name: '', email: '', phone: '', city: '', country: 'Sénégal' })
    await loadAll()
    flash('Agent créé avec succès.')
    setCreating(false)
  }

  async function viewLeads(agentId: string) {
    setViewLeadsAgent(agentId)
    const { data } = await supabase.from('agent_leads').select('*').eq('agent_id', agentId).order('created_at', { ascending: false })
    setAgentLeads(data || [])
  }

  const filtered = useMemo(() => {
    const STATUS_ORDER: Record<string, number> = { pending: 0, active: 1, suspended: 2 }
    return agents
      .filter((a) => {
        const matchSearch = !search || [a.full_name, a.email, a.city, a.country].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
        const matchStatus = statusFilter === 'all' || a.status === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
  }, [agents, search, statusFilter])

  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    pending: agents.filter((a) => a.status === 'pending').length,
    totalPaid: agents.reduce((s, a) => s + (a.total_commissions_earned || 0), 0),
  }), [agents])

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><p className="font-bold text-slate-500">Chargement...</p></main>
  }

  if (!allowed) {
    return <main className="flex min-h-screen items-center justify-center"><p className="font-bold text-red-500">Accès non autorisé.</p></main>
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">SUPER ADMIN</p>
            <h1 className="text-3xl font-black text-slate-950">Gestion des Agents</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow hover:bg-emerald-700"
          >
            <Plus size={18} /> Nouvel agent
          </button>
        </div>

        {message && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total agents', value: stats.total, color: 'text-slate-950' },
            { label: 'Actifs', value: stats.active, color: 'text-emerald-700' },
            { label: 'En attente', value: stats.pending, color: 'text-amber-600' },
            { label: 'Commissions payées', value: cfa(stats.totalPaid), color: 'text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
              <p className={`mt-3 text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, pays..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-semibold outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'pending', label: 'En attente' },
            { key: 'active', label: 'Actifs' },
            { key: 'suspended', label: 'Suspendus' },
            { key: 'rejected', label: 'Rejetés' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${statusFilter === t.key ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Agents list */}
        <div className="space-y-3">
          {filtered.map((agent) => {
            const thisMonth = leadsCountMap[agent.id] || 0
            return (
              <div key={agent.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-black text-emerald-700">
                      {agent.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-black text-slate-950">{agent.full_name}</p>
                        {statusBadge(agent.status)}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{agent.email}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                        {agent.city && <span>{agent.city}</span>}
                        {agent.country && <span>{agent.country}</span>}
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-black text-slate-600">{agent.invite_code}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 sm:items-end">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-950">{thisMonth}/20 ce mois</p>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${thisMonth >= 20 ? 'bg-emerald-500' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min(100, (thisMonth / 20) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agent.status === 'pending' && (
                        <>
                          <button
                            onClick={() => requestStatusChange(agent, 'active', 'Activer')}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={13} /> Activer
                          </button>
                          <button
                            onClick={() => requestStatusChange(agent, 'rejected', 'Rejeter')}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {agent.status === 'suspended' && (
                        <button
                          onClick={() => requestStatusChange(agent, 'active', 'Réactiver')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} /> Réactiver
                        </button>
                      )}
                      {agent.status === 'active' && (
                        <button
                          onClick={() => requestStatusChange(agent, 'suspended', 'Suspendre')}
                          className="flex items-center gap-1.5 rounded-xl border border-orange-200 px-3 py-2 text-xs font-black text-orange-600 hover:bg-orange-50"
                        >
                          <PauseCircle size={13} /> Suspendre
                        </button>
                      )}
                      {agent.status === 'rejected' && (
                        <button
                          onClick={() => requestStatusChange(agent, 'active', 'Activer')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} /> Activer
                        </button>
                      )}
                      <button
                        onClick={() => viewLeads(agent.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700"
                      >
                        <Users size={13} /> Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white py-12 text-center">
              <p className="font-bold text-slate-400">Aucun agent trouvé.</p>
            </div>
          )}
        </div>

        {/* Pending Commissions */}
        {commissions.length > 0 && (
          <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-950">Commissions en attente ({commissions.length})</h2>
            <div className="space-y-3">
              {commissions.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{c.agents?.full_name || '—'}</p>
                      <p className="text-sm text-slate-500">{c.agents?.email} · {c.month}</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {c.signups_count} inscriptions · <span className="text-emerald-700">{cfa(c.amount)}</span>
                      </p>
                    </div>
                    {payingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value)}
                          placeholder="Méthode (Wave, Orange...)"
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                        />
                        <input
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          placeholder="Référence (opt.)"
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => markCommissionPaid(c.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => { setPayingId(null); setPayMethod(''); setPayRef('') }}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPayingId(c.id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                      >
                        Marquer comme payé
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Create Agent Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="mb-5 text-2xl font-black text-slate-950">Créer un agent</h2>
            <form onSubmit={createAgent} className="space-y-4">
              {['full_name', 'email', 'phone', 'city'].map((field) => (
                <div key={field}>
                  <label className="text-sm font-black text-slate-700 capitalize">
                    {field === 'full_name' ? 'Nom complet' : field === 'email' ? 'Email' : field === 'phone' ? 'Téléphone' : 'Ville'}
                    {['full_name', 'email'].includes(field) ? ' *' : ''}
                  </label>
                  <input
                    required={['full_name', 'email'].includes(field)}
                    type={field === 'email' ? 'email' : 'text'}
                    value={(newAgent as any)[field]}
                    onChange={(e) => setNewAgent((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {creating ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 font-black text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Leads Modal */}
      {viewLeadsAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setViewLeadsAgent(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">
                Leads — {agents.find((a) => a.id === viewLeadsAgent)?.full_name}
              </h2>
              <button onClick={() => setViewLeadsAgent(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">
                Fermer
              </button>
            </div>
            {agentLeads.length === 0 ? (
              <p className="py-8 text-center font-bold text-slate-400">Aucun lead trouvé.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-100">
                      {['Boutique', 'Email', 'Pays', 'Date', 'Statut'].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-left text-xs font-black uppercase text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agentLeads.map((l) => (
                      <tr key={l.id}>
                        <td className="py-3 pr-4 font-bold">{l.business_name || '—'}</td>
                        <td className="py-3 pr-4 text-slate-500">{l.email || '—'}</td>
                        <td className="py-3 pr-4 text-slate-500">{l.country || '—'}</td>
                        <td className="py-3 pr-4 text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-black ${l.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {l.status === 'paid' ? 'Payé' : 'Inscrit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm status change */}
      {confirmChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => !applyingChange && setConfirmChange(null)}>
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-slate-950">{confirmChange.label} cet agent ?</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              {confirmChange.agent.full_name} ({confirmChange.agent.email})
              {confirmChange.agent.phone ? ' sera notifié par WhatsApp.' : '.'}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={applyStatusChange}
                disabled={applyingChange}
                className="flex-1 rounded-2xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {applyingChange ? 'Application...' : `Confirmer : ${confirmChange.label}`}
              </button>
              <button
                onClick={() => setConfirmChange(null)}
                disabled={applyingChange}
                className="flex-1 rounded-2xl border border-slate-200 py-3 font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
