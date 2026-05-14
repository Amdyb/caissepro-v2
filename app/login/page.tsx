'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function getNextRoute(userId: string) {
    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id, businesses(onboarding_completed, name, business_type)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    const member: any = membership
    const business = member?.businesses

    if (!member?.business_id || !business?.onboarding_completed || !business?.name || !business?.business_type) {
      return '/onboarding'
    }

    return '/dashboard'
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

    const nextRoute = data.user ? await getNextRoute(data.user.id) : '/onboarding'
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
            <label className="text-sm font-bold text-slate-700">Mot de passe</label>
            <input type="password" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {message && <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</div>}

          <button disabled={loading} className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">Pas encore de compte? <Link href="/register" className="font-black text-brand-700">Créer un compte</Link></p>
      </div>
    </main>
  )
}
