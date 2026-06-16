'use client'

import { supabase } from '@/lib/supabaseClient'
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowUpCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const PLATFORM_WHATSAPP = '+221784581111'
const PLANS = ['free', 'starter', 'business', 'premium']

type UpgradeRequest = {
  id: string
  business_id: string | null
  business_name: string | null
  user_email: string | null
  plan: string
  price: string
  amount: number | null
  payment_reference: string | null
  status: string | null
  whatsapp_sent: boolean | null
  duration_months: number | null
  created_at: string
}

type Subscription = {
  id: string
  business_id: string | null
  plan: string | null
  status: string | null
  starts_at: string | null
  expires_at: string | null
  created_at: string | null
}

type Business = { id: string; name: string; phone: string | null; whatsapp: string | null; whatsapp_number: string | null }

export default function SuperAdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<UpgradeRequest[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [acting, setActing] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // Manual upgrade form
  const [manualBusiness, setManualBusiness] = useState('')
  const [manualPlan, setManualPlan] = useState('business')
  const [manualMonths, setManualMonths] = useState(2)
  const [manualBusy, setManualBusy] = useState(false)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [reqResult, subResult, bizResult] = await Promise.all([
      supabase.from('upgrade_requests').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('businesses').select('id, name, phone, whatsapp, whatsapp_number').limit(2000),
    ])
    setRequests((reqResult.data || []) as UpgradeRequest[])
    setSubscriptions((subResult.data || []) as Subscription[])
    setBusinesses((bizResult.data || []) as Business[])
    setLoading(false)
  }

  const bizMap = useMemo(() => {
    const m: Record<string, Business> = {}
    for (const b of businesses) m[b.id] = b
    return m
  }, [businesses])

  function nameFor(id: string | null) {
    if (!id) return '—'
    return bizMap[id]?.name || id.slice(0, 8)
  }

  function phoneFor(id: string | null) {
    if (!id) return null
    const b = bizMap[id]
    return b?.whatsapp || b?.whatsapp_number || b?.phone || null
  }

  function notifyWhatsApp(to: string, body: string) {
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body }),
    }).catch(() => null)
  }

  // Activate (or replace) a subscription for a business. Returns the expiry date.
  async function activate(businessId: string, plan: string, months: number): Promise<Date> {
    const now = new Date()
    const expires = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
    await supabase.from('subscriptions').delete().eq('business_id', businessId)
    await supabase.from('subscriptions').insert({
      business_id: businessId,
      plan: plan.toLowerCase(),
      status: 'active',
      starts_at: now.toISOString(),
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    await supabase.from('businesses').update({ plan: plan.toLowerCase() }).eq('id', businessId)
    return expires
  }

  async function approve(req: UpgradeRequest) {
    setActing(req.id)
    await supabase
      .from('upgrade_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', req.id)
    if (req.business_id) {
      const expires = await activate(req.business_id, req.plan, req.duration_months || 2)
      const expiryStr = expires.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      const phone = phoneFor(req.business_id)
      if (phone) {
        notifyWhatsApp(phone, `Félicitations ! Votre plan ${req.plan} est activé jusqu'au ${expiryStr}. Merci !`)
      }
      notifyWhatsApp(PLATFORM_WHATSAPP, `UPGRADE ACTIVÉ\n${req.business_name || nameFor(req.business_id)}\nPlan: ${req.plan}\nExpire le ${expiryStr}`)
    }
    await load()
    setActing(null)
    flash('Abonnement activé et marchand notifié.')
  }

  async function reject(req: UpgradeRequest) {
    setActing(req.id)
    await supabase
      .from('upgrade_requests')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', req.id)
    const phone = phoneFor(req.business_id)
    if (phone) {
      notifyWhatsApp(phone, `Paiement non confirmé. Contactez-nous au ${PLATFORM_WHATSAPP}`)
    }
    await load()
    setActing(null)
    flash('Demande rejetée et marchand notifié.')
  }

  async function manualUpgrade(e: React.FormEvent) {
    e.preventDefault()
    if (!manualBusiness) return
    const biz = businesses.find((b) => b.name === manualBusiness || b.id === manualBusiness)
    if (!biz) {
      flash('Boutique introuvable.')
      return
    }
    setManualBusy(true)
    const expires = await activate(biz.id, manualPlan, manualMonths)
    const expiryStr = expires.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const phone = phoneFor(biz.id)
    if (phone) {
      notifyWhatsApp(phone, `Félicitations ! Votre plan ${manualPlan} est activé jusqu'au ${expiryStr}. Merci !`)
    }
    notifyWhatsApp(PLATFORM_WHATSAPP, `UPGRADE MANUEL\n${biz.name}\nPlan: ${manualPlan}\nExpire le ${expiryStr}`)
    setManualBusiness('')
    await load()
    setManualBusy(false)
    flash(`${biz.name} mis à niveau vers ${manualPlan}.`)
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const history = requests.filter((r) => r.status !== 'pending')

  const now = Date.now()
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' && (!s.expires_at || new Date(s.expires_at).getTime() > now)
  )
  const expiredSubs = subscriptions.filter(
    (s) => s.status !== 'active' || (s.expires_at && new Date(s.expires_at).getTime() <= now)
  )

  function daysLeft(expires: string | null) {
    if (!expires) return null
    return Math.ceil((new Date(expires).getTime() - now) / (24 * 60 * 60 * 1000))
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/15 p-3">
            <CreditCard className="text-emerald-300" size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black">Abonnements</h1>
            <p className="text-sm font-semibold text-white/50">Validation des paiements et gestion des abonnements.</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 hover:bg-white/10">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">{message}</div>
      )}

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[2rem] border border-amber-400/30 bg-amber-400/5 p-6">
          <Clock className="text-amber-300" />
          <p className="mt-4 text-sm font-bold text-white/50">En attente</p>
          <p className="mt-1 text-3xl font-black text-amber-300">{pending.length}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <CheckCircle2 className="text-emerald-300" />
          <p className="mt-4 text-sm font-bold text-white/50">Abonnements actifs</p>
          <p className="mt-1 text-3xl font-black">{activeSubs.length}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <AlertTriangle className="text-red-300" />
          <p className="mt-4 text-sm font-bold text-white/50">Expirés</p>
          <p className="mt-1 text-3xl font-black">{expiredSubs.length}</p>
        </div>
      </div>

      {/* Pending */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-black">Paiements à valider</h2>
        {loading ? (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center font-bold text-white/40">Chargement...</p>
        ) : pending.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center font-bold text-white/40">Aucune demande en attente.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <div key={req.id} className="rounded-3xl border border-amber-400/30 bg-amber-400/5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">En attente</span>
                      <p className="text-xl font-black">{req.business_name || nameFor(req.business_id)}</p>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-white/50">{req.user_email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-black uppercase">{req.plan}</span>
                      <span className="rounded-xl bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">
                        {req.amount != null ? `${req.amount.toLocaleString('fr-FR')} XOF` : req.price}
                      </span>
                      <span className="rounded-xl bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
                        {new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {req.payment_reference && (
                      <p className="mt-2 text-sm font-bold text-white/70">
                        Référence paiement : <span className="rounded-lg bg-white/10 px-2 py-0.5 font-black text-white">{req.payment_reference}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => reject(req)}
                      disabled={acting === req.id}
                      className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-transparent px-4 py-3 text-sm font-black text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <XCircle size={16} /> Rejeter
                    </button>
                    <button
                      onClick={() => approve(req)}
                      disabled={acting === req.id}
                      className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> {acting === req.id ? 'Traitement...' : 'Approuver'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manual upgrade */}
      <section className="mb-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-6">
        <div className="mb-5 flex items-center gap-3">
          <ArrowUpCircle className="text-emerald-300" size={22} />
          <h2 className="text-xl font-black">Mise à niveau manuelle</h2>
        </div>
        <form onSubmit={manualUpgrade} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <div>
            <label className="text-sm font-bold text-white/60">Boutique</label>
            <input
              list="biz-list"
              value={manualBusiness}
              onChange={(e) => setManualBusiness(e.target.value)}
              placeholder="Rechercher une boutique..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
            />
            <datalist id="biz-list">
              {businesses.map((b) => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-sm font-bold text-white/60">Plan</label>
            <select
              value={manualPlan}
              onChange={(e) => setManualPlan(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 font-black text-white outline-none"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-white/60">Mois</label>
            <input
              type="number"
              min={1}
              max={36}
              value={manualMonths}
              onChange={(e) => setManualMonths(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white outline-none"
            />
          </div>
          <button
            disabled={manualBusy}
            className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {manualBusy ? '...' : 'Appliquer'}
          </button>
        </form>
      </section>

      {/* Active subscriptions */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-black">Abonnements actifs ({activeSubs.length})</h2>
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          {activeSubs.length === 0 ? (
            <p className="px-6 py-8 text-center font-bold text-white/40">Aucun abonnement actif.</p>
          ) : (
            activeSubs.map((s) => {
              const left = daysLeft(s.expires_at)
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4 last:border-0">
                  <div>
                    <p className="font-black">{nameFor(s.business_id)}</p>
                    <p className="text-xs font-bold uppercase text-emerald-300">{s.plan}</p>
                  </div>
                  <div className="text-right text-sm font-semibold text-white/50">
                    {s.expires_at ? (
                      <>
                        <p>Expire le {new Date(s.expires_at).toLocaleDateString('fr-FR')}</p>
                        {left !== null && (
                          <p className={left <= 7 ? 'font-black text-amber-300' : 'text-white/40'}>{left} jours restants</p>
                        )}
                      </>
                    ) : (
                      <p>Sans expiration</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Expired subscriptions */}
      {expiredSubs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-black text-white/70">Expirés ({expiredSubs.length})</h2>
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02]">
            {expiredSubs.slice(0, 50).map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4 last:border-0 opacity-70">
                <div>
                  <p className="font-black">{nameFor(s.business_id)}</p>
                  <p className="text-xs font-bold uppercase text-white/40">{s.plan}</p>
                </div>
                <p className="text-sm font-semibold text-red-300/70">
                  {s.expires_at ? `Expiré le ${new Date(s.expires_at).toLocaleDateString('fr-FR')}` : (s.status || 'inactif')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-black text-white/70">Historique des demandes</h2>
          <div className="space-y-3">
            {history.slice(0, 50).map((req) => (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <div>
                  <p className="font-black">{req.business_name || nameFor(req.business_id)}</p>
                  <p className="text-sm font-semibold text-white/40">{req.user_email} · {req.plan} · {req.price}</p>
                </div>
                <span className={`rounded-xl px-3 py-1.5 text-xs font-black ${req.status === 'approved' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                  {req.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
