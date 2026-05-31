'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Loader2 } from 'lucide-react'

function ActivateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [agentName, setAgentName] = useState('')

  useEffect(() => {
    async function checkSession() {
      // Supabase puts the access_token in the hash on magic link / invite flows
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Lien d\'activation invalide ou expiré. Contactez votre administrateur.')
        setChecking(false)
        return
      }

      const email = userData.user.email
      const { data: agent } = await supabase
        .from('agents')
        .select('full_name, status')
        .eq('email', email)
        .maybeSingle()

      if (!agent) {
        setError('Aucun compte agent trouvé pour cet email.')
        setChecking(false)
        return
      }

      setAgentName(agent.full_name)
      setChecking(false)
    }
    checkSession()
  }, [])

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw new Error(updateError.message)

      // Mark agent as active
      const { data: userData } = await supabase.auth.getUser()
      await supabase
        .from('agents')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('email', userData.user?.email)

      setDone(true)
      setTimeout(() => router.push('/agents/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'activation.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Vérification du lien...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <Image src="/caissepro-logo.png" alt="CaissePro" width={120} height={40} className="mx-auto mb-4 h-10 w-auto" priority />
          </Link>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm">
            Activation du compte
          </div>
          {agentName && (
            <h1 className="text-3xl font-black text-slate-950">Bienvenue, {agentName.split(' ')[0]} !</h1>
          )}
          <p className="mt-2 font-semibold text-slate-500">Définissez votre mot de passe pour accéder à votre espace agent.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {done ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-950">Compte activé !</h2>
              <p className="mt-3 text-sm font-semibold text-slate-500">Redirection vers votre tableau de bord...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
              )}
              {!error && (
                <form onSubmit={handleActivate} className="space-y-4">
                  <div>
                    <label className="text-sm font-black text-slate-700">Nouveau mot de passe</label>
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
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" /> Activation...
                      </span>
                    ) : 'Activer mon compte'}
                  </button>
                </form>
              )}
              {error && (
                <div className="mt-4 text-center">
                  <Link href="/agents" className="text-sm font-black text-emerald-700 hover:underline">
                    Soumettre une nouvelle candidature →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function AgentRegisterPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500">Chargement...</p>
      </main>
    }>
      <ActivateForm />
    </Suspense>
  )
}
