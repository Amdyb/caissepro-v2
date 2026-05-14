'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Copy, ExternalLink, Globe, ImageIcon, Palette, QrCode, Save, Share2, Store } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StorePage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
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
  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(shopUrl)}`
  }, [shopUrl])

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

      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', membership.business_id)
        .single()

      if (business) {
        setForm({
          name: business.name || '',
          slug: business.slug || '',
          banner_url: business.banner_url || '',
          logo_url: business.logo_url || '',
          primary_color: business.primary_color || '#16a34a',
          whatsapp_number: business.whatsapp_number || '',
          online_store_enabled: business.online_store_enabled || false
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

    const { error } = await supabase
      .from('businesses')
      .update({
        slug: finalSlug,
        banner_url: form.banner_url,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        whatsapp_number: form.whatsapp_number,
        online_store_enabled: form.online_store_enabled
      })
      .eq('id', businessId)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({ ...form, slug: finalSlug })
    setMessage('Boutique en ligne mise à jour.')
    setSaving(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shopUrl)
    setMessage('Lien boutique copié.')
  }

  async function shareStore() {
    if (navigator.share) {
      await navigator.share({
        title: form.name || 'Ma boutique CaissePro',
        text: `Découvrez ma boutique ${form.name}`,
        url: shopUrl
      })
      return
    }

    await copyLink()
  }

  async function downloadQrCode() {
    const response = await fetch(qrCodeUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cleanSlug}-qr-code.png`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement boutique...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Boutique en ligne"
      subtitle="Personnalisez votre vitrine publique."
      action={
        <div className="hidden gap-3 md:flex">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Copy size={18} />
            Copier lien
          </button>
          <Link
            href={`/shop/${form.slug || ''}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
          >
            <ExternalLink size={18} />
            Voir boutique
          </Link>
        </div>
      }
    >
      <div className="mx-auto max-w-5xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-500">Votre lien public</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-900">
                {shopUrl}
              </div>
              <button
                onClick={shareStore}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
              >
                <Share2 size={18} />
                Partager
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <QrCode size={24} />
            </div>
            <p className="text-sm font-black text-slate-500">QR code boutique</p>
            <img src={qrCodeUrl} alt="QR code boutique" className="mx-auto mt-4 h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2" />
            <button
              onClick={downloadQrCode}
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              Télécharger QR code
            </button>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="relative h-52 w-full bg-cover bg-center"
            style={{
              backgroundColor: form.primary_color,
              backgroundImage: form.banner_url ? `url(${form.banner_url})` : 'none'
            }}
          >
            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute bottom-6 left-6 flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Store className="text-slate-300" size={40} />
                )}
              </div>

              <div className="pb-2 text-white">
                <h2 className="text-3xl font-black">{form.name || 'Votre Boutique'}</h2>
                <p className="text-sm font-bold text-white/85">
                  caissepro.app/shop/{form.slug || 'votre-boutique'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={saveStore} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Identité visuelle</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Logo URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Banner URL</label>
                <input
                  value={form.banner_url}
                  onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Couleur principale</label>
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <Palette style={{ color: form.primary_color }} size={24} />
                  </div>

                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="h-12 w-24 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Configuration boutique</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Nom boutique</label>
                <input
                  value={form.name}
                  disabled
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Lien boutique</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    placeholder="dakarvapes"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">WhatsApp</label>
                <input
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="221774581111"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.online_store_enabled}
                  onChange={(e) => setForm({ ...form, online_store_enabled: e.target.checked })}
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-black text-slate-950">Activer la boutique publique</p>
                  <p className="text-xs font-semibold text-slate-500">
                    Les clients pourront voir et partager votre boutique.
                  </p>
                </div>
              </label>

              <button
                disabled={saving}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer boutique'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
