'use client'

import { supabase } from '@/lib/supabaseClient'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      setIsError(true)
      return
    }

    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <KeyRound size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Mot de passe oublié</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Lien envoyé ! Vérifiez votre boîte mail et suivez les instructions.
            </div>
            <Link
              href="/login"
              className="block w-full rounded-2xl border border-slate-200 py-4 text-center font-black text-slate-700 hover:bg-slate-50"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`rounded-2xl p-3 text-sm font-semibold ${isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {message}
              </div>
            )}

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

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="font-black text-brand-700">Retour à la connexion</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
