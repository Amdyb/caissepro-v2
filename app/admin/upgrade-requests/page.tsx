'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Clock, ExternalLink, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const WHATSAPP_APPROVAL_NUMBER = '15863442378'
const ADMIN_EMAILS = ['infos@dakarvapes.com']

type UpgradeRequest = {
  id: string
  business_id: string
  business_name: string | null
  user_email: string | null
  plan: string
  price: string
  status: string | null
  whatsapp_sent: boolean | null
  created_at: string
}

export default function AdminUpgradeRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      router.push('/login')
      return
    }

    const email = userData.user.email || ''

    if (!ADMIN_EMAILS.includes(email)) {
      router.push('/dashboard')
      return
    }

    await loadRequests()
  }

  async function loadRequests() {
    const { data, error } = await supabase
      .from('upgrade_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMessage('Table upgrade_requests manquante ou accès refusé.')
      setLoading(false)
      return
    }

    setRequests((data || []) as UpgradeRequest[])
    setLoading(false)
  }

  async function approveRequest(request: UpgradeRequest) {
    const ok = confirm(`Approuver ${request.business_name || 'cette boutique'} pour le plan ${request.plan} ?`)
    if (!ok) return

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        business_id: request.business_id,
        plan: request.plan.toLowerCase(),
        status: 'active'
      })

    if (subError) {
      setMessage(subError.message)
      return
    }

    await supabase
      .from('upgrade_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', request.id)

    setRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? { ...item, status: 'approved' }
          : item
      )
    )

    setMessage('Plan approuvé et activé.')
  }

  async function rejectRequest(request: UpgradeRequest) {
    const ok = confirm('Rejeter cette demande ?')
    if (!ok) return

    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', request.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? { ...item, status: 'rejected' }
          : item
      )
    )

    setMessage('Demande rejetée.')
  }

  function whatsappLink(request: UpgradeRequest) {
    const text = encodeURIComponent(
      `Bonjour ${request.business_name || 'boutique'}, votre demande ${request.plan} est en cours de validation.`
    )

    return `https://wa.me/${WHATSAPP_APPROVAL_NUMBER}?text=${text}`
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-600">Chargement demandes...</p>
      </main>
    )
  }

  return (
    <AppShell title="Demandes mise à niveau" subtitle="Validation manuelle des paiements CaissePro.">
      <div className="mx-auto max-w-7xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Demandes récentes</h2>

          <div className="mt-6 space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Clock className="mx-auto text-slate-400" size={48} />
                <h3 className="mt-4 text-xl font-black">Aucune demande</h3>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xl font-black text-slate-950">
                        {request.business_name || 'Boutique'}
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {request.user_email || 'Email'} · {request.plan} · {request.price}
                      </p>

                      <p className={`mt-1 text-xs font-black uppercase ${request.status === 'approved' ? 'text-emerald-600' : request.status === 'rejected' ? 'text-red-500' : 'text-slate-400'}`}>
                        REF: {request.id.slice(0, 8)} · {request.status || 'pending'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={whatsappLink(request)}
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                      >
                        <ExternalLink size={16} />
                        WhatsApp
                      </a>

                      <button
                        onClick={() => approveRequest(request)}
                        disabled={request.status === 'approved'}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"
                      >
                        <CheckCircle2 size={16} />
                        Approuver
                      </button>

                      <button
                        onClick={() => rejectRequest(request)}
                        disabled={request.status === 'rejected'}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-40"
                      >
                        <XCircle size={16} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
