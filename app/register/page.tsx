'use client'

import { useState } from 'react'
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
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function createBusinessAndMembership(userId: string) {
    const { data: existingMembership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (existingMembership) return

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        plan: 'free',
        currency: 'CFA',
      })
      .select('id')
      .single()

    if (businessError || !business) {
      throw new Error(
        businessError?.message || 'Impossible de créer le commerce.'
      )
    }

    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        full_name: fullName,
        email,
        role: 'admin',
      })

    if (memberError) {
      throw new Error(memberError.message)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              business_name: businessName,
            },
          },
        })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      let user = signUpData.user

      // If no session returned, login immediately
      if (!signUpData.session) {
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (loginError) {
          throw new Error(loginError.message)
        }

        user = loginData.user
      }

      if (!user) {
        throw new Error(
          'Compte créé mais connexion impossible.'
        )
      }

      await createBusinessAndMembership(user.id)

      setMessage('Compte créé avec succès.')

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur pendant la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          CaissePro
        </h1>

        <p className="text-center text-zinc-400 mb-6">
          Créez votre compte commerce
        </p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-500/10 border border-green-500 text-green-300 p-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">

          <input
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
            placeholder="Nom du commerce"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
            placeholder="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold p-3 rounded-lg disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Créer un compte'}
          </button>

        </form>
      </div>
    </main>
  )
}
