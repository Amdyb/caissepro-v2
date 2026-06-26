'use client'

import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

type UpgradeRequest = {
  id: string
  business_id: string | null
  business_name: string
  user_email: string
  plan: string
  price: string
  status: string
  whatsapp_sent: boolean
  created_at: string
}

export default function SuperAdminUpgradesPage() {
  const [requests, setRequests] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('upgrade_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests((data || []) as UpgradeRequest[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(req: UpgradeRequest) {
    setActing(req.id)
    await supabase.from('upgrade_requests').update({ status: 'approved' }).eq('id', req.id)
    if (req.business_id) {
      const now = new Date()
      const expires = new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000)
      await supabase.from('subscriptions').delete().eq('business_id', req.business_id)
      await supabase.from('subscriptions').insert({
        business_id: req.business_id,
        plan: req.plan.toLowerCase(),
        status: 'active',
        starts_at: now.toISOString(),
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
      })
      await supabase.from('businesses').update({ plan: req.plan.toLowerCase() }).eq('id', req.business_id)
      // Web push to the merchant (non-blocking).
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: req.business_id,
          type: 'subscription',
          title: 'Abonnement activé',
          body: `Votre plan ${req.plan} est maintenant actif. Merci !`,
          url: '/subscription',
        }),
      }).catch(() => {})
    }
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '+221784581111',
        body: `✅ UPGRADE APPROUVÉ\nBoutique: ${req.business_name}\nPlan: ${req.plan}\nEmail: ${req.user_email}`,
      }),
    }).catch(() => null)
    await load()
    setActing(null)
  }

  async function reject(req: UpgradeRequest) {
    setActing(req.id)
    await supabase.from('upgrade_requests').update({ status: 'rejected' }).eq('id', req.id)
    await load()
    setActing(null)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const others = requests.filter(r => r.status !== 'pending')

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Upgrade Center</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Demandes de mise à niveau des abonnements</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Pending — shown prominently */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">{pending.length}</span>
            <h2 className="text-lg font-black text-slate-950">En attente de traitement</h2>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400">Chargement...</div>
          ) : pending.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400">
              Aucune demande en attente
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((req) => (
                <div key={req.id} className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-black text-slate-950">{req.business_name}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-500">{req.user_email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-xl bg-slate-950 px-3 py-1 text-xs font-black text-white">{req.plan}</span>
                        <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{req.price}</span>
                        {req.whatsapp_sent && (
                          <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">WhatsApp envoyé</span>
                        )}
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => reject(req)}
                        disabled={acting === req.id}
                        className="flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Rejeter
                      </button>
                      <button
                        onClick={() => approve(req)}
                        disabled={acting === req.id}
                        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> {acting === req.id ? 'Traitement...' : 'Approuver'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {others.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-black text-slate-950">Historique</h2>
            <div className="space-y-3">
              {others.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{req.business_name}</p>
                      <p className="text-sm font-semibold text-slate-500">{req.user_email} · {req.plan} · {req.price}</p>
                    </div>
                    <span className={`rounded-xl px-3 py-1.5 text-xs font-black ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
