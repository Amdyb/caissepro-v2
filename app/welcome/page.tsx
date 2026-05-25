'use client'

import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Circle, Package, Palette, Share2, ShoppingCart, Store, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STEPS = [
  {
    key: 'account',
    label: 'Compte créé',
    description: 'Votre espace marchand est prêt.',
    done: true,
    icon: Store,
    href: null,
  },
  {
    key: 'products',
    label: 'Ajouter vos produits',
    description: 'Renseignez votre catalogue pour commencer à vendre.',
    done: false,
    icon: Package,
    href: '/products',
  },
  {
    key: 'profile',
    label: 'Personnaliser votre boutique',
    description: 'Ajoutez logo, couleurs et slogan.',
    done: false,
    icon: Palette,
    href: '/settings',
  },
  {
    key: 'sale',
    label: 'Réaliser votre première vente',
    description: 'Ouvrez la caisse et encaissez votre premier client.',
    done: false,
    icon: ShoppingCart,
    href: '/pos',
  },
  {
    key: 'share',
    label: 'Partager votre boutique',
    description: 'Envoyez le lien de votre boutique en ligne à vos clients.',
    done: false,
    icon: Share2,
    href: '/storefront',
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const m = membership as any
      const biz = Array.isArray(m?.businesses) ? m.businesses[0] : m?.businesses
      if (biz?.name) setBusinessName(biz.name)
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-emerald-600 text-2xl font-black text-white shadow-xl shadow-emerald-600/20">
            C
          </div>
          <h1 className="text-3xl font-black text-slate-950">
            Bienvenue{businessName ? ` sur ${businessName}` : ' sur CaissePro'} !
          </h1>
          <p className="mt-2 font-semibold text-slate-500">
            Votre commerce est créé. Suivez ces étapes pour bien démarrer.
          </p>
        </div>

        {/* Checklist */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="space-y-1">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const content = (
                <div
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 transition ${
                    step.done
                      ? 'bg-emerald-50'
                      : step.href
                        ? 'hover:bg-slate-50 cursor-pointer'
                        : ''
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      step.done ? 'bg-emerald-600' : 'bg-slate-100'
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 size={20} className="text-white" />
                    ) : (
                      <Icon size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-black ${
                        step.done ? 'text-emerald-700' : 'text-slate-950'
                      }`}
                    >
                      {step.label}
                      {step.done && (
                        <span className="ml-2 text-emerald-500">✓</span>
                      )}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {step.description}
                    </p>
                  </div>
                  {!step.done && step.href && (
                    <ArrowRight size={16} className="shrink-0 text-slate-300" />
                  )}
                </div>
              )

              return step.href ? (
                <Link key={step.key} href={step.href}>
                  {content}
                </Link>
              ) : (
                <div key={step.key}>{content}</div>
              )
            })}
          </div>

          <Link
            href="/onboarding"
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            Configurer mon commerce
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/dashboard"
            className="mt-3 block text-center text-sm font-bold text-slate-400 hover:text-slate-600"
          >
            Aller au tableau de bord →
          </Link>
        </div>
      </div>
    </main>
  )
}
