'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, CalendarClock, Filter, History, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type AuditLog = {
  id: string
  business_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: any
  new_data: any
  metadata: any
  created_at: string
}

const actionLabels: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  refund: 'Remboursement',
  price_change: 'Changement prix',
  stock_change: 'Changement stock',
  login: 'Connexion',
  sale_cancel: 'Vente annulée'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getActionTone(action: string) {
  if (['delete', 'refund', 'sale_cancel'].includes(action)) return 'border-red-200 bg-red-50 text-red-700'
  if (['price_change', 'stock_change'].includes(action)) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', membership.business_id)
        .order('created_at', { ascending: false })
        .limit(300)

      if (error) {
        setMessage(error.message)
      } else {
        setLogs((data || []) as AuditLog[])
      }

      setLoading(false)
    }

    init()
  }, [])

  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))), [logs])
  const entities = useMemo(() => Array.from(new Set(logs.map((log) => log.entity_type).filter(Boolean))), [logs])

  const filteredLogs = useMemo(() => {
    const q = query.toLowerCase().trim()
    return logs.filter((log) => {
      const matchesQuery = !q || [log.action, log.entity_type, log.entity_id, JSON.stringify(log.metadata || {})]
        .join(' ')
        .toLowerCase()
        .includes(q)
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter
      return matchesQuery && matchesAction && matchesEntity
    })
  }, [logs, query, actionFilter, entityFilter])

  const suspicious = useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recent = logs.filter((log) => new Date(log.created_at).getTime() >= oneHourAgo)
    const refunds = recent.filter((log) => log.action === 'refund').length
    const deletes = recent.filter((log) => log.action === 'delete').length
    const priceChanges = recent.filter((log) => log.action === 'price_change').length
    const stockChanges = recent.filter((log) => log.action === 'stock_change').length

    const alerts = []
    if (refunds >= 5) alerts.push(`${refunds} remboursements en moins d’une heure`)
    if (deletes >= 5) alerts.push(`${deletes} suppressions en moins d’une heure`)
    if (priceChanges >= 10) alerts.push(`${priceChanges} changements de prix récents`)
    if (stockChanges >= 10) alerts.push(`${stockChanges} changements de stock récents`)
    return alerts
  }, [logs])

  return (
    <AppShell title="Activité" subtitle="Historique des actions, sécurité et contrôle employés.">
      <div className="mx-auto max-w-7xl">
        {message && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <History className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Actions enregistrées</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{logs.length}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <UserRound className="text-sky-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Types d’actions</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{actions.length}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="text-violet-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Entités suivies</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{entities.length}</p>
          </div>
          <div className={`rounded-[2rem] border p-6 shadow-sm ${suspicious.length ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <AlertTriangle className={suspicious.length ? 'text-red-600' : 'text-emerald-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Alertes suspectes</p>
            <p className={`mt-2 text-4xl font-black ${suspicious.length ? 'text-red-700' : 'text-emerald-700'}`}>{suspicious.length}</p>
          </div>
        </div>

        {suspicious.length > 0 && (
          <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6">
            <h2 className="flex items-center gap-2 text-2xl font-black text-red-700"><AlertTriangle /> Activité à vérifier</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {suspicious.map((alert) => <div key={alert} className="rounded-2xl bg-white p-4 text-sm font-black text-red-700 shadow-sm">⚠ {alert}</div>)}
            </div>
          </div>
        )}

        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher action, produit, employé..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 font-semibold outline-none"
              />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-black outline-none">
              <option value="all">Toutes actions</option>
              {actions.map((action) => <option key={action} value={action}>{actionLabels[action] || action}</option>)}
            </select>
            <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-black outline-none">
              <option value="all">Toutes entités</option>
              {entities.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
            </select>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-950">Journal d’activité</h2>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400"><Filter size={14} /> {filteredLogs.length} résultat(s)</div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center font-black text-slate-500">Chargement activité...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center">
              <History className="mx-auto text-slate-300" size={56} />
              <h3 className="mt-4 text-2xl font-black text-slate-950">Aucune activité trouvée</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">Les actions apparaîtront ici lorsque les ventes, produits et employés seront suivis.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${getActionTone(log.action)}`}>{actionLabels[log.action] || log.action}</span>
                        <h3 className="text-xl font-black text-slate-950">{log.entity_type}</h3>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-500">ID: {log.entity_id || 'N/A'} · Employé: {log.user_id || 'Système'}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-500 shadow-sm">
                      <CalendarClock size={14} /> {formatDate(log.created_at)}
                    </div>
                  </div>

                  {(log.old_data || log.new_data) && (
                    <details className="mt-4 rounded-2xl bg-white p-4 text-xs font-mono text-slate-600">
                      <summary className="cursor-pointer font-black text-slate-900">Voir détails</summary>
                      <pre className="mt-3 overflow-auto whitespace-pre-wrap">{JSON.stringify({ old_data: log.old_data, new_data: log.new_data, metadata: log.metadata }, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
