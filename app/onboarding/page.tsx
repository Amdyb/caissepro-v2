'use client'

import { generateUniqueSlug } from '@/lib/generateUniqueSlug'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, ArrowRight, Briefcase, Check, Package, Palette, PiggyBank, Scissors, Shirt, ShoppingBasket, Store, Tv, Utensils } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Commerce & Boutique', icon: Store, color: '#16a34a' },
  { value: 'restaurant', label: 'Restaurant & Fast Food', icon: Utensils, color: '#ea580c' },
  { value: 'beauty', label: 'Salon & Beauté', icon: Scissors, color: '#db2777' },
  { value: 'tontine', label: 'Tontine & Épargne', icon: PiggyBank, color: '#7c3aed' },
  { value: 'services', label: 'Services', icon: Briefcase, color: '#0891b2' },
  { value: 'grocery', label: 'Épicerie & Alimentation', icon: ShoppingBasket, color: '#65a30d' },
  { value: 'electronics', label: 'Électronique', icon: Tv, color: '#1d4ed8' },
  { value: 'fashion', label: 'Mode & Accessoires', icon: Shirt, color: '#9333ea' },
]

const PRESET_COLORS = [
  '#16a34a', '#0891b2', '#7c3aed', '#db2777',
  '#ea580c', '#1d4ed8', '#65a30d', '#9333ea',
]

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [businessType, setBusinessType] = useState('retail')
  const [businessName, setBusinessName] = useState('')
  const [product, setProduct] = useState({ name: '', price: '', stock: '' })
  const [primaryColor, setPrimaryColor] = useState('#16a34a')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      setUserId(userData.user.id)

      // Step 1: get memberships without nested join to avoid RLS recursion
      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', userData.user.id)

      const sorted = (memberships || []).sort((a: any, b: any) => {
        const p: Record<string, number> = { owner: 0, admin: 1 }
        return (p[a.role] ?? 2) - (p[b.role] ?? 2)
      })

      const member: any = sorted[0]

      if (member?.business_id) {
        const role: string = member.role || ''

        // Staff (sales/cashier/employee/staff) never see the onboarding wizard
        const STAFF_ROLES_CHECK = ['sales', 'staff', 'cashier', 'employee']
        if (STAFF_ROLES_CHECK.includes(role)) {
          router.push('/dashboard')
          return
        }

        // Step 2: get business info separately
        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', member.business_id)
          .maybeSingle()

        // If onboarding is already done, go to dashboard
        if ((biz as any)?.onboarding_completed) {
          router.push('/dashboard')
          return
        }

        // Owner/admin with incomplete onboarding → show the wizard
        setBusinessId(member.business_id)
        setBusinessName((biz as any)?.name || userData.user.user_metadata?.business_name || '')
        setBusinessType((biz as any)?.business_type || 'retail')
        setPrimaryColor((biz as any)?.primary_color || '#16a34a')
      } else {
        setBusinessName(userData.user.user_metadata?.business_name || '')
      }

      setLoading(false)
    }
    init()
  }, [router])

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function finish() {
    setSaving(true)
    setMessage('')
    try {
      let logoUrl: string | null = null

      if (logoFile && businessId) {
        const ext = logoFile.name.split('.').pop()
        const path = `${businessId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage.from('business-assets').upload(path, logoFile, { upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('business-assets').getPublicUrl(path)
          logoUrl = urlData.publicUrl
        }
      }

      const payload: Record<string, any> = {
        name: businessName,
        business_type: businessType,
        primary_color: primaryColor,
        currency: 'CFA',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }
      if (logoUrl) payload.logo_url = logoUrl

      if (businessId) {
        const { error } = await supabase.from('businesses').update(payload).eq('id', businessId)
        if (error) throw error
      } else {
        // Guard: never create a new business if user already has one
        const { data: existingMember } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle()
        if (existingMember?.business_id) { router.push('/dashboard'); return }

        const slug = await generateUniqueSlug(businessName)

        const { data: businesses, error } = await supabase
          .from('businesses')
          .insert({ ...payload, slug })
          .select('id')
          .limit(1)

        if (error || !businesses?.[0]) throw error || new Error('Impossible de créer la boutique.')
        let biz = businesses[0]

        setBusinessId(biz.id)

        const { data: userData } = await supabase.auth.getUser()
        const { error: memberError } = await supabase.from('business_members').insert({
          business_id: biz.id,
          user_id: userId,
          full_name: userData.user?.user_metadata?.full_name || '',
          email: userData.user?.email || '',
          role: 'admin',
        })
        if (memberError) throw memberError

        if (product.name) {
          await supabase.from('products').insert({
            business_id: biz.id,
            name: product.name,
            sell_price: Number(product.price) || 0,
            stock: Number(product.stock) || 0,
          })
        }
      }

      if (product.name && businessId) {
        await supabase.from('products').insert({
          business_id: businessId,
          name: product.name,
          sell_price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
        })
      }

      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      await new Promise((r) => setTimeout(r, 600))
      router.push('/dashboard')
    } catch (err: any) {
      setMessage(err?.message || 'Erreur pendant la configuration.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-pulse rounded-full" style={{ backgroundColor: primaryColor }} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] shadow-xl transition-colors duration-300"
            style={{ backgroundColor: primaryColor }}
          >
            <Store className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Bienvenue sur CaissePro</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Configuration rapide en 3 étapes</p>
        </div>

        {/* Animated progress bar */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(step / 3) * 100}%`, backgroundColor: primaryColor }}
          />
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-all duration-300"
                style={{
                  backgroundColor: s <= step ? primaryColor : '#e2e8f0',
                  color: s <= step ? 'white' : '#94a3b8',
                  transform: s === step ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 3 && (
                <div
                  className="h-0.5 w-8 rounded-full transition-all duration-500"
                  style={{ backgroundColor: s < step ? primaryColor : '#e2e8f0' }}
                />
              )}
            </div>
          ))}
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <div key={step} className="animate-slide-up">
          {/* Step 1 */}
          {step === 1 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-2 text-2xl font-black text-slate-950">Quel type de commerce ?</h2>
              <p className="mb-6 text-sm font-bold text-slate-500">CaissePro adaptera ses outils selon votre activité.</p>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-black text-slate-700">Nom de la boutique</label>
                <input
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none transition-colors focus:border-emerald-500"
                  placeholder="Ex: Baba Tounde Pressing"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon
                  const selected = businessType === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setBusinessType(type.value)
                        if (primaryColor === '#16a34a') setPrimaryColor(type.color)
                      }}
                      className="flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all duration-200 hover:scale-105"
                      style={{
                        borderColor: selected ? type.color : '#e2e8f0',
                        backgroundColor: selected ? type.color + '15' : 'white',
                        boxShadow: selected ? `0 0 0 2px ${type.color}40` : 'none',
                      }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: type.color + '20', color: type.color }}
                      >
                        <Icon size={22} />
                      </div>
                      <span className="text-xs font-black leading-tight text-slate-800">{type.label}</span>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  if (!businessName.trim()) { setMessage('Entrez le nom de votre boutique.'); return }
                  setMessage('')
                  setStep(2)
                }}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: primaryColor }}
              >
                Continuer <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-2 text-2xl font-black text-slate-950">Ajoutez votre premier produit</h2>
              <p className="mb-6 text-sm font-bold text-slate-500">Optionnel — vous pouvez ajouter des produits plus tard.</p>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Nom du produit</label>
                  <input
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none transition-colors focus:border-emerald-500"
                    placeholder="Ex: T-shirt premium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Prix (CFA)</label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => setProduct({ ...product, price: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none transition-colors focus:border-emerald-500"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Stock</label>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => setProduct({ ...product, stock: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none transition-colors focus:border-emerald-500"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-6 py-4 text-sm font-black text-slate-700 transition-all hover:scale-[1.02] hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  onClick={() => { setMessage(''); setStep(3) }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {product.name ? 'Continuer' : 'Passer'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-2 text-2xl font-black text-slate-950">Personnalisez votre boutique</h2>
              <p className="mb-6 text-sm font-bold text-slate-500">Optionnel — modifiable à tout moment dans les paramètres.</p>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-black text-slate-700">Logo</label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                <button
                  onClick={() => logoRef.current?.click()}
                  className="flex h-28 w-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-all hover:scale-105 hover:border-emerald-400"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <Store size={28} />
                      <span className="text-xs font-black">Logo</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="mb-3 block text-sm font-black text-slate-700">Couleur principale</label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className="h-10 w-10 rounded-full border-4 transition-all duration-200 hover:scale-110"
                      style={{ backgroundColor: color, borderColor: primaryColor === color ? '#0f172a' : 'transparent' }}
                    />
                  ))}
                  <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 transition hover:border-slate-400">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="hidden" />
                    <Palette size={16} className="text-slate-400" />
                  </label>
                </div>
                <div
                  className="mt-4 flex items-center gap-3 rounded-2xl p-4 transition-colors"
                  style={{ backgroundColor: primaryColor + '15' }}
                >
                  <div className="h-8 w-8 rounded-xl" style={{ backgroundColor: primaryColor }} />
                  <span className="text-sm font-black" style={{ color: primaryColor }}>{primaryColor}</span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-6 py-4 text-sm font-black text-slate-700 transition-all hover:scale-[1.02] hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  onClick={finish}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl disabled:opacity-60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? 'Configuration...' : <><Check size={18} /> Terminer</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
