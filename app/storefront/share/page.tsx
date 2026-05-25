'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Check, Copy, MessageCircle, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SharePage() {
  const [shopUrl, setShopUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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
      setLoading(false)
    }
    init()
  }, [])

  const qrImageUrl = shopUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=16&data=${encodeURIComponent(shopUrl)}`
    : ''

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
      <div className="mx-auto max-w-lg space-y-5">
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
                  onClick={copyLink}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
            </div>

            {/* Share actions */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={copyLink}
                className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-black shadow-xl transition ${copied ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white shadow-emerald-600/20'}`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </button>

              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-black text-white shadow-xl"
              >
                <MessageCircle size={20} /> Partager via WhatsApp
              </button>
            </div>

            {/* QR code preview */}
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
          </>
        )}
      </div>
    </AppShell>
  )
}
