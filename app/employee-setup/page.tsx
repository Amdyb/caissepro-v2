'use client'

import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'password' | 'success'>('verify')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  // Data fetched from DB during verify step
  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberFullName, setMemberFullName] = useState('')

  function showError(msg: string) { setMessage(msg); setIsError(true) }
  function showSuccess(msg: string) { setMessage(msg); setIsError(false) }

  async function verifyTempPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanTemp = tempPassword.trim()

    // Query by temp_password + is_active to get full member record
    const { data: member, error } = await supabase
      .from('business_members')
      .select('id, user_id, email, full_name, business_id')
      .eq('temp_password', cleanTemp)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !member) {
      showError("Email ou mot de passe temporaire incorrect. Vérifiez vos identifiants.")
      setLoading(false)
      return
    }

    // Verify email matches (security check)
    if (member.email?.toLowerCase() !== cleanEmail) {
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
    setMemberEmail(member.email || cleanEmail)
    setMemberFullName(member.full_name || '')
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

    // signUp with the email from DB (canonical, not user-typed)
    // The handle_new_user trigger will:
    //   1. Create the profiles row (satisfies business_members.user_id FK)
    //   2. Detect this is an employee activation and link user_id automatically
    //   3. Skip creating a new business
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: memberEmail,
      password: newPassword,
      options: {
        data: { full_name: memberFullName }
      }
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

    // Verify the trigger linked the record correctly
    const { data: linked } = await supabase
      .from('business_members')
      .select('id')
      .eq('id', memberId)
      .eq('user_id', newUserId)
      .maybeSingle()

    if (!linked) {
      // Trigger may not have fired — retry manual update up to 3 times
      let success = false
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 600))
        const { error: updateError } = await supabase
          .from('business_members')
          .update({ user_id: newUserId, temp_password: null, must_change_password: false })
          .eq('id', memberId)
        if (!updateError) { success = true; break }
      }
      // Even if retries fail, getNextRoute has an email-based fallback on next login
      if (!success) {
        console.warn('[employee-setup] Could not link user_id — will be repaired on first login')
      }
    }

    // Sign in if no session yet (email confirmation may be required)
    if (!signUpData.session) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: memberEmail,
        password: newPassword
      })

      if (loginError) {
        showSuccess("Compte activé. Vérifiez vos emails pour confirmer, puis connectez-vous.")
        setLoading(false)
        return
      }
    }

    setStep('success')
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">

        {step === 'success' ? (
          <div className="flex flex-col items-center gap-5 text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-950">Compte activé !</h1>
            <p className="text-sm font-semibold text-slate-500">
              Votre compte est prêt. Redirection vers le tableau de bord...
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full animate-[grow_2s_ease-in-out_forwards] rounded-full bg-emerald-500" />
            </div>
          </div>
        ) : (
          <>
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
                  {loading ? 'Activation en cours...' : 'Activer mon compte'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  )
}
