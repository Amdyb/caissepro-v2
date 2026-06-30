'use client'

import AppShell from '@/components/AppShell'
import ShopSwitcher from '@/components/ShopSwitcher'
import { supabase } from '@/lib/supabaseClient'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import { canCustomizeStorefront } from '@/lib/permissions'
import { resolveSelectedBusiness, setSelectedBusinessId, slugify, ShopOption } from '@/lib/storefront'
import {
  ChevronRight,
  CreditCard,
  ExternalLink,
  Globe2,
  Palette,
  Share2,
  ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type SelectedBiz = { id: string; name: string | null; slug: string | null }

export default function StorefrontPage() {
  const [shops, setShops] = useState<ShopOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [biz, setBiz] = useState<SelectedBiz | null>(null)
  const [loading, setLoading] = useState(true)
  const { role, businessId } = useBusinessData()
  // View + share only roles (Dakar Vapes manager/vendeur, staff) can't edit.
  // Pair role with its own business id so the lock matches the active membership.
  const canCustomize = canCustomizeStorefront(role, businessId)

  // Loads the selected shop's slug, generating one if it is still missing.
  async function loadBusiness(id: string) {
    const { data } = await supabase.from('businesses').select('id, name, slug').eq('id', id).maybeSingle()
    if (!data) return
    let slug = data.slug as string | null
    if (!slug) {
      slug = slugify((data.name as string) || 'boutique')
      await supabase.from('businesses').update({ slug, online_store_enabled: true }).eq('id', id)
    }
    setBiz({ id: data.id as string, name: data.name as string | null, slug })
  }

  useEffect(() => {
    async function init() {
      const { businessId, shops } = await resolveSelectedBusiness()
      setShops(shops)
      setSelectedId(businessId)
      if (businessId) await loadBusiness(businessId)
      setLoading(false)
    }
    init()
  }, [])

  async function switchShop(id: string) {
    setSelectedBusinessId(id)
    setSelectedId(id)
    setBiz(null)
    await loadBusiness(id)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://caissepro.app'
  const shopUrl = useMemo(
    () => (biz?.slug ? `${origin}/shop/${biz.slug}` : ''),
    [origin, biz?.slug]
  )

  if (loading) {
    return (
      <AppShell title="Ma boutique en ligne" subtitle="Gérez votre boutique en ligne.">
        <div className="mx-auto max-w-2xl">
          <p className="font-black text-slate-600">Chargement...</p>
        </div>
      </AppShell>
    )
  }

  const cards = [
    {
      title: 'Voir ma boutique',
      desc: 'Votre boutique publique telle que vos clients la voient.',
      icon: Globe2,
      href: shopUrl,
      external: true,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    // Personnaliser — edit-only, hidden for view + share roles.
    ...(canCustomize
      ? [{
          title: 'Personnaliser',
          desc: 'Logo, bannière, couleurs et thème de cette boutique.',
          icon: Palette,
          href: '/storefront/customize',
          external: false,
          accent: 'text-violet-600 bg-violet-50',
        }]
      : []),
    {
      title: 'Partager',
      desc: 'QR code, partage WhatsApp et lien à copier.',
      icon: Share2,
      href: '/storefront/share',
      external: false,
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Commandes en ligne',
      desc: 'Consultez et gérez les commandes reçues.',
      icon: ShoppingBag,
      href: '/orders',
      external: false,
      accent: 'text-orange-600 bg-orange-50',
    },
    // Paramètres paiement — edit-only, hidden for view + share roles.
    ...(canCustomize
      ? [{
          title: 'Paramètres paiement',
          desc: 'Numéros Wave et Orange Money de cette boutique.',
          icon: CreditCard,
          href: '/storefront/payments',
          external: false,
          accent: 'text-rose-600 bg-rose-50',
        }]
      : []),
  ]

  return (
    <AppShell title="Ma boutique en ligne" subtitle="Gérez votre boutique en ligne.">
      <div className="mx-auto max-w-2xl space-y-4">
        <ShopSwitcher shops={shops} selectedId={selectedId} onChange={switchShop} />

        {!biz?.slug && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-700">
            Cette boutique n&apos;a pas encore de lien. Ouvrez « Personnaliser » pour finaliser sa configuration.
          </div>
        )}

        <div className="space-y-3">
          {cards.map((card) => {
            const Icon = card.icon
            const disabled = card.external && !card.href

            const inner = (
              <div className="flex items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.accent}`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-slate-950">{card.title}</p>
                  <p className="truncate text-sm font-bold text-slate-500">{card.desc}</p>
                </div>
                {card.external ? <ExternalLink size={18} className="shrink-0 text-slate-400" /> : <ChevronRight size={18} className="shrink-0 text-slate-400" />}
              </div>
            )

            if (disabled) {
              return <div key={card.title} className="cursor-not-allowed opacity-50">{inner}</div>
            }

            if (card.external) {
              return (
                <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              )
            }

            return (
              <Link key={card.title} href={card.href}>
                {inner}
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
