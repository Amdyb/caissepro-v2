'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Copy, Gift, MessageCircle, QrCode, RefreshCcw, Share2, Trophy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Referral = {
  id: string
  referral_code: string
  referred_email: string | null
  referred_phone: string | null
  status: string | null
  reward_type: string | null
  reward_value: number | null
  created_at: string
}

function makeCode(name: string, businessId: string) {
  const prefix = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'caissepro'
  return `${prefix}-${businessId.slice(0, 6)}`
}

export default function ReferralsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [plan, setPlan] = useState('free')
  const [code, setCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (!membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      const id = member.business_id
      const name = member.businesses?.name || 'CaissePro'
      const referralCode = makeCode(name, id)

      setBusinessId(id)
      setBusinessName(name)
      setCode(referralCode)

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan,status')
        .eq('business_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setPlan(subscription?.plan || 'free')
      await loadReferrals(id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadReferrals(id: string) {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_business_id', id)
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
    else setReferrals((data || []) as Referral[])
  }

  const stats = useMemo(() => {
    const signedUp = referrals.filter((r) => ['signed_up', 'active', 'upgraded', 'rewarded'].includes(r.status || '')).length
    const active = referrals.filter((r) => ['active', 'upgraded', 'rewarded'].includes(r.status || '')).length
    const upgraded = referrals.filter((r) => ['upgraded', 'rewarded'].includes(r.status || '')).length
    const rewarded = referrals.filter((r) => r.status === 'rewarded').length
    return { signedUp, active, upgraded, rewarded }
  }, [referrals])

  const rewardGoal = plan === 'business' || plan === 'premium' ? 4 : 5
  const qualified = plan === 'free' ? Math.min(stats.signedUp, rewardGoal) : Math.min(stats.upgraded, rewardGoal)
  const progress = Math.round((qualified / rewardGoal) * 100)

  const inviteLink = `https://caissepro.app/register?ref=${code}`
  const shareText = `Je t’invite à essayer CaissePro pour gérer ta boutique: caisse, stock, clients, paiements, tontines et rappels WhatsApp. Inscris-toi ici: ${inviteLink}`

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink)
    setMessage('Lien de parrainage copié.')
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  async function refresh() {
    if (!businessId) return
    setLoading(true)
    await loadReferrals(businessId)
    setLoading(false)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement parrainage...</p></main>
  }

  return (
    <AppShell title="Parrainage" subtitle="Invitez des boutiques et gagnez des mois gratuits.">
      <div className="mx-auto max-w-[1300px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Invités</p><p className="mt-2 text-3xl font-black text-slate-950">{referrals.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-sky-600" /><p className="mt-5 text-sm font-bold text-slate-500">Inscrits</p><p className="mt-2 text-3xl font-black text-sky-600">{stats.signedUp}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Trophy className="text-amber-600" /><p className="mt-5 text-sm font-bold text-slate-500">Upgrades</p><p className="mt-2 text-3xl font-black text-amber-600">{stats.upgraded}</p></div>
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm"><Gift className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Récompenses</p><p className="mt-2 text-3xl font-black text-emerald-600">{stats.rewarded}</p></div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><QrCode size={26}/></div>
              <div><h3 className="text-xl font-black text-slate-950">Votre code</h3><p className="text-sm font-semibold text-slate-500">{businessName}</p></div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-center text-white">
              <p className="text-sm font-bold text-white/60">Code parrainage</p>
              <p className="mt-2 break-all text-3xl font-black">{code}</p>
            </div>

            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <QrCode className="mx-auto text-slate-400" size={70}/>
              <p className="mt-3 text-sm font-bold text-slate-500">QR imprimable bientôt disponible</p>
              <p className="mt-1 break-all text-xs font-semibold text-slate-400">{inviteLink}</p>
            </div>

            <div className="mt-5 grid gap-3">
              <button onClick={copyInvite} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 text-sm font-black text-slate-700"><Copy size={18}/>Copier lien</button>
              <button onClick={shareWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-sm font-black text-white"><MessageCircle size={18}/>Partager WhatsApp</button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><h3 className="text-xl font-black text-slate-950">Progression récompense</h3><p className="text-sm font-semibold text-slate-500">Plan actuel: {plan}</p></div>
              <button onClick={refresh} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><RefreshCcw size={18}/>Actualiser</button>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-6">
              <div className="flex items-center justify-between text-sm font-black text-emerald-700"><span>{qualified} / {rewardGoal} qualifiés</span><span>{progress}%</span></div>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div>
              <p className="mt-4 text-sm font-semibold text-slate-600">
                {plan === 'free' ? 'Objectif: 5 inscriptions dont au moins 1 upgrade pour débloquer 1 mois Starter.' : plan === 'business' ? 'Objectif: 4 upgrades Business/Pro pour débloquer 3 mois Business.' : 'Continuez à parrainer pour recevoir des crédits et avantages premium.'}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">Free</p><p className="mt-2 text-sm font-black text-slate-950">5 shops + 1 upgrade</p><p className="mt-1 text-xs font-semibold text-slate-500">1 mois Starter</p></div>
              <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">Starter</p><p className="mt-2 text-sm font-black text-slate-950">5 shops payants</p><p className="mt-1 text-xs font-semibold text-slate-500">2 mois gratuits</p></div>
              <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">Business</p><p className="mt-2 text-sm font-black text-slate-950">4 upgrades</p><p className="mt-1 text-xs font-semibold text-slate-500">3 mois gratuits</p></div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-xl font-black text-slate-950">Historique parrainage</h3>
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div key={referral.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{referral.status || 'invited'}</span>
                    <p className="mt-3 text-lg font-black text-slate-950">{referral.referred_email || referral.referred_phone || 'Boutique invitée'}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Code: {referral.referral_code}</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-500">{new Date(referral.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {referrals.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Share2 className="mx-auto text-slate-300" size={48}/><p className="mt-4 font-black text-slate-950">Aucun parrainage</p><p className="mt-2 text-sm font-semibold text-slate-500">Partagez votre lien pour commencer.</p></div>}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
