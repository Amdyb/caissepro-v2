'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

export default function AgentLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error(authError.message)

      const userEmail = data.user?.email
      if (!userEmail) throw new Error('Connexion impossible.')

      // Verify agent record exists
      const { data: agent } = await supabase
        .from('agents')
        .select('id, status, must_change_password')
        .eq('email', userEmail)
        .maybeSingle()

      if (!agent) {
        await supabase.auth.signOut()
        setError("Compte agent introuvable. Vous pouvez postuler sur /agents.")
        setLoading(false)
        return
      }

      if (agent.status === 'pending') {
        await supabase.auth.signOut()
        setError('Votre candidature est en cours de validation. Vous serez contacté sous 24h via WhatsApp.')
        setLoading(false)
        return
      }

      if (agent.status === 'suspended') {
        await supabase.auth.signOut()
        setError('Votre compte agent est suspendu. Contactez le support.')
        setLoading(false)
        return
      }

      // Force a password change on first login if flagged.
      if (agent.must_change_password) {
        router.push('/change-password')
        return
      }

      router.push('/agents/dashboard')
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 py-12">
      <div className="w-full max-w-md">

        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <Link href="/">
            <Image
              src="/caissepro-logo.png"
              alt="CaissePro"
              width={140}
              height={44}
              className="mx-auto mb-5 h-11 w-auto"
              priority
            />
          </Link>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
            Espace Agent
          </div>
          <h1 className="text-3xl font-black text-slate-950">Connexion agent</h1>
          <p className="mt-2 font-semibold text-slate-500">Accédez à votre tableau de bord.</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-black text-slate-700">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-700">Mot de passe</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500">
            Pas encore agent ?{' '}
            <Link href="/agents" className="font-black text-emerald-700 hover:underline">
              Postuler
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-slate-400">
          <Link href="/" className="hover:text-slate-600">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </main>
  )
}
