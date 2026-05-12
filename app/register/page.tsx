'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const [businessName, setBusinessName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          business_name: businessName,
          role: 'owner'
        }
      }
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Compte créé. Vérifiez votre email si Supabase demande une confirmation.')
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">C</div>
          <h1 className="text-3xl font-black text-slate-950">Créer votre boutique</h1>
          <p className="mt-2 text-slate-600">Commencez gratuitement avec CaissePro.</p>
        </div>

        <form onSubmit={handleRegister} className="grid gap-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Nom de la boutique</label>
            <input
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
              placeholder="Ex: Boutique Démo Dakar"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">Votre nom</label>
              <input
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Téléphone</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                placeholder="78 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && (
            <div className="rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-brand-700">
              {message}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Vous avez déjà un compte?{' '}
          <Link href="/login" className="font-black text-brand-700">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
