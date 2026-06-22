'use client'

import AppShell from '@/components/AppShell'
import ShopSwitcher from '@/components/ShopSwitcher'
import { supabase } from '@/lib/supabaseClient'
import { resolveSelectedBusiness, setSelectedBusinessId, slugify, ShopOption } from '@/lib/storefront'
import {
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Info,
  Palette,
  Store,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
}

type StepKey = 'identity' | 'theme' | 'info'

const THEMES = [
  { name: 'Moderne',  primary: '#16a34a', secondary: '#0f172a' },
  { name: 'Élégant',  primary: '#7c3aed', secondary: '#1e1b4b' },
  { name: 'Coloré',   primary: '#ea580c', secondary: '#7c3aed' },
  { name: 'Sombre',   primary: '#475569', secondary: '#0f172a' },
  { name: 'Nature',   primary: '#15803d', secondary: '#78350f' },
  { name: 'Pro',      primary: '#1d4ed8', secondary: '#1e1b4b' },
]

const INPUT = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition'
const BTN = 'w-full rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60 transition hover:bg-emerald-700'

function StepHeader({
  num, title, icon: Icon, done, open, onToggle,
}: {
  num: number; title: string; icon: any; done: boolean; open: boolean; onToggle: () => void
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

export default function CustomizePage() {
  const [shops, setShops] = useState<ShopOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [flash, setFlash] = useState('')
  const [open, setOpen] = useState<Record<StepKey, boolean>>({ identity: true, theme: false, info: false })
  const colorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadBusiness(id: string) {
    const { data } = await supabase.from('businesses').select('*').eq('id', id).maybeSingle()
    if (data) {
      const biz = data as Business
      if (!biz.slug) {
        const slug = slugify(biz.name || 'boutique')
        await supabase.from('businesses').update({ slug, online_store_enabled: true }).eq('id', biz.id)
        biz.slug = slug
        biz.online_store_enabled = true
      }
      setBusiness(biz)
    }
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
    setBusiness(null)
    await loadBusiness(id)
  }

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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!business) return
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${business.id}/logos/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) { showFlash(error.message); return }
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    await supabase.from('businesses').update({ logo_url: data.publicUrl }).eq('id', business.id)
    setBusiness({ ...business, logo_url: data.publicUrl })
    showFlash('Logo enregistré !')
  }

  async function handleBanniereUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!business) return
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${business.id}/banners/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) { showFlash(error.message); return }
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    await supabase.from('businesses').update({ banner_url: data.publicUrl }).eq('id', business.id)
    setBusiness({ ...business, banner_url: data.publicUrl })
    showFlash('Bannière enregistrée !')
  }

  const done: Record<StepKey, boolean> = {
    identity: !!(business?.logo_url && business?.name && business?.slogan),
    theme:    !!(business?.primary_color && business?.primary_color !== '#16a34a'),
    info:     !!((business?.phone || business?.business_phone) && (business?.address || business?.business_address)),
  }

  if (loading) {
    return (
      <AppShell title="Personnaliser ma boutique" subtitle="Logo, bannière, couleurs et thème.">
        <div className="mx-auto max-w-2xl"><p className="font-black text-slate-600">Chargement...</p></div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Personnaliser ma boutique" subtitle="Logo, bannière, couleurs et thème.">
      <div className="mx-auto max-w-2xl space-y-4">
        <ShopSwitcher shops={shops} selectedId={selectedId} onChange={switchShop} />

        {flash && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
            {flash}
          </div>
        )}

        {/* Publish toggle */}
        {business && (
          <div className="flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div>
              <p className="font-black text-slate-950">Boutique publiée</p>
              <p className="text-xs font-bold text-slate-500">Visible publiquement via votre lien</p>
            </div>
            <button
              type="button"
              onClick={() => save('publish', { online_store_enabled: !business.online_store_enabled, slug: business.slug || slugify(business.name || 'boutique') })}
              className={`relative h-7 w-14 rounded-full transition-colors ${business.online_store_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${business.online_store_enabled ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        )}

        {/* Identité */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader num={1} title="Identité" icon={Store} done={done.identity} open={open.identity} onToggle={() => toggle('identity')} />
          <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: open.identity ? '900px' : '0' }}>
            <div className="space-y-5 border-t border-slate-100 px-6 pb-6 pt-5">
              {business && (
                <>
                  <div className="flex flex-row gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => (document.getElementById('logo-upload') as HTMLInputElement)?.click()}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl"
                    >
                      <ImagePlus size={17} /> Ajoute ton Logo
                    </button>
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e)} />

                    <button
                      type="button"
                      onClick={() => (document.getElementById('banniere-upload') as HTMLInputElement)?.click()}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl"
                    >
                      <Upload size={17} /> Ajoute ta Bannière
                    </button>
                    <input id="banniere-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleBanniereUpload(e)} />
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
                      slug: business.slug || slugify(business.name || 'boutique'),
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

        {/* Couleurs & Thème */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader num={2} title="Couleurs & Thème" icon={Palette} done={done.theme} open={open.theme} onToggle={() => toggle('theme')} />
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

        {/* Informations */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <StepHeader num={3} title="Informations" icon={Info} done={done.info} open={open.info} onToggle={() => toggle('info')} />
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

      </div>
    </AppShell>
  )
}
