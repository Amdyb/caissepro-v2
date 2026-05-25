'use client'

import AppShell from '@/components/AppShell'
import BrandingImageUploader from '@/components/BrandingImageUploader'
import { supabase } from '@/lib/supabaseClient'
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  Info,
  MessageCircle,
  Palette,
  Phone,
  Printer,
  QrCode,
  Share2,
  Store,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

type Business = {
  id: string
  name: string | null
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  slogan: string | null
  phone: string | null
  business_phone: string | null
  whatsapp: string | null
  whatsapp_number: string | null
  address: string | null
  business_address: string | null
  primary_color: string | null
  secondary_color: string | null
  opening_hours: string | null
  maps_url: string | null
  online_store_enabled: boolean | null
  business_type: string | null
}

type StepKey = 'identity' | 'theme' | 'info' | 'share'

const THEMES = [
  { name: 'Moderne',  primary: '#16a34a', secondary: '#0f172a' },
  { name: 'Élégant',  primary: '#7c3aed', secondary: '#1e1b4b' },
  { name: 'Coloré',   primary: '#ea580c', secondary: '#7c3aed' },
  { name: 'Sombre',   primary: '#475569', secondary: '#0f172a' },
  { name: 'Nature',   primary: '#15803d', secondary: '#78350f' },
  { name: 'Pro',      primary: '#1d4ed8', secondary: '#1e1b4b' },
]

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

const INPUT = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition'
const BTN = 'w-full rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60 transition hover:bg-emerald-700'

function StepHeader({
  stepKey, num, title, icon: Icon, done, open, onToggle,
}: {
  stepKey: StepKey; num: number; title: string; icon: any
  done: boolean; open: boolean; onToggle: () => void
}) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 p-6 text-left">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors ${done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {done ? <CheckCircle2 size={20} /> : <span>{num}</span>}
      </div>
      <p className="flex-1 text-lg font-black text-slate-950">{title}</p>
      <Icon size={18} className="shrink-0 text-slate-400" />
      <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

export default function StorefrontPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [flash, setFlash] = useState('')
  const [open, setOpen] = useState<Record<StepKey, boolean>>({ identity: true, theme: false, info: false, share: false })
  const colorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (!businessId) { setLoading(false); return }

      const { data } = await supabase.from('businesses').select('*').eq('id', businessId).limit(1)
      if (data?.[0]) {
        const biz = data[0] as Business
        if (!biz.slug) {
          const slug = slugify(biz.name || 'boutique')
          await supabase.from('businesses').update({ slug, online_store_enabled: true }).eq('id', biz.id)
          biz.slug = slug
          biz.online_store_enabled = true
        }
        setBusiness(biz)
      }
      setLoading(false)
    }
    init()
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://caissepro.app'
  const shopUrl = useMemo(
    () => `${origin}/shop/${business?.slug || slugify(business?.name || 'boutique')}`,
    [origin, business?.slug, business?.name]
  )
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}&margin=10&format=png`

  function toggle(step: StepKey) {
    setOpen(prev => ({ ...prev, [step]: !prev[step] }))
  }

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(''), 3000)
  }

  async function save(step: string, payload: Record<string, any>) {
    if (!business) return
    setSaving(step)
    const { error } = await supabase.from('businesses').update(payload).eq('id', business.id)
    setSaving(null)
    if (error) showFlash(error.message)
    else { setBusiness({ ...business, ...payload }); showFlash('Sauvegardé !') }
  }

  function handleColorChange(field: 'primary_color' | 'secondary_color', value: string) {
    if (!business) return
    setBusiness({ ...business, [field]: value })
    if (colorTimer.current) clearTimeout(colorTimer.current)
    colorTimer.current = setTimeout(() => {
      supabase.from('businesses').update({ [field]: value }).eq('id', business.id)
    }, 600)
  }

  function applyTheme(theme: typeof THEMES[0]) {
    if (!business) return
    setBusiness({ ...business, primary_color: theme.primary, secondary_color: theme.secondary })
    supabase.from('businesses').update({ primary_color: theme.primary, secondary_color: theme.secondary }).eq('id', business.id)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shopUrl)
    showFlash('Lien copié !')
  }

  async function downloadQRCode() {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shopUrl)}&margin=20&format=png`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qrcode-${business?.slug || 'boutique'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printQRCode() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>QR Code — ${business?.name || 'Boutique'}</title><style>body{font-family:sans-serif;text-align:center;padding:60px 40px;}h1{font-size:28px;font-weight:900;margin-bottom:8px;}p{color:#64748b;font-size:14px;margin-bottom:24px;}img{width:260px;height:260px;border:1px solid #e2e8f0;border-radius:16px;padding:12px;}.url{margin-top:20px;font-size:13px;color:#475569;word-break:break-all;}.footer{margin-top:32px;font-size:11px;color:#94a3b8;}</style></head><body><h1>${business?.name || 'Ma Boutique'}</h1><p>Scannez pour accéder à la boutique en ligne</p><img src="${qrApiUrl}" alt="QR Code"/><div class="url">${shopUrl}</div><div class="footer">Propulsé par CaissePro</div><script>window.onload=()=>{window.print();}<\/script></body></html>`)
    win.document.close()
  }

  const done: Record<StepKey, boolean> = {
    identity: !!(business?.logo_url && business?.name && business?.slogan),
    theme:    !!(business?.primary_color && business?.primary_color !== '#16a34a'),
    info:     !!((business?.phone || business?.business_phone) && (business?.address || business?.business_address)),
    share:    !!business?.online_store_enabled,
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement boutique...</p></main>
  }

  return (
    <AppShell title="Ma Boutique" subtitle="Configurez et partagez votre boutique en ligne.">
      <div className="mx-auto max-w-2xl space-y-4">

        {flash && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
            {flash}
          </div>
        )}

        {/* ── Step 1: Identité ── */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader stepKey="identity" num={1} title="Identité" icon={Store} done={done.identity} open={open.identity} onToggle={() => toggle('identity')} />

          <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: open.identity ? '900px' : '0' }}>
            <div className="space-y-5 border-t border-slate-100 px-6 pb-6 pt-5">
              {business && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <BrandingImageUploader businessId={business.id} label="Logo" value={business.logo_url || ''} folder="logos" onUploaded={(url) => setBusiness({ ...business, logo_url: url })} />
                    <BrandingImageUploader businessId={business.id} label="Bannière" value={business.banner_url || ''} folder="banners" onUploaded={(url) => setBusiness({ ...business, banner_url: url })} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Nom de la boutique</label>
                    <input value={business.name || ''} onChange={(e) => setBusiness({ ...business, name: e.target.value })} className={INPUT} placeholder="Ex: Dakar Vapes" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Slogan</label>
                    <input value={business.slogan || ''} onChange={(e) => setBusiness({ ...business, slogan: e.target.value })} className={INPUT} placeholder="Votre boutique premium à Dakar" />
                  </div>

                  <button
                    onClick={() => save('identity', {
                      name: business.name,
                      slogan: business.slogan,
                      slug: slugify(business.name || 'boutique'),
                    })}
                    disabled={saving === 'identity'}
                    className={BTN}
                  >
                    {saving === 'identity' ? 'Sauvegarde...' : "Sauvegarder l'identité"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Step 2: Couleurs & Thème ── */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader stepKey="theme" num={2} title="Couleurs & Thème" icon={Palette} done={done.theme} open={open.theme} onToggle={() => toggle('theme')} />

          <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: open.theme ? '700px' : '0' }}>
            <div className="space-y-6 border-t border-slate-100 px-6 pb-6 pt-5">
              <div>
                <p className="mb-3 text-sm font-black text-slate-700">Thèmes prédéfinis</p>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((theme) => {
                    const active = business?.primary_color === theme.primary && business?.secondary_color === theme.secondary
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => applyTheme(theme)}
                        className={`rounded-2xl border-2 p-3 text-center transition ${active ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`}
                      >
                        <div className="mb-2 flex justify-center gap-1">
                          <div className="h-6 w-6 rounded-full shadow-sm" style={{ backgroundColor: theme.primary }} />
                          <div className="h-6 w-6 rounded-full shadow-sm" style={{ backgroundColor: theme.secondary }} />
                        </div>
                        <p className="text-xs font-black text-slate-700">{theme.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Couleur principale</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={business?.primary_color || '#16a34a'}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="h-14 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1"
                    />
                    <span className="font-mono text-sm font-bold text-slate-500">{business?.primary_color || '#16a34a'}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Couleur secondaire</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={business?.secondary_color || '#0f172a'}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="h-14 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1"
                    />
                    <span className="font-mono text-sm font-bold text-slate-500">{business?.secondary_color || '#0f172a'}</span>
                  </div>
                </div>
              </div>

              <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Les couleurs sont sauvegardées automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* ── Step 3: Informations ── */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader stepKey="info" num={3} title="Informations" icon={Info} done={done.info} open={open.info} onToggle={() => toggle('info')} />

          <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: open.info ? '900px' : '0' }}>
            <div className="space-y-5 border-t border-slate-100 px-6 pb-6 pt-5">
              {business && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">Téléphone</label>
                      <input value={business.phone || business.business_phone || ''} onChange={(e) => setBusiness({ ...business, phone: e.target.value, business_phone: e.target.value })} className={INPUT} placeholder="77 000 0000" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">WhatsApp</label>
                      <input value={business.whatsapp || business.whatsapp_number || ''} onChange={(e) => setBusiness({ ...business, whatsapp: e.target.value, whatsapp_number: e.target.value })} className={INPUT} placeholder="77 000 0000" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Adresse</label>
                    <input value={business.address || business.business_address || ''} onChange={(e) => setBusiness({ ...business, address: e.target.value, business_address: e.target.value })} className={INPUT} placeholder="Dakar, Sénégal" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Horaires d&apos;ouverture</label>
                    <input value={business.opening_hours || ''} onChange={(e) => setBusiness({ ...business, opening_hours: e.target.value })} className={INPUT} placeholder="Lun-Sam : 9h - 18h" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Lien Google Maps</label>
                    <input value={business.maps_url || ''} onChange={(e) => setBusiness({ ...business, maps_url: e.target.value })} className={INPUT} placeholder="https://maps.google.com/..." />
                  </div>

                  <button
                    onClick={() => save('info', {
                      phone: business.phone,
                      business_phone: business.business_phone,
                      whatsapp: business.whatsapp,
                      whatsapp_number: business.whatsapp_number,
                      address: business.address,
                      business_address: business.business_address,
                      opening_hours: business.opening_hours,
                      maps_url: business.maps_url,
                    })}
                    disabled={saving === 'info'}
                    className={BTN}
                  >
                    {saving === 'info' ? 'Sauvegarde...' : 'Sauvegarder les informations'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Step 4: Partager ── */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader stepKey="share" num={4} title="Partager" icon={Share2} done={done.share} open={open.share} onToggle={() => toggle('share')} />

          <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: open.share ? '900px' : '0' }}>
            <div className="space-y-6 border-t border-slate-100 px-6 pb-6 pt-5">
              {/* Publish toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div>
                  <p className="font-black text-slate-950">Boutique publiée</p>
                  <p className="text-xs font-bold text-slate-500">Visible publiquement via votre lien</p>
                </div>
                <button
                  type="button"
                  onClick={() => save('publish', { online_store_enabled: !business?.online_store_enabled, slug: business?.slug || slugify(business?.name || 'boutique') })}
                  className={`relative h-7 w-14 rounded-full transition-colors ${business?.online_store_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${business?.online_store_enabled ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {/* Open storefront button */}
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                <Globe2 size={20} /> Ouvrir ma boutique
              </a>

              {/* Shop link */}
              <div>
                <p className="mb-2 text-sm font-black text-slate-700">Lien boutique</p>
                <div className="flex gap-2">
                  <input readOnly value={shopUrl} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600" />
                  <button onClick={copyLink} className="shrink-0 rounded-2xl bg-slate-950 px-4 py-3 text-white transition hover:bg-slate-800">
                    <Copy size={16} />
                  </button>
                  <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <p className="mb-3 text-sm font-black text-slate-700">QR Code boutique</p>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="mx-auto shrink-0 rounded-[1.5rem] border-2 border-slate-100 bg-white p-3 shadow-md sm:mx-0">
                    <img src={qrApiUrl} alt="QR Code boutique" width={160} height={160} className="rounded-xl" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <button onClick={downloadQRCode} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
                      <Download size={17} /> Télécharger
                    </button>
                    <button onClick={printQRCode} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white transition hover:bg-slate-800">
                      <Printer size={17} /> Imprimer
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Visitez ma boutique en ligne !\n\n${shopUrl}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-sm font-black text-white transition hover:bg-[#1ebe5d]"
                    >
                      <MessageCircle size={17} /> Partager WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
