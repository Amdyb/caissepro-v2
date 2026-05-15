'use client'

import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, Building2, CheckCircle, CreditCard, Shield, Users } from 'lucide-react'
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
    const publishedStores = businesses.filter((b) => b.online_store_enabled).length
    return { pendingProofs, approvedRevenue, publishedStores }
  }, [proofs, businesses])

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
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">CaissePro Control Center</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">Super Admin</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-emerald-300">{adminRole}</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><Building2 className="text-emerald-300"/><p className="mt-5 text-sm font-bold text-white/50">Businesses</p><p className="mt-2 text-4xl font-black">{businesses.length}</p></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><CreditCard className="text-amber-300"/><p className="mt-5 text-sm font-bold text-white/50">Paiements à valider</p><p className="mt-2 text-4xl font-black text-amber-300">{stats.pendingProofs}</p></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><CheckCircle className="text-emerald-300"/><p className="mt-5 text-sm font-bold text-white/50">Revenus validés</p><p className="mt-2 text-3xl font-black">{cfa(stats.approvedRevenue)}</p></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><Users className="text-sky-300"/><p className="mt-5 text-sm font-bold text-white/50">Admins internes</p><p className="mt-2 text-4xl font-black">{admins.length}</p></div>
        </div>
      </section>
    </main>
  )
}
