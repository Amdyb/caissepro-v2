'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'


const BUSINESS_TYPES = [
  { value: 'retail', label: 'Commerce & Boutique' },
  { value: 'grocery', label: 'Épicerie & Alimentation' },
  { value: 'restaurant', label: 'Restaurant & Fast Food' },
  { value: 'beauty', label: 'Salon & Beauté' },
  { value: 'fashion', label: 'Mode & Accessoires' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'services', label: 'Services' },
  { value: 'laundry', label: 'Blanchisserie & Pressing' },
  { value: 'tontine', label: 'Tontine & Épargne' },
]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('retail')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkExistingMerchant() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) { setChecking(false); return }

      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)

      if (memberships && memberships.length > 0) {
        router.replace('/dashboard')
        return
      }

      setChecking(false)
    }

    checkExistingMerchant()
  }, [router])

  async function createBusinessAndMembership(userId: string): Promise<string | null> {
    const { data: existingMembership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (existingMembership) return null

    const safeSlug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `shop-${Date.now()}`

    const { data: businessRows, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        slug: safeSlug,
        currency: 'CFA',
        business_type: businessType,
        business_phone: phone || null,
        phone: phone || null,
        onboarding_completed: false
      })
      .select('id')
      .limit(1)

    const business = businessRows?.[0]
    if (businessError || !business) throw new Error(businessError?.message || 'Impossible de creer le commerce.')

    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        full_name: fullName,
        email,
        role: 'owner',
        is_active: true,
        must_change_password: false
      })

    if (memberError) throw new Error(memberError.message)

    return business.id
  }

  async function handleGoogleRegister() {
    setGoogleLoading(true)
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }

    setLoading(true)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, business_name: businessName } }
      })

      if (signUpError) throw new Error(signUpError.message)

      let user = signUpData.user

      if (!signUpData.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw new Error(loginError.message)
        user = loginData.user
      }

      if (!user) throw new Error('Compte cree mais connexion impossible.')

      const newBusinessId = await createBusinessAndMembership(user.id)

      const ref = searchParams.get('ref')
      if (ref && newBusinessId) {
        const { data: referrer } = await supabase.from('businesses').select('id').eq('slug', ref).maybeSingle()
        if (referrer) {
          await supabase.from('referrals').insert({
            referrer_business_id: referrer.id,
            referred_business_id: newBusinessId,
            status: 'pending'
          })
        }
      }

      router.push('/welcome')
    } catch (err: any) {
      setError(err.message || 'Erreur pendant la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Vérification...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image src="/caissepro-logo.png" alt="CaissePro" width={120} height={40} className="mx-auto mb-4 h-10 w-auto" priority />
          <h1 className="text-3xl font-black text-slate-950">Créer votre boutique</h1>
          <p className="mt-2 font-semibold text-slate-500">Lancez votre commerce en 2 minutes.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
          {message && <div className="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            {googleLoading ? 'Redirection...' : 'Continuer avec Google'}
          </button>

          <div className="relative mb-4 flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs font-bold text-slate-400">OU</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-black text-slate-700">Votre nom complet</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Amadou Diallo"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">Nom du commerce</label>
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Dakar Vapes"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">Type de commerce</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221 77 000 00 00"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Création en cours...' : 'Créer mon commerce'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-black text-emerald-700 hover:underline">Se connecter</Link>
          </p>
          <p className="mt-3 text-center text-xs text-slate-400">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/legal" className="font-bold underline hover:text-slate-700">mentions légales</Link>.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Chargement...</p>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  )
}
