'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
        router.replace('/upgrade')
        return
      }

      setChecking(false)
    }

    checkExistingMerchant()
  }, [router])

  async function createBusinessAndMembership(userId: string) {
    const { data: existingMembership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (existingMembership) return

    const safeSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `shop-${Date.now()}`

    const { data: businessRows, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        slug: safeSlug,
        currency: 'CFA',
        business_type: 'retail',
        onboarding_completed: false
      })
      .select('id')
      .limit(1)

    const business = businessRows?.[0]
    if (businessError || !business) throw new Error(businessError?.message || 'Impossible de créer le commerce.')

    const { error: memberError } = await supabase
      .from('business_members')
      .insert({ business_id: business.id, user_id: userId, full_name: fullName, email, role: 'admin' })

    if (memberError) throw new Error(memberError.message)
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

      if (!user) throw new Error('Compte créé mais connexion impossible.')

      await createBusinessAndMembership(user.id)
      router.push('/onboarding')
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">C</div>
          <h1 className="text-3xl font-black text-slate-950">Créer un compte</h1>
          <p className="mt-2 text-slate-600">Lancez votre boutique CaissePro en 1 minute.</p>
        </div>

        {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Nom complet</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Amadou Diallo"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Nom du commerce</label>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Dakar Vapes"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Déjà un compte ? <Link href="/login" className="font-black text-brand-700">Se connecter</Link>
        </p>
        <p className="mt-4 text-center text-xs text-slate-400">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/legal" className="font-bold underline hover:text-slate-700">mentions légales</Link>.
        </p>
      </div>
    </main>
  )
}
