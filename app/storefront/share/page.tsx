'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Check, Copy, MessageCircle, QrCode, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function SharePage() {
  const [shopUrl, setShopUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name, slug)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership
      const slug = member?.businesses?.slug
      const name = member?.businesses?.name || 'Ma boutique'

      setBusinessName(name)
      if (slug) {
        setShopUrl(`${window.location.origin}/shop/${slug}`)
      }

      if (member?.business_id) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('business_id', member.business_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        setPlan(sub?.plan || 'free')
      }

      setLoading(false)
    }
    init()
  }, [])

  const isFree = plan === 'free'

  const qrImageUrl = shopUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data=${encodeURIComponent(shopUrl)}`
    : ''

  function handleShareAction(action: () => void) {
    if (isFree) {
      setShowUpgradeModal(true)
      return
    }
    action()
  }

  async function copyLink() {
    if (!shopUrl) return
    try {
      await navigator.clipboard.writeText(shopUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      prompt('Copiez ce lien :', shopUrl)
    }
  }

  function shareWhatsApp() {
    if (!shopUrl) return
    const text = encodeURIComponent(`Découvrez ma boutique en ligne ${businessName} : ${shopUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <AppShell title="Partager la boutique" subtitle="Partagez votre boutique avec vos clients.">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-200" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Partager la boutique" subtitle="Partagez votre boutique avec vos clients.">
      {/* Upgrade modal for free plan */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">🚀</div>
              <h2 className="text-xl font-black text-slate-950">Votre business mérite mieux 🚀</h2>
              <p className="text-sm font-semibold text-slate-500">
                Passez à un plan supérieur pour publier votre boutique en ligne et commencer à vendre.
              </p>
              <Link
                href="/upgrade"
                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Voir les plans
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg space-y-5">
        {isFree && (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-center shadow-sm">
            <p className="text-sm font-black text-amber-800">Plan Gratuit — Boutique en ligne verrouillée</p>
            <p className="mt-1 text-xs font-semibold text-amber-600">Passez à Starter ou plus pour publier votre boutique.</p>
            <Link href="/upgrade" className="mt-3 inline-block rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-black text-white">
              Voir les plans
            </Link>
          </div>
        )}

        {!shopUrl ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <QrCode className="mx-auto mb-4 text-slate-300" size={48} />
            <h3 className="text-xl font-black text-slate-950">Boutique non configurée</h3>
            <p className="mt-2 text-sm font-bold text-slate-500">Configurez un slug dans les paramètres de votre boutique pour obtenir un lien partageable.</p>
          </div>
        ) : (
          <>
            {/* URL card */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Lien de votre boutique</p>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="flex-1 break-all text-sm font-bold text-slate-800">{shopUrl}</p>
                <button
                  onClick={() => handleShareAction(copyLink)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
            </div>

            {/* Share actions */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleShareAction(copyLink)}
                className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-black shadow-xl transition ${copied ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white shadow-emerald-600/20'}`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </button>

              <button
                onClick={() => handleShareAction(shareWhatsApp)}
                className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-black text-white shadow-xl"
              >
                <MessageCircle size={20} /> Partager via WhatsApp
              </button>
            </div>

            {/* QR code preview */}
            {!isFree && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">QR Code</p>
                <div className="flex flex-col items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} alt={`QR Code ${businessName}`} width={200} height={200} className="rounded-2xl" />
                  <a
                    href="/storefront/qr"
                    className="text-sm font-black text-emerald-600 hover:text-emerald-700"
                  >
                    Télécharger ou imprimer le QR code →
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
