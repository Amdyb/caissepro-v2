'use client'

import { supabase } from '@/lib/supabaseClient'
import { BriefcaseBusiness, CheckCircle, MapPin, Phone, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', business_type: 'retail', phone: '', address: '', slogan: '', primary_color: '#16a34a' })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      setUserId(userData.user.id)

      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id, businesses(*)')
        .eq('user_id', userData.user.id)
        .limit(1)

      const member: any = memberships?.[0]
      if (member?.business_id) {
        setBusinessId(member.business_id)
        const business = member.businesses || {}
        setForm({
          name: business.name || userData.user.user_metadata?.business_name || '',
          business_type: business.business_type || 'retail',
          phone: business.phone || business.business_phone || '',
          address: business.address || business.business_address || '',
          slogan: business.slogan || '',
          primary_color: business.primary_color || '#16a34a'
        })
      } else {
        setForm((prev) => ({ ...prev, name: userData.user.user_metadata?.business_name || '' }))
      }

      setLoading(false)
    }

    init()
  }, [router])

  async function completeSetup(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const payload = {
        name: form.name,
        slug: slugify(form.name) || `business-${Date.now()}`,
        business_type: form.business_type,
        phone: form.phone,
        business_phone: form.phone,
        address: form.address,
        business_address: form.address,
        slogan: form.slogan,
        primary_color: form.primary_color,
        currency: 'CFA',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      }

      if (businessId) {
        const { error } = await supabase.from('businesses').update(payload).eq('id', businessId)
        if (error) throw error
      } else {
        const { data: businesses, error } = await supabase.from('businesses').insert(payload).select('id').limit(1)
        const business = businesses?.[0]
        if (error || !business) throw error || new Error('Impossible de créer la boutique.')

        const { data: userData } = await supabase.auth.getUser()
        const { error: memberError } = await supabase.from('business_members').insert({
          business_id: business.id,
          user_id: userId,
          full_name: userData.user?.user_metadata?.full_name || '',
          email: userData.user?.email || '',
          role: 'admin'
        })
        if (memberError) throw memberError
      }

      router.push('/dashboard')
    } catch (error: any) {
      const text = error?.message || 'Erreur pendant la configuration.'
      setMessage(text.includes('onboarding_completed') ? 'La colonne onboarding_completed manque dans Supabase. Exécutez le script onboarding_templates.sql.' : text)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement setup...</p></main>

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300"><CheckCircle size={15}/> Première configuration</div>
          <h1 className="text-5xl font-black tracking-tight">Configurez votre boutique</h1>
          <p className="mt-4 text-lg font-semibold text-white/70">Choisissez votre type d’activité. CaissePro adaptera le menu, le dashboard et les outils automatiquement.</p>
        </div>

        {message && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

        <form onSubmit={completeSetup} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-5">
            <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Store size={16}/>Nom de la boutique</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" placeholder="Ex: Baba Tounde Pressing" /></div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><BriefcaseBusiness size={16}/>Type de business</label><select value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none focus:border-emerald-500">{businessTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16}/>Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" placeholder="78 458 1111" /></div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><MapPin size={16}/>Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" placeholder="Dakar, Sénégal" /></div>
            <div><label className="mb-2 block text-sm font-black text-slate-700">Slogan</label><input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" placeholder="Votre commerce, plus simple" /></div>
            <button disabled={saving} className="rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-60">{saving ? 'Configuration...' : 'Terminer la configuration'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}
