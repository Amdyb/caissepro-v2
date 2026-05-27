'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Image src="/caissepro-logo.png" alt="CaissePro" width={120} height={40} className="mx-auto mb-4 h-10 w-auto" priority />
          <h1 className="text-3xl font-black text-slate-950">Connexion</h1>
          <p className="mt-2 text-slate-600">Accédez à votre espace CaissePro.</p>
        </div>

        <button
          onClick={handleGoogleLogin}
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
