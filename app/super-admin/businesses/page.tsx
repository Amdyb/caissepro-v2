'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, ArrowLeft, Building2, Crown, Search, ShieldCheck, Store, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']
const PLANS = ['free', 'starter', 'business', 'premium']

function fmtDate(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SuperAdminBusinessesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'active' | 'inactive' | 'premium'>('all')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    if (!SUPER_ADMIN_EMAILS.includes(userData.user.email || '')) { router.push('/dashboard'); return }

    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    setBusinesses(data || [])
    setLoading(false)
  }

  function showMessage(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  function ownerPhone(b: any): string | null {
    return b.whatsapp || b.whatsapp_number || b.business_phone || b.phone || null
  }

  async function notifyOwner(b: any, body: string) {
    const phone = ownerPhone(b)
    if (!phone) return
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, body }),
    }).catch(() => null)
  }

  async function toggleStatus(business: any) {
    const nextStatus = business.status === 'suspended' ? 'active' : 'suspended'
    const { data: updated, error } = await supabase
      .from('businesses').update({ status: nextStatus }).eq('id', business.id).select()

    if (error) { showMessage(`Erreur: ${error.message}`); return }
    if (!updated || updated.length === 0) { showMessage('Mise à jour refusée — permissions insuffisantes.'); return }

    setBusinesses((prev) => prev.map((b) => (b.id === business.id ? { ...b, status: nextStatus } : b)))
    showMessage(nextStatus === 'suspended' ? 'Boutique suspendue.' : 'Boutique réactivée.')
    await notifyOwner(business, nextStatus === 'suspended'
      ? `Bonjour, votre boutique "${business.name}" sur CaissePro a été suspendue. Contactez le support pour plus d'informations.`
      : `Bonjour, votre boutique "${business.name}" sur CaissePro a été réactivée. Bon travail !`)
  }

  async function changePlan(business: any, plan: string) {
    if (plan === (business.plan || 'free')) return
    // Update the businesses row
    const { error } = await supabase.from('businesses').update({ plan }).eq('id', business.id)
    if (error) { showMessage(`Erreur: ${error.message}`); return }

    // Reflect the change as an active subscription (replace any existing active one)
    if (plan === 'free') {
      await supabase.from('subscriptions').delete().eq('business_id', business.id)
    } else {
      await supabase.from('subscriptions').delete().eq('business_id', business.id)
      await supabase.from('subscriptions').insert({ business_id: business.id, plan, status: 'active' })
    }

    setBusinesses((prev) => prev.map((b) => (b.id === business.id ? { ...b, plan } : b)))
    showMessage(`Plan de "${business.name}" mis à jour : ${plan}.`)
  }

  async function doDelete() {
    if (!confirmDelete) return
    setWorking(true)
    // Soft-delete (archive) to avoid catastrophic cascade on production. Reversible.
    const { data: updated, error } = await supabase
      .from('businesses').update({ status: 'deleted' }).eq('id', confirmDelete.id).select()
    setWorking(false)
    if (error) { showMessage(`Erreur: ${error.message}`); setConfirmDelete(null); return }
    if (!updated || updated.length === 0) { showMessage('Suppression refusée — permissions insuffisantes.'); setConfirmDelete(null); return }
    setBusinesses((prev) => prev.map((b) => (b.id === confirmDelete.id ? { ...b, status: 'deleted' } : b)))
    showMessage(`Boutique "${confirmDelete.name}" archivée.`)
    setConfirmDelete(null)
  }

  const counts = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter((b) => b.status !== 'suspended' && b.status !== 'deleted').length,
    inactive: businesses.filter((b) => b.status === 'suspended' || b.status === 'deleted').length,
    premium: businesses.filter((b) => (b.plan || 'free') === 'premium').length,
  }), [businesses])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return businesses.filter((b) => {
      if (tab === 'active' && (b.status === 'suspended' || b.status === 'deleted')) return false
      if (tab === 'inactive' && b.status !== 'suspended' && b.status !== 'deleted') return false
      if (tab === 'premium' && (b.plan || 'free') !== 'premium') return false
      if (!q) return true
      return (b.name || '').toLowerCase().includes(q) || (b.slug || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q)
    })
  }, [businesses, search, tab])

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><p className="font-black">Chargement boutiques...</p></main>
  }

  return (
    <AppShell title="Super Admin — Boutiques" subtitle="Gestion globale des boutiques.">
      <div className="mx-auto max-w-7xl pb-20">
        <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
          <ArrowLeft size={18} /> Retour
        </button>

        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            { icon: Store, label: 'Total', value: counts.total, color: 'text-slate-950' },
            { icon: ShieldCheck, label: 'Actives', value: counts.active, color: 'text-emerald-600' },
            { icon: AlertTriangle, label: 'Inactives', value: counts.inactive, color: 'text-orange-500' },
            { icon: Crown, label: 'Premium', value: counts.premium, color: 'text-amber-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className={color} />
              <p className="mt-3 text-xs font-black uppercase text-slate-500">{label}</p>
              <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, slug, email..." className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 font-bold outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {([['all', 'Tous'], ['active', 'Actifs'], ['inactive', 'Inactifs'], ['premium', 'Premium']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${tab === key ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((business) => {
            const plan = business.plan || 'free'
            const status = business.status || 'active'
            return (
              <div key={business.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-black text-slate-950">{business.name || 'Sans nom'}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${status === 'deleted' ? 'bg-slate-200 text-slate-600' : status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {status === 'deleted' ? 'ARCHIVÉ' : status === 'suspended' ? 'SUSPENDU' : 'ACTIF'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${plan === 'premium' ? 'bg-amber-100 text-amber-700' : plan === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-700'}`}>{plan.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">/{business.slug || 'no-slug'} · {business.business_type || 'retail'}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                      {business.email && <span>{business.email}</span>}
                      <span>Créée le {fmtDate(business.created_at)}</span>
                      {business.subscription_status && <span>Abo: {business.subscription_status}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={plan}
                      onChange={(e) => changePlan(business, e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <Link href={`/store/${business.slug}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">Voir boutique</Link>
                    <button onClick={() => toggleStatus(business)} className={`rounded-2xl px-4 py-2.5 text-sm font-black text-white ${status === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                      {status === 'suspended' ? 'Activer' : 'Désactiver'}
                    </button>
                    <button onClick={() => setConfirmDelete(business)} className="rounded-2xl border border-red-200 p-2.5 text-red-500 hover:bg-red-50"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white py-12 text-center"><p className="font-bold text-slate-400">Aucune boutique.</p></div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => !working && setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-600"><AlertTriangle size={20} /><h2 className="text-lg font-black">Archiver cette boutique ?</h2></div>
            <p className="mt-2 text-sm font-bold text-slate-500">
              "{confirmDelete.name}" sera archivée (statut «supprimé»). Action réversible — les données ne sont pas effacées.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={doDelete} disabled={working} className="flex-1 rounded-2xl bg-red-600 py-3 font-black text-white hover:bg-red-700 disabled:opacity-60">{working ? '...' : 'Archiver'}</button>
              <button onClick={() => setConfirmDelete(null)} disabled={working} className="flex-1 rounded-2xl border border-slate-200 py-3 font-black text-slate-700 hover:bg-slate-50">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
