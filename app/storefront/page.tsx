'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Copy, ExternalLink, Globe2, Share2, Store } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
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
      if (data?.[0]) setBusiness(data[0] as Business)
      setLoading(false)
    }
    init()
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://caissepro.app'
  const currentSlug = business?.slug || slugify(business?.name || 'boutique')
  const shopUrl = `${origin}/shop/${currentSlug}`

  async function activateStorefront() {
    if (!business) return
    setSaving(true)
    setMessage('')

    const slug = business.slug || slugify(business.name || `shop-${business.id.slice(0, 8)}`)

    const { data, error } = await supabase
      .from('businesses')
      .update({ slug, online_store_enabled: true })
      .eq('id', business.id)
      .select('*')
      .limit(1)

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setBusiness((data?.[0] as Business) || { ...business, slug, online_store_enabled: true })
    setMessage('Boutique en ligne activée. Vous pouvez maintenant partager le lien.')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shopUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement boutique...</p></main>

  return (
    <AppShell title="Partager ma boutique" subtitle="Activez et partagez votre boutique en ligne.">
      <div className="mx-auto max-w-5xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="h-56 bg-slate-950" style={{ backgroundImage: business?.banner_url ? `url(${business.banner_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="relative p-8 pt-20">
            <div className="absolute -top-16 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-xl">
              {business?.logo_url ? <img src={business.logo_url} alt="Logo" className="h-full w-full object-contain" /> : <Store size={52} className="text-slate-400" />}
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-black text-slate-950">{business?.name || 'Votre boutique'}</h1>
                <p className="mt-2 text-lg font-semibold text-slate-500">{business?.slogan || 'Votre boutique en ligne CaissePro'}</p>
                <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">{business?.business_type || 'retail'}</div>
              </div>
              <button onClick={activateStorefront} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60">
                <Globe2 size={18} /> {saving ? 'Activation...' : business?.online_store_enabled ? 'Mettre à jour lien' : 'Activer boutique'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950"><Share2 /> Lien public</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input readOnly value={shopUrl} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700" />
            <button onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white"><Copy size={17} /> {copied ? 'Copié' : 'Copier'}</button>
            <a href={shopUrl} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700"><ExternalLink size={17} /> Ouvrir</a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-500"><CheckCircle2 size={16} className="text-emerald-600" /> Si vous obtenez 404, cliquez d’abord sur “Activer boutique”.</p>
        </div>
      </div>
    </AppShell>
  )
}
