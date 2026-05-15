'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandingImageUploader from '@/components/BrandingImageUploader'
import {
  ArrowLeft,
  Building2,
  Palette,
  Save,
  Phone,
  MapPin,
  Quote,
  BriefcaseBusiness
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const businessTypes = [
  { value: 'retail', label: 'Commerce & Boutique' },
  { value: 'restaurant', label: 'Restaurant & Fast Food' },
  { value: 'laundry', label: 'Blanchisserie & Pressing' },
  { value: 'beauty', label: 'Salon & Beauté' },
  { value: 'tontine', label: 'Tontine & Épargne' },
  { value: 'services', label: 'Services' },
  { value: 'grocery', label: 'Épicerie & Alimentation' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'fashion', label: 'Mode & Accessoires' }
]

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
        .single()

      if (error || !membership) {
        setLoading(false)
        return
      }

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', membership.business_id)
        .single()

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

    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name,
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
        slogan: form.slogan
      })
      .eq('id', business.id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Paramètres mis à jour. Le menu et le dashboard s’adapteront au type choisi.')
    setSaving(false)
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

        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-green-50 p-3 text-green-700"><Building2 /></div><div><h2 className="text-2xl font-black text-slate-950">Informations boutique</h2><p className="text-sm text-slate-500">Personnalisez votre marque et votre module métier.</p></div></div>

            <form onSubmit={saveSettings} className="space-y-5">
              <div><label className="text-sm font-bold text-slate-700">Nom boutique</label><input required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><BriefcaseBusiness size={16} />Type de business</label>
                <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-green-600" value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })}>
                  {businessTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-700">Changer le type adapte les modules, le menu, le dashboard et les outils visibles sans supprimer vos données.</p>
              </div>

              {business && (
                <>
                  <BrandingImageUploader
                    businessId={business.id}
                    label="Logo"
                    value={form.logo_url}
                    folder="logos"
                    onUploaded={(url) => setForm({ ...form, logo_url: url })}
                  />
                  <BrandingImageUploader
                    businessId={business.id}
                    label="Bannière"
                    value={form.banner_url}
                    folder="banners"
                    onUploaded={(url) => setForm({ ...form, banner_url: url })}
                  />
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2"><div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Palette size={16} />Couleur principale</label><input type="color" className="mt-2 h-14 w-full rounded-2xl border border-slate-300" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} /></div><div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Palette size={16} />Couleur secondaire</label><input type="color" className="mt-2 h-14 w-full rounded-2xl border border-slate-300" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} /></div></div>
              <div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Phone size={16} />Téléphone</label><input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.business_phone} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} /></div>
              <div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><MapPin size={16} />Adresse</label><input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} /></div>
              <div><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Quote size={16} />Slogan</label><input className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" placeholder="Ex: Technologie + performance" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} /></div>
              <div><label className="text-sm font-bold text-slate-700">Footer reçu</label><textarea rows={3} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600" placeholder="Merci pour votre achat" value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} /></div>

              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white" style={{ backgroundColor: form.primary_color }}><Save size={18} />{saving ? 'Enregistrement...' : 'Enregistrer paramètres'}</button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="h-40 w-full" style={{ backgroundColor: form.secondary_color, backgroundImage: form.banner_url ? `url(${form.banner_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} /><div className="relative px-6 pb-6"><div className="absolute -top-14 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">{form.logo_url ? <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain" /> : <Building2 size={42} className="text-slate-400" />}</div><div className="pt-20"><h2 className="text-3xl font-black text-slate-950">{form.name || 'Nom boutique'}</h2><p className="mt-2 font-semibold text-slate-500">{form.slogan || 'Votre slogan ici'}</p><p className="mt-2 text-sm font-black text-green-700">Module: {businessTypes.find((t) => t.value === form.business_type)?.label}</p><div className="mt-6 flex flex-wrap gap-3"><div className="rounded-full px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: form.primary_color }}>Bouton principal</div><div className="rounded-full px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: form.secondary_color }}>Couleur secondaire</div></div></div></div></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-2xl font-black text-slate-950">Aperçu reçu</h3><div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6"><div className="text-center">{form.logo_url && <img src={form.logo_url} alt="Logo" className="mx-auto mb-4 h-20 w-20 object-contain" />}<h4 className="text-2xl font-black text-slate-950">{form.name || 'Nom boutique'}</h4><p className="mt-1 text-sm font-semibold text-slate-500">{form.business_phone || 'Téléphone'}</p><p className="text-sm font-semibold text-slate-500">{form.business_address || 'Adresse'}</p><div className="my-5 border-t border-dashed border-slate-300" /><div className="space-y-2 text-sm font-bold text-slate-700"><div className="flex justify-between"><span>Produit</span><span>5 000 CFA</span></div><div className="flex justify-between"><span>Produit 2</span><span>10 000 CFA</span></div></div><div className="my-5 border-t border-dashed border-slate-300" /><div className="flex justify-between text-lg font-black text-slate-950"><span>Total</span><span>15 000 CFA</span></div><p className="mt-6 text-sm font-semibold text-slate-500">{form.receipt_footer || 'Merci pour votre achat'}</p><p className="mt-2 text-xs font-bold text-slate-400">Powered by CaissePro</p></div></div></div>
          </div>
        </div>
      </section>
    </main>
  )
}
