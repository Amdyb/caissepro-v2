'use client'

import AppShell from '@/components/AppShell'
import BrandingImageUploader from '@/components/BrandingImageUploader'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Copy, Download, ExternalLink, Globe2, MessageCircle, Palette, Printer, QrCode, Share2, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Business = {
  id: string
  name: string | null
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  slogan: string | null
  business_phone: string | null
  phone: string | null
  business_address: string | null
  address: string | null
  online_store_enabled?: boolean | null
  business_type?: string | null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function StorefrontPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)

      const businessId = memberships?.[0]?.business_id

      if (!businessId) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .limit(1)

      if (error) setMessage(error.message)

      if (data?.[0]) {
        const businessData = data[0] as Business

        const cleanSlug = businessData.slug || slugify(businessData.name || 'boutique')

        if (!businessData.slug || businessData.slug !== cleanSlug) {
          await supabase
            .from('businesses')
            .update({
              slug: cleanSlug,
              online_store_enabled: true
            })
            .eq('id', businessData.id)

          businessData.slug = cleanSlug
          businessData.online_store_enabled = true
        }

        setBusiness(businessData)
      }

      setLoading(false)
    }

    init()
  }, [])

  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://caissepro.app'

  const currentSlug = business?.slug || slugify(business?.name || 'boutique')

  const shopUrl = useMemo(() => {
    return `${origin}/shop/${currentSlug}`
  }, [origin, currentSlug])

  async function activateStorefront() {
    if (!business) return

    setSaving(true)
    setMessage('')

    const slug = slugify(business.name || `shop-${business.id.slice(0, 8)}`)

    const payload = {
      slug,
      online_store_enabled: true
    }

    const { error } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', business.id)

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setBusiness({
      ...business,
      ...payload
    })

    setMessage('Boutique en ligne activée et synchronisée.')
  }

  async function saveBranding() {
    if (!business) return

    const { error } = await supabase
      .from('businesses')
      .update({
        slogan: business.slogan,
        business_phone: business.business_phone,
        business_address: business.business_address
      })
      .eq('id', business.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Boutique mise à jour.')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shopUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}&margin=10&format=png`

  async function downloadQRCode() {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shopUrl)}&margin=20&format=png`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qrcode-${currentSlug || 'boutique'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printQRCode() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR Code — ${business?.name || 'Boutique'}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 60px 40px; }
        h1 { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
        p { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        img { width: 260px; height: 260px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; }
        .url { margin-top: 20px; font-size: 13px; color: #475569; word-break: break-all; }
        .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; }
      </style></head>
      <body>
        <h1>${business?.name || 'Ma Boutique'}</h1>
        <p>Scannez pour accéder à la boutique en ligne</p>
        <img src="${qrApiUrl}" alt="QR Code" />
        <div class="url">${shopUrl}</div>
        <div class="footer">Propulsé par CaissePro</div>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `)
    win.document.close()
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement boutique...</p></main>
  }

  return (
    <AppShell title="Ma Boutique" subtitle="Personnalisez et partagez votre boutique.">
      <div className="mx-auto max-w-6xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="h-64 bg-slate-950" style={{ backgroundImage: business?.banner_url ? `url(${business.banner_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="relative p-8 pt-20">
            <div className="absolute -top-16 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-xl">
              {business?.logo_url ? <img src={business.logo_url} alt="Logo" className="h-full w-full object-contain" /> : <Store size={52} className="text-slate-400" />}
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-black text-slate-950">{business?.name || 'Votre boutique'}</h1>
                <p className="mt-2 text-lg font-semibold text-slate-500">{business?.slogan || 'Votre boutique premium'}</p>
                <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">{business?.business_type || 'retail'}</div>
              </div>
              <button onClick={activateStorefront} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60">
                <Globe2 size={18} /> {saving ? 'Synchronisation...' : 'Publier boutique'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                <Palette size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950">Personnalisation</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Logo, bannière et identité.</p>
              </div>
            </div>

            {business && (
              <div className="space-y-5">
                <BrandingImageUploader
                  businessId={business.id}
                  label="Logo"
                  value={business.logo_url || ''}
                  folder="logos"
                  onUploaded={(url) => setBusiness({ ...business, logo_url: url })}
                />

                <BrandingImageUploader
                  businessId={business.id}
                  label="Bannière"
                  value={business.banner_url || ''}
                  folder="banners"
                  onUploaded={(url) => setBusiness({ ...business, banner_url: url })}
                />

                <input
                  value={business.slogan || ''}
                  onChange={(e) => setBusiness({ ...business, slogan: e.target.value })}
                  placeholder="Slogan boutique"
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none"
                />

                <input
                  value={business.business_phone || ''}
                  onChange={(e) => setBusiness({ ...business, business_phone: e.target.value })}
                  placeholder="Téléphone boutique"
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none"
                />

                <input
                  value={business.business_address || ''}
                  onChange={(e) => setBusiness({ ...business, business_address: e.target.value })}
                  placeholder="Adresse boutique"
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none"
                />

                <button onClick={saveBranding} className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white">
                  Sauvegarder boutique
                </button>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-3xl font-black text-slate-950"><Share2 /> Boutique publique</h2>
            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <input readOnly value={shopUrl} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700" />
              <button onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white"><Copy size={17} /> {copied ? 'Copié' : 'Copier'}</button>
              <a href={shopUrl} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700"><ExternalLink size={17} /> Ouvrir</a>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-500"><CheckCircle2 size={16} className="text-emerald-600" /> Boutique synchronisée pour le partage public.</p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm xl:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <QrCode size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-950">QR Code boutique</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Imprimez ou partagez le QR code de votre vitrine.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-[2rem] border-2 border-slate-100 bg-white p-4 shadow-lg">
                <img
                  src={qrApiUrl}
                  alt="QR Code boutique"
                  width={200}
                  height={200}
                  className="rounded-2xl"
                />
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <p className="text-sm font-black text-slate-700">Lien encodé dans le QR code</p>
                  <p className="mt-1 break-all rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">{shopUrl}</p>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Vos clients scannent le QR code avec leur téléphone pour accéder directement à votre boutique en ligne.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadQRCode}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                  >
                    <Download size={17} /> Télécharger
                  </button>
                  <button
                    onClick={printQRCode}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800"
                  >
                    <Printer size={17} /> Imprimer
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Visitez ma boutique en ligne !\n\n${shopUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 text-sm font-black text-white hover:bg-[#1ebe5d]"
                  >
                    <MessageCircle size={17} /> Partager WhatsApp
                  </a>
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={17} /> {copied ? 'Copié !' : 'Copier le lien'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
