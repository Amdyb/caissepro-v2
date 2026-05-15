'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Crown, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const plans = [
  { id: 'starter', name: 'Starter', price: '5 000 CFA/mois', features: ['POS', 'Produits', 'Clients', 'Rapports simples'] },
  { id: 'premium', name: 'Premium', price: '10 000 CFA/mois', features: ['Tous les modules', 'Client Doit', 'Import Excel', 'Boutique en ligne', 'Employés'] },
  { id: 'business', name: 'Business', price: '20 000 CFA/mois', features: ['Multi-boutiques', 'Analytics avancées', 'Support prioritaire', 'Fonctions premium'] }
]

export default function UpgradePage() {
  const [business, setBusiness] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }

      setUserEmail(userData.user.email || '')

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(id,name,business_type)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership
      if (member?.businesses) setBusiness(member.businesses)
      setLoading(false)
    }
    init()
  }, [])

  async function choosePlan(plan: any) {
    if (!business) {
      setMessage('Aucune boutique trouvée. Connectez-vous avec le compte propriétaire de la boutique.')
      return
    }

    const reference = `CP-${Date.now()}`

    try {
      await supabase.from('upgrade_requests').insert({
        business_id: business.id,
        business_name: business.name,
        user_email: userEmail,
        plan: plan.name,
        price: plan.price,
        status: 'pending',
        whatsapp_sent: true
      })
    } catch (error) {
      console.log('upgrade request table may not exist yet')
    }

    const text = encodeURIComponent(`Bonjour CaissePro, je souhaite activer CaissePro Premium.\n\nBoutique: ${business.name}\nEmail: ${userEmail}\nPlan choisi: ${plan.name}\nMontant: ${plan.price}\nRéférence: ${reference}\n\nJ’ai effectué le paiement. Merci de valider mon accès.`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setMessage('Demande créée. WhatsApp va s’ouvrir avec le message de validation.')
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement...</p></main>

  return (
    <AppShell title="Upgrade CaissePro" subtitle="Choisissez un plan pour votre boutique existante.">
      <div className="mx-auto max-w-6xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Boutique liée</h2>
          <p className="mt-2 text-sm font-bold text-slate-500">Cette mise à niveau sera attachée à votre boutique existante, sans créer un nouveau profil.</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 font-black text-slate-800">{business?.name || 'Aucune boutique trouvée'} · {userEmail}</div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Crown /></div>
              <h3 className="text-3xl font-black text-slate-950">{plan.name}</h3>
              <p className="mt-2 text-2xl font-black text-emerald-600">{plan.price}</p>
              <div className="mt-5 space-y-3">
                {plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 size={16} className="text-emerald-600" />{feature}</p>)}
              </div>
              <button onClick={() => choosePlan(plan)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white"><MessageCircle size={18} /> Choisir et envoyer WhatsApp</button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
