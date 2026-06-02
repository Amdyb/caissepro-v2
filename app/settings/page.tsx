'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandingImageUploader from '@/components/BrandingImageUploader'
import { getThemePreference, setThemePreference } from '@/components/DarkModeProvider'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Car,
  Clock,
  Droplets,
  HardHat,
  Home,
  MapPin,
  Moon,
  Palette,
  Phone,
  Quote,
  Save,
  Scissors,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const businessTypes = [
  { value: 'retail',    label: 'Commerce & Boutique',      desc: 'Vente au détail, boutique, supérette',  icon: ShoppingBag, accent: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'restaurant',label: 'Restaurant',               desc: 'Restauration, café, fast-food',          icon: ShoppingCart,accent: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'beauty',    label: 'Salon & Beauté',            desc: 'Coiffure, esthétique, spa',              icon: Scissors,    accent: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
  { value: 'pharmacy',  label: 'Pharmacie',                desc: 'Pharmacie, parapharmacie',               icon: Building2,   accent: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'garage',    label: 'Garage & Auto',             desc: 'Mécanique, carrosserie, pièces',        icon: Car,         accent: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  { value: 'btp',       label: 'BTP & Services',            desc: 'Construction, artisanat, services',     icon: HardHat,     accent: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'tontine',   label: 'Tontine',                  desc: 'Épargne communautaire, tontines',        icon: Users,       accent: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { value: 'rental',    label: 'Location & Immobilier',     desc: 'Location, agence immobilière',          icon: Home,        accent: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { value: 'wholesale', label: 'Grossiste',                desc: 'Vente en gros, distribution',            icon: ShoppingBag, accent: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { value: 'laundry',   label: 'Laverie & Pressing',        desc: 'Blanchisserie, pressing, nettoyage',   icon: Droplets,    accent: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

type Business = {
  id: string
  name: string
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
  receipt_footer: string | null
  business_phone: string | null
  business_address: string | null
  slogan: string | null
  business_type?: string | null
}

export default function SettingsPage() {
  const router = useRouter()

  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [themePref, setThemePrefState] = useState<'auto' | 'light' | 'dark'>('auto')
  const [soundsEnabled, setSoundsEnabled] = useState(false)
  const [soundNav, setSoundNav] = useState(true)
  const [soundSale, setSoundSale] = useState(true)

  useEffect(() => {
    setThemePrefState((getThemePreference() as 'auto' | 'light' | 'dark') || 'auto')
    setSoundsEnabled(localStorage.getItem('caissepro-sounds-enabled') !== '0')
    setSoundNav(localStorage.getItem('caissepro-sounds-nav') !== '0')
    setSoundSale(localStorage.getItem('caissepro-sounds-sale') !== '0')
  }, [])

  function toggleSounds(on: boolean) {
    setSoundsEnabled(on)
    localStorage.setItem('caissepro-sounds-enabled', on ? '1' : '0')
  }

  function toggleSubSound(key: string, setter: (v: boolean) => void, on: boolean) {
    setter(on)
    localStorage.setItem(key, on ? '1' : '0')
  }

  const [form, setForm] = useState({
    name: '',
    business_type: 'retail',
    logo_url: '',
    banner_url: '',
    primary_color: '#16a34a',
    secondary_color: '#0f172a',
    receipt_footer: '',
    business_phone: '',
    business_address: '',
    slogan: ''
  })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (error || !membership) {
        setLoading(false)
        return
      }

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', membership.business_id)
        .maybeSingle()

      if (businessData) {
        setBusiness(businessData)

        setForm({
          name: businessData.name || '',
          business_type: businessData.business_type || 'retail',
          logo_url: businessData.logo_url || '',
          banner_url: businessData.banner_url || '',
          primary_color: businessData.primary_color || '#16a34a',
          secondary_color: businessData.secondary_color || '#0f172a',
          receipt_footer: businessData.receipt_footer || '',
          business_phone: businessData.business_phone || businessData.phone || '',
          business_address: businessData.business_address || businessData.address || '',
          slogan: businessData.slogan || ''
        })
      }

      setLoading(false)
    }

    init()
  }, [router])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()

    if (!business) return

    setSaving(true)
    setMessage('')

    const slug = slugify(form.name || 'shop')

    const payload = {
      name: form.name,
      slug,
      business_type: form.business_type,
      logo_url: form.logo_url,
      banner_url: form.banner_url,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      receipt_footer: form.receipt_footer,
      business_phone: form.business_phone,
      business_address: form.business_address,
      phone: form.business_phone,
      address: form.business_address,
      slogan: form.slogan,
      online_store_enabled: true
    }

    const { error } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', business.id)

    if (error) {
      setMessage(error.message)
      window.dispatchEvent(new Event('play-error'))
      setSaving(false)
      return
    }

    setBusiness((prev) => prev ? { ...prev, ...payload } : prev)

    setMessage('Storefront synchronise avec succes.')
    window.dispatchEvent(new Event('play-success'))
    setSaving(false)

    router.refresh()
  }

  async function autoSaveBusinessType(newType: string) {
    if (!business) return
    console.log('[business_type] saving:', newType)
    setForm((prev) => ({ ...prev, business_type: newType }))
    const { error } = await supabase.from('businesses').update({ business_type: newType }).eq('id', business.id)
    if (error) {
      console.log('[business_type] save error:', error.message)
      setMessage(error.message)
      window.dispatchEvent(new Event('play-error'))
      return
    }
    console.log('[business_type] saved successfully:', newType)
    setMessage('Type de commerce mis à jour')
    window.dispatchEvent(new Event('play-success'))
    window.dispatchEvent(new CustomEvent('business-type-changed', { detail: { businessType: newType } }))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-green-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Branding & paramètres</h1>
          </div>
          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Déconnexion</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && <div className="mb-6 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">{message}</div>}

        {/* Theme selector */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-5 text-xl font-black text-slate-950 dark:text-white">Thème de l'interface</h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'auto', icon: Clock, label: 'Automatique', desc: 'Sombre 19h–6h, clair sinon' },
              { key: 'light', icon: Sun, label: 'Clair', desc: 'Toujours en mode clair' },
              { key: 'dark', icon: Moon, label: 'Sombre', desc: 'Toujours en mode sombre' },
            ] as const).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setThemePrefState(key); setThemePreference(key) }}
                className={`flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition ${
                  themePref === key
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
              >
                <Icon size={22} className={themePref === key ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                <div>
                  <p className={`text-sm font-black ${themePref === key ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{label}</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-400 dark:text-slate-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sound settings */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Sons de l'application</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Sons lors des ventes, navigation et interactions</p>
            </div>
            <button
              onClick={() => toggleSounds(!soundsEnabled)}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${soundsEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${soundsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
            {soundsEnabled ? <Volume2 size={16} className="text-emerald-600" /> : <VolumeX size={16} />}
            <span>{soundsEnabled ? 'Sons activés' : 'Sons désactivés'}</span>
          </div>
          {soundsEnabled && (
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-700">
              {[
                { label: 'Sons de navigation', desc: 'Clic discret lors des changements de page', key: 'caissepro-sounds-nav', value: soundNav, setter: setSoundNav },
                { label: 'Son de caisse (cha-ching)', desc: 'Son à chaque vente confirmée', key: 'caissepro-sounds-sale', value: soundSale, setter: setSoundSale },
              ].map(({ label, desc, key, value, setter }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{label}</p>
                    <p className="text-xs font-semibold text-slate-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSubSound(key, setter, !value)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-green-50 p-3 text-green-700"><Building2 /></div><div><h2 className="text-2xl font-black text-slate-950">Informations boutique</h2><p className="text-sm text-slate-500">Personnalisez votre marque et votre module métier.</p></div></div>

            <form onSubmit={saveSettings} className="space-y-5">
              <div><label className="text-sm font-bold text-slate-700">Nom boutique</label><input required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><BriefcaseBusiness size={16} />Type de business</label>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {businessTypes.map((type) => {
                    const Icon = type.icon
                    const selected = form.business_type === type.value
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => autoSaveBusinessType(type.value)}
                        className="flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition"
                        style={selected ? { borderColor: type.border, backgroundColor: type.bg } : { borderColor: '#e2e8f0', backgroundColor: '#fff' }}
                      >
                        <Icon size={20} style={{ color: selected ? type.accent : '#94a3b8' }} />
                        <p className="text-xs font-black leading-tight" style={{ color: selected ? type.accent : '#1e293b' }}>{type.label}</p>
                        <p className="text-xs font-semibold text-slate-400 leading-tight">{type.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {business && (
                <>
                  <BrandingImageUploader businessId={business.id} label="Logo" value={form.logo_url} folder="logos" onUploaded={(url) => setForm({ ...form, logo_url: url })} />
                  <BrandingImageUploader businessId={business.id} label="Bannière" value={form.banner_url} folder="banners" onUploaded={(url) => setForm({ ...form, banner_url: url })} />
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2"><div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Palette size={16} />Couleur principale</label><input type="color" className="mt-2 h-14 w-full rounded-2xl border border-slate-300" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} /></div><div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Palette size={16} />Couleur secondaire</label><input type="color" className="mt-2 h-14 w-full rounded-2xl border border-slate-300" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} /></div></div>
              <div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Phone size={16} />Téléphone</label><input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.business_phone} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} /></div>
              <div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><MapPin size={16} />Adresse</label><input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} /></div>
              <div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Quote size={16} />Slogan</label><input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} /></div>
              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white" style={{ backgroundColor: form.primary_color }}><Save size={18} />{saving ? 'Enregistrement...' : 'Enregistrer paramètres'}</button>
            </form>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-40 w-full" style={{ backgroundColor: form.secondary_color, backgroundImage: form.banner_url ? `url(${form.banner_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="relative px-6 pb-6">
              <div className="absolute -top-14 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">
                {form.logo_url ? <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain" /> : <Building2 size={42} className="text-slate-400" />}
              </div>
              <div className="pt-20">
                <h2 className="text-3xl font-black text-slate-950">{form.name || 'Nom boutique'}</h2>
                <p className="mt-2 font-semibold text-slate-500">{form.slogan || 'Votre slogan ici'}</p>
                {(() => {
                  const bt = businessTypes.find(t => t.value === form.business_type)
                  if (!bt) return null
                  const Icon = bt.icon
                  return (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black" style={{ backgroundColor: bt.bg, color: bt.accent, border: `1.5px solid ${bt.border}` }}>
                      <Icon size={13} />
                      {bt.label}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
