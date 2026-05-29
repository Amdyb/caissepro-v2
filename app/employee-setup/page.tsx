'use client'

import { supabase } from '@/lib/supabaseClient'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'password'>('verify')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [memberId, setMemberId] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  function showError(msg: string) { setMessage(msg); setIsError(true) }
  function showSuccess(msg: string) { setMessage(msg); setIsError(false) }

  async function verifyTempPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanTemp = tempPassword.trim()

    const { data: member, error } = await supabase
      .from('business_members')
      .select('id, user_id')
      .eq('email', cleanEmail)
      .eq('temp_password', cleanTemp)
      .maybeSingle()

    if (error || !member) {
      showError("Email ou mot de passe temporaire incorrect. Vérifiez vos identifiants.")
      setLoading(false)
      return
    }

    if (member.user_id) {
      showError("Ce compte est déjà activé. Connectez-vous normalement.")
      setLoading(false)
      return
    }

    setMemberId(member.id)
    setStep('password')
    setLoading(false)
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas.")
      return
    }
    if (newPassword.length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: newPassword
    })

    if (signUpError) {
      showError(signUpError.message)
      setLoading(false)
      return
    }

    const newUserId = signUpData.user?.id
    if (!newUserId) {
      showError("Erreur lors de la création du compte. Réessayez.")
      setLoading(false)
      return
    }

    // Link auth user to business_members immediately — before email confirmation check
    const { error: memberError } = await supabase
      .from('business_members')
      .update({ user_id: newUserId, temp_password: null, must_change_password: false })
      .eq('id', memberId)

    if (memberError) {
      showError("Compte créé mais erreur de liaison à la boutique. Contactez votre administrateur.")
      setLoading(false)
      return
    }

    if (!signUpData.session) {
      // Email confirmation required — try to sign in anyway (works if confirmation is disabled)
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: newPassword
      })

      if (loginError) {
        showSuccess("Compte activé. Vérifiez vos emails pour confirmer votre inscription, puis connectez-vous.")
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <KeyRound size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Activation du compte</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {step === 'verify'
              ? "Entrez votre email et le mot de passe temporaire fourni par votre administrateur."
              : "Choisissez votre mot de passe personnel pour sécuriser votre compte."}
          </p>
        </div>

        {message && (
          <div className={`mb-6 rounded-2xl p-4 text-sm font-bold ${isError ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        {step === 'verify' ? (
          <form onSubmit={verifyTempPassword} className="space-y-4">
            <div>
              <label className="text-sm font-black text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none focus:border-emerald-500"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-black text-slate-700">Mot de passe temporaire</label>
              <input
                type="text"
                required
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 font-mono font-bold tracking-widest outline-none focus:border-emerald-500"
                placeholder="Fourni par votre administrateur"
              />
            </div>
            <button disabled={loading} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white disabled:opacity-60">
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
            <p className="text-center text-sm font-semibold text-slate-500">
              Compte déjà activé ?{' '}
              <Link href="/login" className="font-black text-emerald-700">Se connecter</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={createAccount} className="space-y-4">
            <div>
              <label className="text-sm font-black text-slate-700">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none focus:border-emerald-500"
                placeholder="Minimum 6 caractères"
              />
            </div>
            <div>
              <label className="text-sm font-black text-slate-700">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
            <button disabled={loading} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white disabled:opacity-60">
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
