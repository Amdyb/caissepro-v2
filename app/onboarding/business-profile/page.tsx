'use client'

import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowRight, ImagePlus, MapPin, Phone, Store, Upload } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BusinessProfilePage() {
  const router = useRouter()
  const params = useSearchParams()
  const type = params.get('type') || 'retail'

  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    logo_url: '',
    banner_url: ''
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
        .select('business_id, businesses(*)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      const member: any = membership

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
        onboarding_completed: true
      })
      .eq('id', businessId)

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    router.push('/dashboard')
  }

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement...</p></main>
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
            <Store size={34} />
          </div>

          <h1 className="text-5xl font-black tracking-tight">Configurez votre business</h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Ajoutez votre identité visuelle et vos informations pour générer automatiquement votre espace CaissePro.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Nom du business</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Dakar Vapes"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16}/>Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="78 458 1111"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16}/>WhatsApp</label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="77 000 0000"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><MapPin size={16}/>Adresse</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Dakar, Sénégal"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Upload size={16}/>Logo URL</label>
                <input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><ImagePlus size={16}/>Banner URL</label>
                <input
                  value={form.banner_url}
                  onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-slate-100">
              <div className="relative h-56 overflow-hidden bg-slate-200">
                {form.banner_url ? (
                  <img src={form.banner_url} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-950 text-white">
                    <ImagePlus size={42} />
                  </div>
                )}

                <div className="absolute bottom-5 left-5 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
                    {form.logo_url ? (
                      <img src={form.logo_url} className="h-full w-full object-contain p-2" />
                    ) : (
                      <Store className="text-emerald-600" size={32} />
                    )}
                  </div>

                  <div className="text-white drop-shadow">
                    <h2 className="text-3xl font-black">{form.name || 'Votre business'}</h2>
                    <p className="font-bold uppercase tracking-wide text-emerald-200">{type}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-500">Téléphone</span>
                  <span className="font-black">{form.phone || '—'}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-500">WhatsApp</span>
                  <span className="font-black">{form.whatsapp || '—'}</span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 font-bold text-slate-500">Adresse</p>
                  <p className="font-black">{form.address || 'Adresse non renseignée'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={saveBusiness}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon espace'}
              {!loading && <ArrowRight size={20} />}
            </button>

            <p className="mt-4 text-center text-sm font-semibold text-slate-500">
              Votre template sera automatiquement adapté à votre activité.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
