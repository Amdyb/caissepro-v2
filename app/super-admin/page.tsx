'use client'

import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, BarChart3, Building2, CheckCircle, CreditCard, Mail, Shield, UserPlus, Users, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const FOUNDER_EMAILS = [
  'infos@dakarvapes.com'
]

function cfa(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} CFA`
}

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [adminRole, setAdminRole] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [proofs, setProofs] = useState<any[]>([])
  const [errors, setErrors] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'support' | 'analyst'>('support')
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }

      const userEmail = userData.user.email || ''

      if (FOUNDER_EMAILS.includes(userEmail)) {
        setAllowed(true)
        setAdminRole('founder')
      } else {
        const { data: admin } = await supabase
          .from('platform_admins')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (!admin) { setAllowed(false); setLoading(false); return }
        setAllowed(true)
        setAdminRole(admin.role)
      }

      await loadAll()
      setLoading(false)
    }
    init()
  }, [])

  async function loadAll() {
    const [businessResult, proofResult, errorResult, adminResult] = await Promise.all([
      supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('subscription_payment_proofs').select('*, businesses(name, slug)').order('created_at', { ascending: false }).limit(100),
      supabase.from('app_error_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('platform_admins').select('*').order('created_at', { ascending: false }).limit(50)
    ])

    setBusinesses(businessResult.data || [])
    setProofs(proofResult.data || [])
    setErrors(errorResult.data || [])
    setAdmins(adminResult.data || [])
  }

  async function updateProofStatus(id: string, status: 'approved' | 'rejected') {
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const proof = proofs.find((p) => p.id === id)

    const { error } = await supabase
      .from('subscription_payment_proofs')
      .update({ status, reviewed_by: userData.user?.id || null, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) { flash(error.message); return }

    if (status === 'approved' && proof?.business_id) {
      const now = new Date()
      const expires = new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000)
      await supabase.from('subscriptions').delete().eq('business_id', proof.business_id)
      await supabase.from('subscriptions').insert({
        business_id: proof.business_id,
        plan: proof.plan,
        status: 'active',
        starts_at: now.toISOString(),
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
      })
      await supabase.from('businesses').update({ plan: proof.plan }).eq('id', proof.business_id)
    }

    setProofs((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    flash(status === 'approved' ? 'Abonnement validé.' : 'Paiement rejeté.')
  }

  async function inviteAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)

    const { data: userData } = await supabase.auth.getUser()

    let targetUser: any = null
    try {
      const { data } = await supabase
        .from('auth_users_view' as any)
        .select('id')
        .eq('email', inviteEmail.trim())
        .maybeSingle()
      targetUser = data
    } catch {}

    if (!targetUser) {
      const { error } = await supabase.from('platform_admins').insert({
        user_id: inviteEmail.trim(),
        role: inviteRole,
        status: 'active'
      })
      if (error && !error.message.includes('duplicate')) {
        flash(`Erreur: ${error.message}`)
        setInviting(false)
        return
      }
    } else {
      const { error } = await supabase.from('platform_admins').insert({
        user_id: (targetUser as any).id,
        role: inviteRole,
        status: 'active'
      })
      if (error) { flash(error.message); setInviting(false); return }
    }

    setInviteEmail('')
    await loadAll()
    flash(`Admin ${inviteRole} ajouté avec succès.`)
    setInviting(false)
  }

  async function removeAdmin(id: string) {
    setRemovingId(id)
    const { error } = await supabase.from('platform_admins').update({ status: 'inactive' }).eq('id', id)
    setRemovingId(null)
    if (error) { flash(error.message); return }
    setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, status: 'inactive' } : a))
    flash('Admin désactivé.')
  }

  const stats = useMemo(() => {
    const pendingProofs = proofs.filter((p) => p.status === 'pending').length
    const approvedRevenue = proofs.filter((p) => p.status === 'approved').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    return { pendingProofs, approvedRevenue }
  }, [proofs])

  const supportAdmins = admins.filter((a) => a.role !== 'founder' && a.status === 'active')
  const pendingProofs = proofs.filter((p) => p.status === 'pending')
  const isFounder = adminRole === 'founder'

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><p className="font-black">Chargement Super Admin...</p></main>

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <Shield className="mx-auto text-red-400" size={56} />
          <h1 className="mt-5 text-3xl font-black">Accès refusé</h1>
          <p className="mt-3 text-sm font-semibold text-white/60">Cette zone est réservée aux administrateurs CaissePro.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white">Retour</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 px-5 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">CAISSEPRO CONTROL CENTER</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">Super Admin</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-emerald-300 capitalize">{adminRole}</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {isFounder && (
            <Link href="/super-admin/businesses" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:scale-[1.02] hover:border-emerald-400/40">
              <Building2 className="text-emerald-300" />
              <p className="mt-5 text-sm font-bold text-white/50">Businesses</p>
              <p className="mt-2 text-4xl font-black">{businesses.length}</p>
            </Link>
          )}

          <div className={`rounded-[2rem] border p-6 ${pendingProofs.length > 0 ? 'border-amber-400/40 bg-amber-400/5' : 'border-white/10 bg-white/5'}`}>
            <CreditCard className={pendingProofs.length > 0 ? 'text-amber-300' : 'text-white/40'} />
            <p className="mt-5 text-sm font-bold text-white/50">Paiements à valider</p>
            <p className={`mt-2 text-4xl font-black ${pendingProofs.length > 0 ? 'text-amber-300' : ''}`}>{stats.pendingProofs}</p>
          </div>

          {isFounder && (
            <Link href="/super-admin/analytics" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:scale-[1.02] hover:border-emerald-400/40">
              <BarChart3 className="text-emerald-300" />
              <p className="mt-5 text-sm font-bold text-white/50">Revenus validés</p>
              <p className="mt-2 text-3xl font-black">{cfa(stats.approvedRevenue)}</p>
            </Link>
          )}

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <Users className="text-sky-300" />
            <p className="mt-5 text-sm font-bold text-white/50">Admins support</p>
            <p className="mt-2 text-4xl font-black">{supportAdmins.length}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black">Validation abonnements</h2>
                <Link href="/admin/upgrade-requests" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Ouvrir</Link>
              </div>

              {pendingProofs.length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-200">
                  {pendingProofs.length} paiement(s) en attente de validation.
                </div>
              )}

              <div className="space-y-4">
                {proofs.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 p-5 text-sm font-bold text-white/50">Aucune preuve de paiement.</p>
                ) : (
                  proofs.slice(0, 10).map((proof) => (
                    <div key={proof.id} className={`rounded-3xl border p-5 ${proof.status === 'pending' ? 'border-amber-400/20 bg-slate-900' : 'border-white/5 bg-white/5'}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-xl font-black">{proof.businesses?.name || 'Business'}</p>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${proof.status === 'pending' ? 'bg-amber-400/20 text-amber-300' : proof.status === 'approved' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
                              {proof.status === 'pending' ? 'En attente' : proof.status === 'approved' ? 'Validé' : 'Rejeté'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-bold text-white/50">Plan {proof.plan} · {cfa(proof.amount)}</p>
                        </div>
                        {proof.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => updateProofStatus(proof.id, 'approved')} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black hover:bg-emerald-500">
                              <CheckCircle size={15} /> Valider
                            </button>
                            <button onClick={() => updateProofStatus(proof.id, 'rejected')} className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black hover:bg-red-500">
                              <X size={15} /> Rejeter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isFounder && (
              <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <UserPlus className="text-emerald-300" size={22} />
                  <h2 className="text-2xl font-black">Inviter un admin</h2>
                </div>

                <form onSubmit={inviteAdmin} className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-white/60">Email de l'admin</label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-4 top-3.5 text-white/30" size={16} />
                      <input
                        required
                        type="email"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
                        placeholder="admin@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-white/60">Rôle</label>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => setInviteRole('support')} className={`flex-1 rounded-2xl border py-3 text-sm font-black transition ${inviteRole === 'support' ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}>
                        Support
                      </button>
                      <button type="button" onClick={() => setInviteRole('analyst')} className={`flex-1 rounded-2xl border py-3 text-sm font-black transition ${inviteRole === 'analyst' ? 'border-sky-400/50 bg-sky-400/10 text-sky-300' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}>
                        Analyst
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-white/30">
                      {inviteRole === 'support' ? 'Peut valider les abonnements' : 'Accès lecture seule aux analytics'}
                    </p>
                  </div>

                  <button disabled={inviting} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white hover:bg-emerald-500 disabled:opacity-60">
                    {inviting ? 'Ajout...' : 'Inviter l\'admin'}
                  </button>
                </form>
              </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="mb-5 text-2xl font-black">Équipe admin</h2>
              <div className="space-y-3">
                {admins.length === 0 ? (
                  <p className="text-sm font-bold text-white/50">Aucun admin interne.</p>
                ) : (
                  admins.map((a) => (
                    <div key={a.id} className={`flex items-center justify-between rounded-2xl p-4 ${a.status === 'active' ? 'bg-white/5' : 'bg-white/[0.02] opacity-50'}`}>
                      <div>
                        <p className="text-sm font-black">{a.user_id?.slice?.(0, 20) || 'user'}...</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${a.role === 'founder' ? 'bg-emerald-400/20 text-emerald-300' : a.role === 'support' ? 'bg-sky-400/20 text-sky-300' : 'bg-white/10 text-white/50'}`}>
                            {a.role}
                          </span>
                          <span className={`text-[10px] font-bold ${a.status === 'active' ? 'text-emerald-400' : 'text-white/30'}`}>
                            {a.status === 'active' ? 'actif' : 'inactif'}
                          </span>
                        </div>
                      </div>
                      {isFounder && a.status === 'active' && a.role !== 'founder' && (
                        <button onClick={() => removeAdmin(a.id)} disabled={removingId === a.id} className="rounded-xl bg-red-600/20 p-2 text-red-400 hover:bg-red-600/30 disabled:opacity-40">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {isFounder && (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-black">
                  <Building2 className="text-emerald-300" size={20} /> Businesses récents
                </h2>
                <div className="space-y-3">
                  {businesses.slice(0, 6).map((b) => (
                    <Link key={b.id} href={`/super-admin/businesses/${b.id}`} className="block rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                      <p className="font-black">{b.name || 'Sans nom'}</p>
                      <p className="text-xs font-bold text-white/40">/{b.slug || 'no-slug'} · {b.business_type || 'retail'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isFounder && (
              <div className="rounded-[2rem] border border-red-400/20 bg-red-400/5 p-6">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><AlertTriangle className="text-red-300" />Erreurs récentes</h2>
                <div className="space-y-3">
                  {errors.length === 0 ? (
                    <p className="text-sm font-bold text-white/50">Aucune erreur récente.</p>
                  ) : (
                    errors.map((e) => (
                      <div key={e.id} className="rounded-2xl bg-black/20 p-4">
                        <p className="text-sm font-black text-red-200">{e.source || 'unknown'}</p>
                        <p className="mt-1 text-xs font-bold text-white/50">{e.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
