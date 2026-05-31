'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getNextRoute } from '@/lib/getNextRoute'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (searchParams.get('error') === 'deactivated') {
      setMessage('Votre compte a été désactivé. Contactez votre administrateur.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(
        error.message.toLowerCase().includes('invalid login')
          ? 'Email ou mot de passe incorrect.'
          : error.message
      )
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: membership } = await supabase
        .from('business_members')
        .select('is_active')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (membership?.is_active === false) {
        await supabase.auth.signOut()
        setMessage('Votre compte a été désactivé. Contactez votre administrateur.')
        setLoading(false)
        return
      }
    }

    const nextRoute = data.user
      ? await getNextRoute(data.user.id, data.user.email || '')
      : '/onboarding'
    router.push(nextRoute)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) {
      setMessage(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      {/* Background orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-48 w-48 rounded-full bg-slate-700/30 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo area */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/caissepro-logo.png"
              alt="CaissePro"
              width={120}
              height={40}
              className="mx-auto mb-5 h-10 w-auto brightness-0 invert"
              priority
            />
          </Link>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-1.5 text-xs font-black text-emerald-300 backdrop-blur-sm">
            Espace commerçant
          </div>
          <h1 className="text-3xl font-black text-white">Connexion</h1>
          <p className="mt-2 font-semibold text-white/50">Accédez à votre espace CaissePro.</p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-[2rem] p-8 shadow-2xl glow-emerald">
          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-60"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            {googleLoading ? 'Redirection...' : 'Continuer avec Google'}
          </button>

          <div className="relative mb-5 flex items-center gap-3">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs font-black text-white/30">OU</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-black text-white/70">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 font-semibold text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:border-emerald-400/60 focus:bg-white/15"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-white/70">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs font-black text-white/50 transition-colors hover:text-white">
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
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 font-semibold text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:border-emerald-400/60 focus:bg-white/15"
              />
            </div>

            {message && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-500 py-4 font-black text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:opacity-60"
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

          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm font-semibold text-white/50">
              Pas encore de compte ?{' '}
              <Link href="/register" className="font-black text-emerald-400 hover:text-emerald-300 transition-colors">
                Créer un compte
              </Link>
            </p>
            <p className="text-sm font-semibold text-white/40">
              Employé avec un code temporaire ?{' '}
              <Link href="/employee-setup" className="font-black text-emerald-400 hover:text-emerald-300 transition-colors">
                Activer mon compte
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-white/30">
          <Link href="/help" className="hover:text-white/60 transition-colors">Aide</Link>
          {' · '}
          <Link href="/legal" className="hover:text-white/60 transition-colors">Mentions légales</Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
