'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Gift } from 'lucide-react'
import Reveal from '@/components/Reveal'

type Billing = 'mensuel' | 'annuel'

const TIERS = [
  {
    name: 'Gratuit',
    price: 0,
    tagline: 'Pour démarrer',
    popular: false,
    cta: 'Commencer gratuitement',
    features: ['1 boutique', 'Ventes illimitées', 'Mobile Money 0% commission', 'Boutique en ligne', 'Reçus WhatsApp'],
  },
  {
    name: 'Starter',
    price: 5000,
    tagline: 'Petits commerces',
    popular: false,
    cta: 'Choisir Starter',
    features: ['Tout Gratuit, et plus', 'Gestion de stock avancée', 'Scanner code-barres', 'Rapports détaillés', '2 utilisateurs'],
  },
  {
    name: 'Business',
    price: 15000,
    tagline: 'Le choix des pros',
    popular: true,
    cta: 'Choisir Business',
    features: ['Tout Starter, et plus', "Gestion d'équipe (3 rôles)", 'Fournisseurs & réassort', 'Notifications push', '5 utilisateurs'],
  },
  {
    name: 'Premium',
    price: 35000,
    tagline: 'Sans limites',
    popular: false,
    cta: 'Choisir Premium',
    features: ['Tout Business, et plus', 'Coach Entrepreneur IA', 'Multi-boutique', 'Utilisateurs illimités', 'Support prioritaire'],
  },
]

function fmt(n: number) {
  // Normalise the narrow/no-break spaces fr-FR inserts into plain spaces.
  return n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')
}

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('mensuel')
  const annuel = billing === 'annuel'

  return (
    <section id="tarifs" className="mx-auto max-w-[1240px] px-[18px] py-12 md:px-9 md:py-[90px]">
      <Reveal>
        <div className="mx-auto mb-[26px] max-w-[660px] text-center">
          <p className="mb-3.5 text-[0.8rem] font-black uppercase tracking-[0.16em] text-[#22c55e]">Tarifs</p>
          <h2 className="mb-3.5 font-sora text-4xl font-black leading-[1.06] tracking-[-0.02em] text-[#f2f5f3] md:text-5xl">
            Des prix simples, en FCFA
          </h2>
          <p className="text-[1.05rem] text-[#9fb0a8]">
            Commencez gratuitement. Évoluez quand vous grandissez. 0% de frais sur vos transactions, sur tous les
            plans.
          </p>
        </div>

        {/* promo banner */}
        <div className="mx-auto mb-7 flex max-w-[560px] items-center justify-center gap-3 rounded-[18px] border border-[#22c55e]/30 bg-gradient-to-r from-[#16a34a]/20 to-[#f97316]/[0.14] px-5 py-3.5">
          <Gift size={22} className="text-[#22c55e]" />
          <span className="text-[0.98rem] font-bold text-[#eaf1ed]">
            1 mois offert pour les nouveaux inscrits
          </span>
        </div>

        {/* billing toggle */}
        <div className="mb-[34px] flex justify-center">
          <div className="inline-flex rounded-[14px] border border-white/[0.09] bg-white/[0.05] p-[5px]">
            <button
              type="button"
              onClick={() => setBilling('mensuel')}
              className={`rounded-[10px] px-5 py-2.5 text-[0.9rem] font-bold transition-colors ${
                !annuel ? 'bg-[#16a34a] text-white' : 'text-[#9fb0a8]'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling('annuel')}
              className={`rounded-[10px] px-5 py-2.5 text-[0.9rem] font-bold transition-colors ${
                annuel ? 'bg-[#16a34a] text-white' : 'text-[#9fb0a8]'
              }`}
            >
              Annuel <span className="text-[#22c55e]">-1 mois</span>
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 items-stretch gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => {
          const amount = t.price === 0 ? 0 : annuel ? t.price * 10 : t.price
          const display = t.price === 0 ? '0' : fmt(amount)
          const period = t.price === 0 ? 'Pour toujours' : annuel ? '/an · 1 mois offert' : '/mois'

          return (
            <Reveal key={t.name} delay={i * 70} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-[30px] p-7 ${
                  t.popular
                    ? 'border border-[#22c55e]/[0.45] bg-gradient-to-b from-[#16a34a]/[0.18] to-[#101613]/[0.85]'
                    : 'border border-white/[0.08] bg-[#101613]/[0.55]'
                }`}
              >
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#16a34a] px-4 py-1.5 text-[0.72rem] font-black tracking-[0.04em] text-white shadow-[0_8px_20px_rgba(22,163,74,.45)]">
                    LE PLUS POPULAIRE
                  </div>
                )}
                <div className="font-sora text-[1.25rem] font-black text-[#f2f5f3]">{t.name}</div>
                <div className="mb-5 text-[0.88rem] font-semibold text-[#8a9a92]">{t.tagline}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sora text-[2.6rem] font-black leading-none text-[#f2f5f3]">{display}</span>
                  <span className="text-[0.9rem] font-bold text-[#9fb0a8]">FCFA</span>
                </div>
                <div className="mb-[22px] mt-1 min-h-[18px] text-[0.82rem] font-semibold text-[#8a9a92]">{period}</div>

                <div className="mb-[26px] flex flex-col gap-[11px]">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check size={17} className="mt-0.5 shrink-0 text-[#22c55e]" />
                      <span className="text-[0.9rem] leading-[1.4] text-[#cdd6d1]">{f}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className={`mt-auto rounded-[14px] py-3.5 text-center text-[0.95rem] font-bold transition-colors ${
                    t.popular
                      ? 'border border-[#16a34a] bg-[#16a34a] text-white hover:bg-[#15803d]'
                      : 'border border-white/[0.14] bg-white/[0.06] text-[#eaf1ed] hover:bg-white/[0.12]'
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
