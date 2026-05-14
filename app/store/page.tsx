'use client'

import AppShell from '@/components/AppShell'
import ShopImageUploader from '@/components/ShopImageUploader'
import { supabase } from '@/lib/supabaseClient'
import { Crown, ExternalLink, Globe, Palette, Save, Store } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StorePage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [plan, setPlan] = useState('free')
  const [storeAllowed, setStoreAllowed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    slug: '',
    banner_url: '',
    logo_url: '',
    primary_color: '#16a34a',
    whatsapp_number: '',
    online_store_enabled: false
  })

  const cleanSlug = form.slug || 'votre-boutique'
  const shopUrl = useMemo(() => `https://caissepro.app/shop/${cleanSlug}`, [cleanSlug])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .single()

      if (!membership) {
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)

      const [{ data: business }, { data: subscription }] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', membership.business_id).single(),
        supabase.from('subscriptions').select('plan,status').eq('business_id', membership.business_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
      ])

      const activePlan = subscription?.plan || 'free'
      setPlan(activePlan)
      setStoreAllowed(activePlan === 'business' || activePlan === 'premium')

      if (business) {
        setForm({
          name: business.name || '',
          slug: business.slug || '',
          banner_url: business.banner_url || '',
          logo_url: business.logo_url || '',
          primary_color: business.primary_color || '#16a34a',
          whatsapp_number: business.whatsapp_number || '',
          online_store_enabled: Boolean(business.online_store_enabled) && (activePlan === 'business' || activePlan === 'premium')
        })
      }

      setLoading(false)
    }

    init()
  }, [router])

  async function saveStore(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const finalSlug = form.slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { error } = await supabase.from('businesses').update({
      slug: finalSlug,
      banner_url: form.banner_url,
      logo_url: form.logo_url,
      primary_color: form.primary_color,
      whatsapp_number: form.whatsapp_number,
      online_store_enabled: storeAllowed ? form.online_store_enabled : false
    }).eq('id', businessId)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({ ...form, slug: finalSlug, online_store_enabled: storeAllowed ? form.online_store_enabled : false })
    setMessage(storeAllowed ? 'Boutique en ligne mise à jour.' : 'Design sauvegardé. Passez à Business pour activer la boutique publique.')
    setSaving(false)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement boutique...</p></main>
  }

  return (
    <AppShell
      title="Boutique en ligne"
      subtitle="Créez une vitrine publique avec logo, bannière et lien partageable."
      action={
        <div className="hidden gap-3 md:flex">
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white hover:bg-amber-600">
            <Crown size={18} />
            Upgrade
          </Link>
          {storeAllowed && form.online_store_enabled && (
            <Link href={`/shop/${form.slug || ''}`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">
              <ExternalLink size={18} />
              Voir boutique
            </Link>
          )}
        </div>
      }
    >
      <div className="mx-auto max-w-5xl">
        {!storeAllowed && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-amber-700">Plan actuel: {plan}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">La boutique en ligne est disponible avec Business ou Premium.</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">Vous pouvez préparer le logo, la bannière, les couleurs et le lien. Pour publier et partager la boutique, passez à Business.</p>
              </div>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-white hover:bg-amber-600">
                <Crown size={18} />
                Voir les plans
              </Link>
            </div>
          </div>
        )}

        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-56 w-full bg-cover bg-center" style={{ backgroundColor: form.primary_color, backgroundImage: form.banner_url ? `url(${form.banner_url})` : 'none' }}>
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-6 left-6 flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">
                {form.logo_url ? <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" /> : <Store className="text-slate-300" size={40} />}
              </div>
              <div className="pb-2 text-white">
                <h2 className="text-3xl font-black">{form.name || 'Votre Boutique'}</h2>
                <p className="text-sm font-bold text-white/85">{shopUrl}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={saveStore} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Images de marque</h3>
            <div className="space-y-5">
              <ShopImageUploader label="Logo boutique" value={form.logo_url} folder="logos" previewClassName="h-32 w-full object-contain bg-white" onChange={(url) => setForm({ ...form, logo_url: url })} />
              <ShopImageUploader label="Bannière boutique" value={form.banner_url} folder="banners" previewClassName="h-40 w-full object-cover" onChange={(url) => setForm({ ...form, banner_url: url })} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Configuration</h3>
            <div className="space-y-4">
              <div><label className="mb-2 block text-sm font-black text-slate-700">Lien boutique</label><div className="relative"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none" placeholder="dakarvapes" /></div></div>
              <div><label className="mb-2 block text-sm font-black text-slate-700">WhatsApp</label><input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" placeholder="221774581111" /></div>
              <div><label className="mb-2 block text-sm font-black text-slate-700">Couleur principale</label><div className="flex items-center gap-4"><Palette style={{ color: form.primary_color }} size={24}/><input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-12 w-24 rounded-xl border border-slate-200" /></div></div>
              <label className={`flex items-center gap-3 rounded-2xl p-4 ${storeAllowed ? 'bg-slate-50' : 'bg-slate-100 opacity-70'}`}>
                <input type="checkbox" disabled={!storeAllowed} checked={form.online_store_enabled} onChange={(e) => setForm({ ...form, online_store_enabled: e.target.checked })} className="h-5 w-5" />
                <div><p className="font-black text-slate-950">Activer la boutique publique</p><p className="text-xs font-semibold text-slate-500">Disponible avec Business ou Premium.</p></div>
              </label>
              <button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-60"><Save size={18}/>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
