'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getAdminContext } from '@/lib/superAdmin'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
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
      if (authError) {
        throw new Error(
          authError.message.toLowerCase().includes('invalid login')
            ? 'Email ou mot de passe incorrect.'
            : authError.message
        )
      }
      if (!data.user) throw new Error('Connexion impossible.')

      // Founders + active admin_users rows resolve to allowed.
      const ctx = await getAdminContext()
      if (!ctx?.allowed) {
        await supabase.auth.signOut()
        setError('Accès réservé aux administrateurs')
        setLoading(false)
        return
      }

      router.push('/super-admin')
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      {/* Background orbs — purple / blue admin palette */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-56 w-56 rounded-full bg-blue-700/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-600/40">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-300 backdrop-blur-sm">
            <Lock size={12} /> Accès restreint
          </div>
          <h1 className="text-3xl font-black text-white">Espace Administration CaissePro</h1>
          <p className="mt-2 font-semibold text-white/50">
            Connexion réservée à l&apos;équipe administrative
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-black text-white/70">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@caissepro.app"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 font-semibold text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:border-indigo-400/60 focus:bg-white/15"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-white/70">Mot de passe</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-black text-indigo-300 transition-colors hover:text-indigo-200"
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
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 font-semibold text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:border-indigo-400/60 focus:bg-white/15"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-4 font-black text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-400 hover:to-violet-500 disabled:opacity-60"
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

          <p className="mt-6 text-center text-xs font-semibold text-white/40">
            Vous êtes commerçant ?{' '}
            <Link href="/login" className="font-black text-white/70 hover:text-white">
              Connexion commerçant
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs font-black uppercase tracking-[0.25em] text-white/30">
          Propulsé par AMDY LABS
        </p>
      </div>
    </main>
  )
}
