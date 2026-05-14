'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Globe, ImageIcon, Palette, Save, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
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

    const { error } = await supabase
      .from('businesses')
      .update({
        slug: form.slug.toLowerCase().replace(/\s+/g, '-'),
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

    setMessage('Boutique en ligne mise à jour.')
    setSaving(false)
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
    >
      <div className="mx-auto max-w-5xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

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
