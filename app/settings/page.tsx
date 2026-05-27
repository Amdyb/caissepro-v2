'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandingImageUploader from '@/components/BrandingImageUploader'
import { getThemePreference, setThemePreference } from '@/components/DarkModeProvider'
import { Clock, Moon, Sun,
  ArrowLeft,
  Building2,
  Palette,
  Save,
  Phone,
  MapPin,
  Quote,
  BriefcaseBusiness,
  Volume2,
  VolumeX
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const businessTypes = [
  { value: 'retail', label: 'Commerce & Boutique' },
  { value: 'restaurant', label: 'Restaurant & Fast Food' },
  { value: 'beauty', label: 'Salon & Beauté' },
  { value: 'pharmacy', label: 'Pharmacie' },
  { value: 'garage', label: 'Garage & Auto' },
  { value: 'btp', label: 'BTP & Services' },
  { value: 'tontine', label: 'Tontine & Épargne' },
  { value: 'rental', label: 'Location & Immobilier' },
  { value: 'wholesale', label: 'Grossiste' },
  { value: 'laundry', label: 'Laverie & Pressing' },
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

  useEffect(() => {
    setThemePrefState((getThemePreference() as 'auto' | 'light' | 'dark') || 'auto')
    setSoundsEnabled(localStorage.getItem('caissepro-sounds-enabled') === '1')
  }, [])

  function toggleSounds(on: boolean) {
    setSoundsEnabled(on)
    if (on) {
      localStorage.setItem('caissepro-sounds-enabled', '1')
    } else {
      localStorage.removeItem('caissepro-sounds-enabled')
    }
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
    setForm((prev) => ({ ...prev, business_type: newType }))
    await supabase.from('businesses').update({ business_type: newType }).eq('id', business.id)
    setMessage('Type de commerce mis a jour')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('business-type-changed', { detail: { type: newType } }))
    }
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

        {/* Sound toggle */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Sons de l'interface</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Sons lors des ventes, confirmations et erreurs</p>
            </div>
            <button
              onClick={() => toggleSounds(!soundsEnabled)}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${soundsEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${soundsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
            {soundsEnabled ? <Volume2 size={16} className="text-emerald-600" /> : <VolumeX size={16} />}
            <span>{soundsEnabled ? 'Sons activés' : 'Sons désactivés'}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-green-50 p-3 text-green-700"><Building2 /></div><div><h2 className="text-2xl font-black text-slate-950">Informations boutique</h2><p className="text-sm text-slate-500">Personnalisez votre marque et votre module métier.</p></div></div>

            <form onSubmit={saveSettings} className="space-y-5">
              <div><label className="text-sm font-bold text-slate-700">Nom boutique</label><input required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><BriefcaseBusiness size={16} />Type de business</label>
                <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-green-600" value={form.business_type} onChange={(e) => autoSaveBusinessType(e.target.value)}>
                  {businessTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
