'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext, type AdminContext } from '@/lib/superAdmin'
import ResetPasswordButton from '@/components/ResetPasswordButton'
import {
  AlertTriangle, Archive, ArchiveRestore, Check, Crown, Package,
  Search, ShieldCheck, ShoppingCart, Store,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const PLANS = ['free', 'starter', 'business', 'premium']

type ArchiveTab = 'actives' | 'archivees' | 'toutes'

type Business = {
  id: string
  name: string | null
  slug: string | null
  email: string | null
  business_type: string | null
  status: string | null
  plan: string | null
  archived: boolean
  archived_at: string | null
  created_at: string
  whatsapp?: string | null
  whatsapp_number?: string | null
  business_phone?: string | null
  phone?: string | null
  product_count: number
  sale_count: number
}

function fmtDate(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ownerPhone(b: Business): string | null {
  return b.whatsapp || b.whatsapp_number || b.business_phone || b.phone || null
}

export default function SuperAdminBusinessesPage() {
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [ctx, setCtx] = useState<AdminContext | null>(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<ArchiveTab>('actives')
  const [message, setMessage] = useState('')

  // Single archive confirm
  const [confirmArchive, setConfirmArchive] = useState<Business | null>(null)
  const [working, setWorking] = useState(false)

  // Bulk selection (only on Actives tab)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)

  useEffect(() => {
    async function init() {
      const [adminCtx] = await Promise.all([getAdminContext(), load()])
      setCtx(adminCtx)
    }
    init()
  }, [])

  async function load() {
    // Load businesses with embedded product and sale counts.
    const { data } = await supabase
      .from('businesses')
      .select('*, products(count), sales(count)')
      .order('created_at', { ascending: false })
      .limit(500)

    const shaped: Business[] = (data || []).map((b: any) => ({
      ...b,
      archived: b.archived ?? false,
      product_count: Number(b.products?.[0]?.count ?? 0),
      sale_count: Number(b.sales?.[0]?.count ?? 0),
    }))

    // Sort: most sales first, then most products.
    shaped.sort((a, b) =>
      b.sale_count - a.sale_count || b.product_count - a.product_count
    )

    setBusinesses(shaped)
    setLoading(false)
  }

  function showMessage(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  // Founders and admins can archive; analysts and agent_managers cannot.
  const canArchive = ctx?.role === 'super_admin' || ctx?.role === 'admin'

  async function setArchived(id: string, archive: boolean) {
    const patch = archive
      ? { archived: true, archived_at: new Date().toISOString() }
      : { archived: false, archived_at: null }

    const { error } = await supabase.from('businesses').update(patch).eq('id', id)
    if (error) { showMessage(`Erreur: ${error.message}`); return false }
    return true
  }

  async function doArchiveSingle() {
    if (!confirmArchive) return
    setWorking(true)
    const ok = await setArchived(confirmArchive.id, true)
    if (ok) {
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === confirmArchive.id
            ? { ...b, archived: true, archived_at: new Date().toISOString() }
            : b
        )
      )
      showMessage(`"${confirmArchive.name}" archivée.`)
      setSelected((prev) => { const s = new Set(prev); s.delete(confirmArchive.id); return s })
    }
    setWorking(false)
    setConfirmArchive(null)
  }

  async function doUnarchive(business: Business) {
    const ok = await setArchived(business.id, false)
    if (ok) {
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === business.id ? { ...b, archived: false, archived_at: null } : b
        )
      )
      showMessage(`"${business.name}" désarchivée.`)
    }
  }

  async function doBulkArchive() {
    setWorking(true)
    setConfirmBulk(false)
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => setArchived(id, true)))
    const now = new Date().toISOString()
    setBusinesses((prev) =>
      prev.map((b) =>
        ids.includes(b.id) ? { ...b, archived: true, archived_at: now } : b
      )
    )
    setSelected(new Set())
    showMessage(`${ids.length} boutique${ids.length > 1 ? 's' : ''} archivée${ids.length > 1 ? 's' : ''}.`)
    setWorking(false)
  }

  async function toggleStatus(business: Business) {
    const nextStatus = business.status === 'suspended' ? 'active' : 'suspended'
    const { error } = await supabase
      .from('businesses').update({ status: nextStatus }).eq('id', business.id)
    if (error) { showMessage(`Erreur: ${error.message}`); return }
    setBusinesses((prev) => prev.map((b) => b.id === business.id ? { ...b, status: nextStatus } : b))
    showMessage(nextStatus === 'suspended' ? 'Boutique suspendue.' : 'Boutique réactivée.')
  }

  async function changePlan(business: Business, plan: string) {
    if (plan === (business.plan || 'free')) return
    const { error } = await supabase.from('businesses').update({ plan }).eq('id', business.id)
    if (error) { showMessage(`Erreur: ${error.message}`); return }
    if (plan === 'free') {
      await supabase.from('subscriptions').delete().eq('business_id', business.id)
    } else {
      await supabase.from('subscriptions').delete().eq('business_id', business.id)
      await supabase.from('subscriptions').insert({ business_id: business.id, plan, status: 'active' })
    }
    setBusinesses((prev) => prev.map((b) => b.id === business.id ? { ...b, plan } : b))
    showMessage(`Plan de "${business.name}" mis à jour : ${plan}.`)
  }

  const counts = useMemo(() => ({
    actives: businesses.filter((b) => !b.archived).length,
    archivees: businesses.filter((b) => b.archived).length,
    toutes: businesses.length,
  }), [businesses])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return businesses.filter((b) => {
      if (tab === 'actives' && b.archived) return false
      if (tab === 'archivees' && !b.archived) return false
      if (!q) return true
      return (
        (b.name || '').toLowerCase().includes(q) ||
        (b.slug || '').toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q)
      )
    })
  }, [businesses, search, tab])

  // Clear selection when tab changes
  function switchTab(t: ArchiveTab) {
    setTab(t)
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map((b) => b.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  if (loading) {
    return <div className="px-5 py-10 font-black text-white/70">Chargement boutiques...</div>
  }

  const TABS: { key: ArchiveTab; label: string; count: number }[] = [
    { key: 'actives',   label: 'Actives',    count: counts.actives },
    { key: 'archivees', label: 'Archivées',  count: counts.archivees },
    { key: 'toutes',    label: 'Toutes',     count: counts.toutes },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/15 p-3">
          <Store className="text-emerald-300" size={26} />
        </div>
        <div>
          <h1 className="text-3xl font-black">Boutiques</h1>
          <p className="text-sm font-semibold text-white/50">Gestion globale des boutiques.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
          {message}
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { icon: Store,       label: 'Total',     value: counts.toutes,    color: 'text-white' },
          { icon: ShieldCheck, label: 'Actives',   value: counts.actives,   color: 'text-emerald-300' },
          { icon: Archive,     label: 'Archivées', value: counts.archivees, color: 'text-orange-300' },
          { icon: Crown,       label: 'Premium',   value: businesses.filter((b) => (b.plan || 'free') === 'premium').length, color: 'text-amber-300' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <Icon className={color} />
            <p className="mt-3 text-xs font-black uppercase text-white/50">{label}</p>
            <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, slug, email..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
          />
        </div>
        <div className="flex gap-2">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                tab === key
                  ? 'bg-emerald-600 text-white'
                  : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar — only on Actives tab */}
      {tab === 'actives' && canArchive && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={selected.size === filtered.length ? clearSelection : selectAll}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/50 hover:bg-white/5"
          >
            {selected.size === filtered.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          {selected.size > 0 && (
            <>
              <span className="text-xs font-bold text-white/50">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
              <button
                onClick={() => setConfirmBulk(true)}
                className="flex items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2 text-xs font-black text-orange-300 hover:bg-orange-500/30"
              >
                <Archive size={14} />
                Archiver la sélection
              </button>
              <button onClick={clearSelection} className="text-xs font-bold text-white/30 hover:text-white/60">
                Annuler
              </button>
            </>
          )}
        </div>
      )}

      {/* Business list */}
      <div className="space-y-4">
        {filtered.map((business) => {
          const plan = business.plan || 'free'
          const status = business.status || 'active'
          const isArchived = business.archived
          const isSelected = selected.has(business.id)

          return (
            <div
              key={business.id}
              className={`rounded-3xl border p-5 transition ${
                isArchived
                  ? 'border-white/5 bg-white/[0.02] opacity-60'
                  : isSelected
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  {/* Checkbox — only on Actives tab for archivable roles */}
                  {tab === 'actives' && canArchive && !isArchived && (
                    <button
                      onClick={() => toggleSelect(business.id)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </button>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/super-admin/businesses/${business.id}`}
                        className={`text-xl font-black hover:text-emerald-300 ${isArchived ? 'text-white/50' : 'text-white'}`}
                      >
                        {business.name || 'Sans nom'}
                      </Link>
                      {isArchived ? (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/40">ARCHIVÉ</span>
                      ) : (
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${status === 'suspended' ? 'bg-orange-400/20 text-orange-300' : 'bg-emerald-400/20 text-emerald-300'}`}>
                          {status === 'suspended' ? 'SUSPENDU' : 'ACTIF'}
                        </span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${plan === 'premium' ? 'bg-amber-400/20 text-amber-300' : plan === 'free' ? 'bg-white/10 text-white/50' : 'bg-sky-400/20 text-sky-300'}`}>
                        {plan.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-white/50">
                      /{business.slug || 'no-slug'} · {business.business_type || 'retail'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-white/30">
                      {business.email && <span>{business.email}</span>}
                      <span>Créée le {fmtDate(business.created_at)}</span>
                      {isArchived && business.archived_at && (
                        <span className="text-orange-300/60">Archivée le {fmtDate(business.archived_at)}</span>
                      )}
                    </div>
                    {/* Activity counts */}
                    <div className="mt-2 flex items-center gap-4 text-xs font-bold">
                      <span className={`flex items-center gap-1 ${business.sale_count > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                        <ShoppingCart size={12} />
                        {business.sale_count} vente{business.sale_count !== 1 ? 's' : ''}
                      </span>
                      <span className={`flex items-center gap-1 ${business.product_count > 0 ? 'text-sky-400' : 'text-white/20'}`}>
                        <Package size={12} />
                        {business.product_count} produit{business.product_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={plan}
                    onChange={(e) => changePlan(business, e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-black text-white outline-none focus:border-emerald-400/50"
                  >
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>

                  {business.slug?.trim() ? (
                    <Link
                      href={`/store/${business.slug}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white/70 hover:bg-white/10"
                    >
                      Voir boutique
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm font-black text-white/30">
                      Sans lien public
                    </span>
                  )}

                  <ResetPasswordButton businessId={business.id} name={business.name ?? undefined} phone={ownerPhone(business) ?? undefined} />

                  {!isArchived && (
                    <button
                      onClick={() => toggleStatus(business)}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-black text-white ${status === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                      {status === 'suspended' ? 'Activer' : 'Désactiver'}
                    </button>
                  )}

                  {/* Archive / Désarchiver — founders and admins only */}
                  {canArchive && (
                    isArchived ? (
                      <button
                        onClick={() => doUnarchive(business)}
                        className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-black text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <ArchiveRestore size={16} />
                        Désarchiver
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmArchive(business)}
                        className="flex items-center gap-2 rounded-2xl border border-orange-400/20 bg-white/5 px-4 py-2.5 text-sm font-black text-white/50 hover:bg-orange-500/10 hover:text-orange-300"
                      >
                        <Archive size={16} />
                        Archiver
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 py-12 text-center">
            <p className="font-bold text-white/40">Aucune boutique.</p>
          </div>
        )}
      </div>

      {/* Single archive confirmation */}
      {confirmArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !working && setConfirmArchive(null)}
        >
          <div
            className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-orange-300">
              <Archive size={20} />
              <h2 className="text-lg font-black">Archiver cette boutique ?</h2>
            </div>
            <p className="mt-3 text-sm font-bold text-white/60">
              <span className="font-black text-white">"{confirmArchive.name}"</span> sera masquée de la liste active.
              Aucune donnée ne sera supprimée — le marchand peut toujours se connecter et utiliser son compte.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={doArchiveSingle}
                disabled={working}
                className="flex-1 rounded-2xl bg-orange-600 py-3 font-black text-white hover:bg-orange-500 disabled:opacity-60"
              >
                {working ? '...' : 'Archiver'}
              </button>
              <button
                onClick={() => setConfirmArchive(null)}
                disabled={working}
                className="flex-1 rounded-2xl border border-white/10 py-3 font-black text-white/70 hover:bg-white/5"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk archive confirmation */}
      {confirmBulk && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !working && setConfirmBulk(false)}
        >
          <div
            className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-orange-300">
              <AlertTriangle size={20} />
              <h2 className="text-lg font-black">Archiver {selected.size} boutique{selected.size > 1 ? 's' : ''} ?</h2>
            </div>
            <p className="mt-3 text-sm font-bold text-white/60">
              Ces boutiques seront masquées de la liste active. Aucune donnée ne sera supprimée.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={doBulkArchive}
                disabled={working}
                className="flex-1 rounded-2xl bg-orange-600 py-3 font-black text-white hover:bg-orange-500 disabled:opacity-60"
              >
                {working ? '...' : `Archiver ${selected.size}`}
              </button>
              <button
                onClick={() => setConfirmBulk(false)}
                disabled={working}
                className="flex-1 rounded-2xl border border-white/10 py-3 font-black text-white/70 hover:bg-white/5"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
