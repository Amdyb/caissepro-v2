'use client'

import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, Building2, ShoppingBag, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const businessTypes = [
  {
    id: 'retail',
    title: 'Commerce & Boutique',
    description: 'Produits, stock, caisse, clients, paiements et boutique en ligne.',
    icon: ShoppingBag,
    examples: 'Mode, électronique, beauté, supérette, épicerie, pharmacie...'
  },
  {
    id: 'other',
    title: 'Autre',
    description: 'Tout autre type d\'activité commerciale ou de service.',
    icon: Building2,
    examples: 'Services, artisanat, prestation, agence, réparation...'
  }
]

export default function BusinessTypeOnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState('retail')
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
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
        .select('business_id, role, businesses(business_type)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership

      if (member?.business_id && !['owner', 'admin'].includes(member?.role)) {
        router.push('/dashboard')
        return
      }

      if (member?.business_id) {
        setBusinessId(member.business_id)
        const btype = member.businesses?.business_type || 'retail'
        setSelected(['retail', 'other'].includes(btype) ? btype : 'retail')
      }

      setLoading(false)
    }

    init()
  }, [router])

  async function continueSetup() {
    setMessage('')

    if (businessId) {
      const { error } = await supabase
        .from('businesses')
        .update({ business_type: selected })
        .eq('id', businessId)

      if (error) {
        setMessage(error.message)
        return
      }
    }

    router.push(`/onboarding/business-profile?type=${selected}`)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
            <Store size={34} />
          </div>
          <h1 className="text-5xl font-black tracking-tight">Quel type de business gérez-vous ?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            CaissePro va générer une expérience adaptée à votre activité.
          </p>
        </div>

        {message && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

        <div className="grid gap-5 md:grid-cols-2">
          {businessTypes.map((type) => {
            const Icon = type.icon
            const active = selected === type.id
            return (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={`rounded-[2rem] border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${active ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200 bg-white'}`}
              >
                <div className={`mb-5 inline-flex rounded-2xl p-4 ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Icon size={30} />
                </div>
                <h2 className="text-2xl font-black">{type.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{type.description}</p>
                <p className="mt-5 rounded-2xl bg-white/70 p-3 text-xs font-black text-slate-500">{type.examples}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button onClick={continueSetup} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700">
            Continuer
            <ArrowRight size={20} />
          </button>
          <p className="text-sm font-semibold text-slate-500">Vous pourrez modifier ces paramètres plus tard.</p>
        </div>
      </div>
    </main>
  )
}
