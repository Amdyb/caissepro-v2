'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Un code de vérification a été envoyé à votre email.')
    setStep('verify')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()

    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    setLoading(false)

    if (error) {
      setError('Code invalide ou expiré.')
      return
    }

    router.push('/dashboard')
  }

  async function resendCode() {
    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Nouveau code envoyé.')
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2">
          CaissePro
        </h1>

        <p className="text-center text-zinc-400 mb-6">
          {step === 'register'
            ? 'Créez votre compte commerce'
            : 'Vérifiez votre email'}
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

        {step === 'register' ? (
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
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold p-3 rounded-lg"
            >
              {loading ? 'Création...' : 'Créer un compte'}
            </button>

          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">

            <input
              className="w-full p-4 rounded-lg bg-zinc-800 border border-zinc-700 text-center text-2xl tracking-widest"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />

            <button
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold p-3 rounded-lg"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="w-full text-green-400 text-sm"
            >
              Renvoyer le code
            </button>

          </form>
        )}
      </div>
    </main>
  )
}
