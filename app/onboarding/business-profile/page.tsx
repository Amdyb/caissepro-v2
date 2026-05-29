'use client'

import { seedDemoBusiness } from '@/lib/seedDemoBusiness'
import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, ImagePlus, MapPin, Phone, Store, Upload } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function BusinessProfileContent() {
  const router = useRouter()
  const params = useSearchParams()
  const type = params.get('type') || 'retail'

  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', address: '', logo_url: '', banner_url: '' })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(*)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership

      // Only owners/admins can access the business setup wizard
      if (member?.business_id && !['owner', 'admin'].includes(member?.role)) {
        router.push('/dashboard')
        return
      }

      if (member?.business_id) {
        setBusinessId(member.business_id)
        if (member.businesses) {
          setForm({
            name: member.businesses.name || '',
            phone: member.businesses.phone || '',
            whatsapp: member.businesses.whatsapp || '',
            address: member.businesses.address || '',
            logo_url: member.businesses.logo_url || '',
            banner_url: member.businesses.banner_url || ''
          })
        }
      }
      setChecking(false)
    }
    init()
  }, [router])

  async function saveBusiness() {
    if (!businessId) {
      setMessage('Business introuvable.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        business_type: type,
        onboarding_completed: true,
        demo_seeded: true
      })
      .eq('id', businessId)

    if (error) {
      setLoading(false)
      setMessage(error.message)
      return
    }

    await seedDemoBusiness(businessId, type)

    setLoading(false)
    router.push('/dashboard')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { upsert: false })
    if (error) { setMessage(error.message); return }
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    setForm(f => ({ ...f, logo_url: data.publicUrl }))
  }

  async function handleBanniereUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { upsert: false })
    if (error) { setMessage(error.message); return }
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    setForm(f => ({ ...f, banner_url: data.publicUrl }))
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"><Store size={34} /></div>
          <h1 className="text-5xl font-black tracking-tight">Configurez votre business</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-slate-600">Ajoutez votre identité visuelle et vos informations pour générer automatiquement votre espace CaissePro.</p>
        </div>

        {message && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Nom du business</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Dakar Vapes" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16}/>Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="78 458 1111" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white" /></div>
                <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16}/>WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="77 000 0000" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white" /></div>
              </div>

              <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><MapPin size={16}/>Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dakar, Sénégal" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white" /></div>

              <div className="flex flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => (document.getElementById('logo-upload-onboarding') as HTMLInputElement)?.click()}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl"
                >
                  <ImagePlus size={17} /> Ajoute ton Logo
                </button>
                <input id="logo-upload-onboarding" type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e)} />

                <button
                  type="button"
                  onClick={() => (document.getElementById('banniere-upload-onboarding') as HTMLInputElement)?.click()}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl"
                >
                  <Upload size={17} /> Ajoute ta Bannière
                </button>
                <input id="banniere-upload-onboarding" type="file" accept="image/*" className="hidden" onChange={(e) => handleBanniereUpload(e)} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-bold text-emerald-800">Après création, CaissePro va charger un écosystème demo adapté à votre type de business pour que le dashboard soit vivant immédiatement.</div>
            <button onClick={saveBusiness} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Création + génération demo...' : 'Créer mon espace'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function BusinessProfilePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>}>
      <BusinessProfileContent />
    </Suspense>
  )
}
