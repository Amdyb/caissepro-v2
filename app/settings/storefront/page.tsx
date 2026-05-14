'use client'

import AppShell from '@/components/AppShell'
import BusinessImageUploader from '@/components/BusinessImageUploader'
import { supabase } from '@/lib/supabaseClient'
import { Copy, ExternalLink, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export default function StorefrontSettingsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', slogan: '', phone: '', whatsapp: '', address: '',
    primary_color: '#16a34a', online_store_enabled: true,
    logo_url: '', banner_url: ''
  })

  const shopUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/shop/${form.slug || 'votre-boutique'}`
    return `${window.location.origin}/shop/${form.slug || 'votre-boutique'}`
  }, [form.slug])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase.from('business_members').select('business_id, businesses(*)').eq('user_id', userData.user.id).limit(1).single()
      const member: any = membership
      if (!member?.business_id) { setMessage('Aucun business trouvé.'); setLoading(false); return }

      const business = member.businesses || {}
      setBusinessId(member.business_id)
      setForm({
        name: business.name || '',
        slug: business.slug || slugify(business.name || ''),
        slogan: business.slogan || '',
        phone: business.phone || business.business_phone || '',
        whatsapp: business.whatsapp || business.whatsapp_number || '',
        address: business.address || business.business_address || '',
        primary_color: business.primary_color || '#16a34a',
        online_store_enabled: business.online_store_enabled ?? true,
        logo_url: business.logo_url || '',
        banner_url: business.banner_url || ''
      })
      setLoading(false)
    }
    init()
  }, [router])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true); setMessage('')
    const cleanSlug = slugify(form.slug || form.name)
    const { error } = await supabase.from('businesses').update({
      name: form.name, slug: cleanSlug, slogan: form.slogan,
      phone: form.phone, whatsapp: form.whatsapp, address: form.address,
      primary_color: form.primary_color, online_store_enabled: form.online_store_enabled,
      logo_url: form.logo_url, banner_url: form.banner_url
    }).eq('id', businessId)
    setSaving(false)
    if (error) { setMessage(error.message); return }
    setForm({ ...form, slug: cleanSlug })
    setMessage('Boutique en ligne mise à jour.')
  }

  async function copyShopLink() { await navigator.clipboard.writeText(shopUrl); setMessage('Lien boutique copié.') }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement boutique...</p></main>

  return (
    <AppShell title="Boutique en ligne" subtitle="Personnalisez votre vitrine publique.">
      <div className="mx-auto max-w-5xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}
        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8"><h1 className="text-5xl font-black tracking-tight text-slate-950">Votre boutique publique.</h1><p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">Créez un lien partageable pour vendre avec WhatsApp.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={copyShopLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700"><Copy size={18}/>Copier le lien</button><Link href={`/shop/${form.slug || 'votre-boutique'}`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"><ExternalLink size={18}/>Voir boutique</Link></div></div>

        <form onSubmit={saveSettings} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"><div className="grid gap-6">
          <div><label className="mb-2 block text-sm font-black text-slate-700">Nom de la boutique</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="Dakar Vapes" /></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Lien boutique</label><div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><span className="hidden shrink-0 items-center bg-slate-100 px-4 text-sm font-bold text-slate-500 md:flex">/shop/</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="w-full bg-transparent px-5 py-4 font-semibold outline-none" placeholder="dakar-vapes" /></div><p className="mt-2 break-all text-xs font-bold text-slate-500">{shopUrl}</p></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Slogan</label><input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="La boutique moderne de Dakar" /></div>
          <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-black text-slate-700">Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="78 458 1111" /></div><div><label className="mb-2 block text-sm font-black text-slate-700">WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="78 458 1111" /></div></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="Dakar, Sénégal" /></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Couleur principale</label><input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-14 w-24 rounded-2xl border border-slate-200 bg-white p-2" /></div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={form.online_store_enabled} onChange={(e) => setForm({ ...form, online_store_enabled: e.target.checked })} />Publier ma boutique en ligne</label>
          <div className="grid gap-5 md:grid-cols-2"><BusinessImageUploader label="Logo" value={form.logo_url} folder="logos" previewClassName="h-40" onChange={(url) => setForm({ ...form, logo_url: url })} /><BusinessImageUploader label="Bannière" value={form.banner_url} folder="banners" previewClassName="h-40" onChange={(url) => setForm({ ...form, banner_url: url })} /></div>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-50"><Save size={20}/>{saving ? 'Sauvegarde...' : 'Sauvegarder la boutique'}</button>
        </div></form>
      </div>
    </AppShell>
  )
}
