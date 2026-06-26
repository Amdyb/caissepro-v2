'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Copy, Download, ExternalLink, ImagePlus, MessageCircle, Printer, QrCode, Save, Upload } from 'lucide-react'
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
    google_maps_url: '',
    primary_color: '#16a34a', online_store_enabled: true,
    age_verification_required: false,
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

      const { data: membership } = await supabase.from('business_members').select('business_id, businesses(*)').eq('user_id', userData.user.id).limit(1).maybeSingle()
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
        google_maps_url: business.google_maps_url || '',
        primary_color: business.primary_color || '#16a34a',
        online_store_enabled: business.online_store_enabled ?? true,
        age_verification_required: business.age_verification_required ?? false,
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
      business_address: form.address, google_maps_url: form.google_maps_url.trim() || null,
      primary_color: form.primary_color, online_store_enabled: form.online_store_enabled,
      age_verification_required: form.age_verification_required,
      logo_url: form.logo_url, banner_url: form.banner_url
    }).eq('id', businessId)
    setSaving(false)
    if (error) { setMessage(error.message); return }
    setForm({ ...form, slug: cleanSlug })
    setMessage('Boutique en ligne mise à jour.')
  }

  async function uploadImageFile(file: File, folder: 'logos' | 'banners'): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { upsert: false })
    if (error) { setMessage(error.message); return null }
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    return data.publicUrl
  }

  async function copyShopLink() { await navigator.clipboard.writeText(shopUrl); setMessage('Lien boutique copié.') }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}&margin=10&format=png`

  async function downloadQRCode() {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shopUrl)}&margin=20&format=png`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qrcode-${form.slug || 'boutique'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printQRCode() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR Code — ${form.name || 'Boutique'}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 60px 40px; }
        h1 { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
        p { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        img { width: 260px; height: 260px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; }
        .url { margin-top: 20px; font-size: 13px; color: #475569; word-break: break-all; }
        .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; }
      </style></head>
      <body>
        <h1>${form.name || 'Ma Boutique'}</h1>
        <p>Scannez pour accéder à la boutique en ligne</p>
        <img src="${qrApiUrl}" alt="QR Code" />
        <div class="url">${shopUrl}</div>
        <div class="footer">Propulsé par CaissePro</div>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `)
    win.document.close()
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement boutique...</p></main>

  return (
    <AppShell title="Boutique en ligne" subtitle="Personnalisez votre vitrine publique.">
      <div className="mx-auto max-w-5xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}
        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8"><h1 className="text-5xl font-black tracking-tight text-slate-950">Votre boutique publique.</h1><p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">Créez un lien partageable pour vendre avec WhatsApp.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={copyShopLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700"><Copy size={18}/>Copier le lien</button><Link href={`/shop/${form.slug || 'votre-boutique'}`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"><ExternalLink size={18}/>Voir boutique</Link></div></div>

        {/* QR Code section */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">QR Code boutique</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Imprimez ou partagez le QR code de votre vitrine.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-[2rem] border-2 border-slate-100 bg-white p-4 shadow-lg">
              <img
                src={qrApiUrl}
                alt="QR Code boutique"
                width={180}
                height={180}
                className="rounded-2xl"
              />
            </div>

            <div className="flex flex-1 flex-col gap-4">
              <div>
                <p className="text-sm font-black text-slate-700">Lien encodé</p>
                <p className="mt-1 break-all rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">{shopUrl}</p>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Vos clients scannent ce QR code pour accéder directement à votre boutique en ligne.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadQRCode}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <Download size={17} /> Télécharger
                </button>
                <button
                  type="button"
                  onClick={printQRCode}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800"
                >
                  <Printer size={17} /> Imprimer
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Visitez ma boutique en ligne !\n\n${shopUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 text-sm font-black text-white hover:bg-[#1ebe5d]"
                >
                  <MessageCircle size={17} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={saveSettings} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"><div className="grid gap-6">
          <div><label className="mb-2 block text-sm font-black text-slate-700">Nom de la boutique</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="Dakar Vapes" /></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Lien boutique</label><div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><span className="hidden shrink-0 items-center bg-slate-100 px-4 text-sm font-bold text-slate-500 md:flex">/shop/</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="w-full bg-transparent px-5 py-4 font-semibold outline-none" placeholder="dakar-vapes" /></div><p className="mt-2 break-all text-xs font-bold text-slate-500">{shopUrl}</p></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Slogan</label><input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="La boutique moderne de Dakar" /></div>
          <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-black text-slate-700">Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="78 458 1111" /></div><div><label className="mb-2 block text-sm font-black text-slate-700">WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="78 458 1111" /></div></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="Dakar, Sénégal" /></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Lien Google Maps (itinéraire)</label><input value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none focus:border-emerald-500" placeholder="https://maps.app.goo.gl/..." /><p className="mt-2 text-xs font-bold text-slate-500">Ouvrez votre boutique dans Google Maps, touchez « Partager » et collez le lien ici. Vos clients obtiendront l&apos;itinéraire exact. Sinon, l&apos;adresse ci-dessus est utilisée.</p></div>
          <div><label className="mb-2 block text-sm font-black text-slate-700">Couleur principale</label><input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-14 w-24 rounded-2xl border border-slate-200 bg-white p-2" /></div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={form.online_store_enabled} onChange={(e) => setForm({ ...form, online_store_enabled: e.target.checked })} />Publier ma boutique en ligne</label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" className="mt-0.5" checked={form.age_verification_required} onChange={(e) => setForm({ ...form, age_verification_required: e.target.checked })} /><span>Exiger une vérification d&apos;âge (18 ans et plus)<span className="mt-1 block text-xs font-semibold text-slate-500">Pour les produits réservés aux adultes (vapotage, alcool…). Une page de confirmation s&apos;affiche avant la boutique.</span></span></label>
          <div className="flex flex-row gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-black text-white transition hover:bg-emerald-700">
              <ImagePlus size={17} /> Ajoute ton Logo
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const url = await uploadImageFile(file, 'logos')
                if (url) setForm(f => ({ ...f, logo_url: url }))
              }} />
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-black text-white transition hover:bg-emerald-700">
              <Upload size={17} /> Ajoute ta Bannière
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const url = await uploadImageFile(file, 'banners')
                if (url) setForm(f => ({ ...f, banner_url: url }))
              }} />
            </label>
          </div>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-50"><Save size={20}/>{saving ? 'Sauvegarde...' : 'Sauvegarder la boutique'}</button>
        </div></form>
      </div>
    </AppShell>
  )
}
