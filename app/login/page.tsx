'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getNextRoute } from '@/lib/getNextRoute'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage(error.message)
      setGoogleLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const nextRoute = data.user
      ? await getNextRoute(data.user.id, data.user.email || '')
      : '/onboarding'
    router.push(nextRoute)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">C</div>
          <h1 className="text-3xl font-black text-slate-950">Connexion</h1>
          <p className="mt-2 text-slate-600">Accédez à votre espace CaissePro.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input type="email" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">Mot de passe</label>
              <Link href="/forgot-password" className="text-xs font-black text-brand-700 hover:underline">Mot de passe oublié ?</Link>
            </div>
            <input type="password" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {message && <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</div>}

          <button disabled={loading} className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400">OU</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.4 14 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.2-9.9 6.2-16.9z"/>
            <path fill="#FBBC05" d="M10.7 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23.9 23.9 0 0 0 .5 24c0 3.9.9 7.5 2.7 10.7l7.5-6.1z"/>
            <path fill="#34A853" d="M24 46.5c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2-6.3 2-6.3 0-11.6-4.2-13.3-10l-7.5 6.1C7 42 15 46.5 24 46.5z"/>
          </svg>
          {googleLoading ? 'Redirection...' : 'Continuer avec Google'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">Pas encore de compte ? <Link href="/register" className="font-black text-brand-700">Créer un compte</Link></p>
        <p className="mt-2 text-center text-sm text-slate-500">Employé avec un code temporaire ? <Link href="/employee-setup" className="font-black text-emerald-700">Activer mon compte</Link></p>
        <p className="mt-4 text-center text-xs text-slate-400">
          <Link href="/help" className="hover:text-slate-600">Aide</Link>
          {' · '}
          <Link href="/legal" className="hover:text-slate-600">Mentions légales</Link>
        </p>
      </div>
    </main>
  )
}
