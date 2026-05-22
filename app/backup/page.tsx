'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Archive, CalendarClock, Cloud, Database, Download, FileSpreadsheet, History, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Backup = {
  id: string
  business_id: string | null
  backup_type: string | null
  storage_path: string | null
  file_size: number | null
  status: string | null
  created_by: string | null
  created_at: string
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const exportOptions = [
  { key: 'products', title: 'Produits & Stock', description: 'Exporter inventaire, prix, catégories et quantités.', icon: FileSpreadsheet },
  { key: 'sales', title: 'Ventes', description: 'Exporter ventes, reçus, paiements et remboursements.', icon: Download },
  { key: 'customers', title: 'Clients', description: 'Exporter clients, téléphones, dettes et historique.', icon: Archive },
  { key: 'debts', title: 'Client Doit', description: 'Exporter soldes impayés et remboursements.', icon: ShieldCheck },
  { key: 'laundry', title: 'Pressing / Tickets', description: 'Exporter tickets, statuts, dates de retrait et paiements.', icon: History },
  { key: 'full', title: 'Backup complet', description: 'Préparer une sauvegarde complète du commerce.', icon: Database }
]

export default function BackupPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
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
        .from('business_backups')
        .select('*')
        .eq('business_id', membership.business_id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) setMessage(error.message)
      setBackups((data || []) as Backup[])
      setLoading(false)
    }

    init()
  }, [])

  async function createManualBackup() {
    if (!businessId) return
    setCreating(true)
    setMessage('')

    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('business_backups')
      .insert({
        business_id: businessId,
        backup_type: 'manual',
        storage_path: null,
        file_size: null,
        status: 'queued',
        created_by: userData.user?.id || null
      })
      .select('*')
      .single()

    setCreating(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setBackups((prev) => [data as Backup, ...prev])
    setMessage('Sauvegarde manuelle demandée. Le système de génération automatique sera connecté ensuite.')
  }

  async function requestExport(type: string) {
    if (!businessId) return
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('business_backups').insert({
      business_id: businessId,
      backup_type: `export_${type}`,
      status: 'queued',
      created_by: userData.user?.id || null
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(`Export ${type} demandé. Le fichier sera généré par le worker d’export.`)
  }

  const stats = useMemo(() => {
    const completed = backups.filter((backup) => backup.status === 'completed').length
    const queued = backups.filter((backup) => backup.status === 'queued').length
    const failed = backups.filter((backup) => backup.status === 'failed').length
    return { completed, queued, failed }
  }, [backups])

  return (
    <AppShell title="Sauvegarde & Export" subtitle="Sécurisez et exportez les données de votre commerce.">
      <div className="mx-auto max-w-7xl">
        {message && (
          <div className={`mb-6 rounded-2xl p-4 text-sm font-bold ${message.includes('demand') || message.includes('Sauvegarde') ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                <ShieldCheck size={15} /> Centre de confiance
              </div>
              <h1 className="text-5xl font-black tracking-tight text-slate-950">Vos données restent protégées.</h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
                Préparez les sauvegardes, exports Excel/CSV et futures restaurations de votre commerce.
              </p>
            </div>
            <button
              onClick={createManualBackup}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-5 text-sm font-black text-white shadow-xl disabled:opacity-60"
            >
              <Cloud size={20} />
              {creating ? 'Demande...' : 'Créer sauvegarde manuelle'}
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Database className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Sauvegardes</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{backups.length}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="text-green-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Terminés</p>
            <p className="mt-2 text-4xl font-black text-green-700">{stats.completed}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <RefreshCcw className="text-amber-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">En attente</p>
            <p className="mt-2 text-4xl font-black text-amber-700">{stats.queued}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <CalendarClock className="text-sky-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Planifié</p>
            <p className="mt-2 text-4xl font-black text-sky-700">Bientôt</p>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Exports disponibles</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Demandez un export. Le worker générera les fichiers téléchargeables dans la prochaine phase.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {exportOptions.map((option) => {
              const Icon = option.icon
              return (
                <div key={option.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 inline-flex rounded-2xl bg-white p-4 text-emerald-700 shadow-sm"><Icon size={24} /></div>
                  <h3 className="text-xl font-black text-slate-950">{option.title}</h3>
                  <p className="mt-2 min-h-[44px] text-sm font-semibold text-slate-500">{option.description}</p>
                  <button onClick={() => requestExport(option.key)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white">
                    <Download size={17} /> Demander export
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-950">Historique sauvegardes & exports</h2>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">{backups.length} élément(s)</span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center font-black text-slate-500">Chargement sauvegardes...</div>
          ) : backups.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-12 text-center">
              <Archive className="mx-auto text-slate-300" size={60} />
              <h3 className="mt-4 text-2xl font-black text-slate-950">Aucun backup encore</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">Créez un backup manuel ou demandez un export pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{backup.backup_type || 'backup'}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${backup.status === 'completed' ? 'bg-green-100 text-green-700' : backup.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{backup.status || 'unknown'}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-500">{formatDate(backup.created_at)} · Taille: {formatBytes(backup.file_size)}</p>
                    {backup.storage_path && <p className="mt-1 break-all text-xs font-bold text-slate-400">{backup.storage_path}</p>}
                  </div>
                  <button disabled={!backup.storage_path} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                    <Download size={17} /> Télécharger
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
