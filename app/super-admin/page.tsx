'use client'

import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, BarChart3, Building2, CheckCircle, CreditCard, Shield, Users } from 'lucide-react'
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

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setLoading(false)
        return
      }

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

        if (!admin) {
          setAllowed(false)
          setLoading(false)
          return
        }

        setAllowed(true)
        setAdminRole(admin.role)
      }

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
      setLoading(false)
    }

    init()
  }, [])

  async function updateProofStatus(id: string, status: 'approved' | 'rejected') {
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const proof = proofs.find((p) => p.id === id)

    const { error } = await supabase
      .from('subscription_payment_proofs')
      .update({
        status,
        reviewed_by: userData.user?.id || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    if (status === 'approved' && proof?.business_id) {
      await supabase.from('subscriptions').insert({
        business_id: proof.business_id,
        plan: proof.plan,
        status: 'active',
        started_at: new Date().toISOString()
      })
    }

    setProofs((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    setMessage(status === 'approved' ? 'Abonnement validé.' : 'Paiement rejeté.')
  }

  const stats = useMemo(() => {
    const pendingProofs = proofs.filter((p) => p.status === 'pending').length
    const approvedRevenue = proofs.filter((p) => p.status === 'approved').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    return { pendingProofs, approvedRevenue }
  }, [proofs])

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
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-emerald-300">{adminRole}</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/super-admin/businesses" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:scale-[1.02] hover:border-emerald-400/40">
            <Building2 className="text-emerald-300"/>
            <p className="mt-5 text-sm font-bold text-white/50">Businesses</p>
            <p className="mt-2 text-4xl font-black">{businesses.length}</p>
          </Link>

          <Link href="/admin/upgrade-requests" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:scale-[1.02] hover:border-amber-400/40">
            <CreditCard className="text-amber-300"/>
            <p className="mt-5 text-sm font-bold text-white/50">Paiements à valider</p>
            <p className="mt-2 text-4xl font-black text-amber-300">{stats.pendingProofs}</p>
          </Link>

          <Link href="/super-admin/analytics" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:scale-[1.02] hover:border-emerald-400/40">
            <BarChart3 className="text-emerald-300"/>
            <p className="mt-5 text-sm font-bold text-white/50">Revenus validés</p>
            <p className="mt-2 text-3xl font-black">{cfa(stats.approvedRevenue)}</p>
          </Link>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <Users className="text-sky-300"/>
            <p className="mt-5 text-sm font-bold text-white/50">Admins internes</p>
            <p className="mt-2 text-4xl font-black">{admins.length}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black">Validation abonnements</h2>
              <Link href="/admin/upgrade-requests" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Ouvrir</Link>
            </div>

            <div className="space-y-4">
              {proofs.length === 0 ? <p className="rounded-2xl bg-white/5 p-5 text-sm font-bold text-white/50">Aucune preuve de paiement.</p> : proofs.map((proof) => (
                <div key={proof.id} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xl font-black">{proof.businesses?.name || 'Business'}</p>
                      <p className="mt-1 text-sm font-bold text-white/50">Plan {proof.plan} · {cfa(proof.amount)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateProofStatus(proof.id, 'approved')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black">Valider</button>
                      <button onClick={() => updateProofStatus(proof.id, 'rejected')} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black">Rejeter</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black">Businesses récents</h2>
                <Link href="/super-admin/businesses" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">Voir tout</Link>
              </div>

              <div className="space-y-3">
                {businesses.slice(0, 8).map((b) => (
                  <Link key={b.id} href={`/super-admin/businesses/${b.id}`} className="block rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                    <p className="font-black">{b.name || 'Sans nom'}</p>
                    <p className="text-xs font-bold text-white/40">/{b.slug || 'no-slug'} · {b.business_type || 'retail'}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-red-400/20 bg-red-400/5 p-6">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><AlertTriangle className="text-red-300"/>Erreurs récentes</h2>
              <div className="space-y-3">
                {errors.length === 0 ? <p className="text-sm font-bold text-white/50">Aucune erreur récente.</p> : errors.map((e) => <div key={e.id} className="rounded-2xl bg-black/20 p-4"><p className="text-sm font-black text-red-200">{e.source || 'unknown'}</p><p className="mt-1 text-xs font-bold text-white/50">{e.message}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
