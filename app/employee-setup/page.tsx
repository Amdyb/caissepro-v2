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

  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberFullName, setMemberFullName] = useState('')

  function showError(msg: string) { setMessage(msg); setIsError(true) }
  function showSuccess(msg: string) { setMessage(msg); setIsError(false) }

  function friendlyError(raw: string): string {
    const msg = raw.toLowerCase()
    if (msg.includes('database error') || msg.includes('unexpected') || msg.includes('internal')) {
      return "Une erreur technique est survenue. Veuillez réessayer dans quelques instants."
    }
    if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('already been registered')) {
      return "Ce compte existe déjà. Veuillez vous connecter directement."
    }
    if (msg.includes('invalid email') || msg.includes('email')) {
      return "Adresse email invalide ou déjà utilisée. Vérifiez vos informations."
    }
    if (msg.includes('password') || msg.includes('too short')) {
      return "Le mot de passe ne respecte pas les critères de sécurité requis."
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer."
    }
    return "Erreur lors de la création du compte. Veuillez réessayer."
  }

  async function verifyTempPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanTemp = tempPassword.trim()

    // Check both temp_password and temporary_password columns
    let { data: member, error } = await supabase
      .from('business_members')
      .select('id, user_id, email, full_name, business_id')
      .eq('temp_password', cleanTemp)
      .eq('is_active', true)
      .maybeSingle()

    if (!member) {
      const { data: member2 } = await supabase
        .from('business_members')
        .select('id, user_id, email, full_name, business_id')
        .eq('temporary_password', cleanTemp)
        .eq('is_active', true)
        .maybeSingle()
      if (member2) member = member2
    }

    if (error || !member) {
      showError("Email ou mot de passe temporaire incorrect. Vérifiez vos identifiants.")
      setLoading(false)
      return
    }

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

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: memberEmail,
      password: newPassword,
      options: { data: { full_name: memberFullName } }
    })

    if (signUpError) {
      showError(friendlyError(signUpError.message))
      setLoading(false)
      return
    }

    const newUserId = signUpData.user?.id
    if (!newUserId) {
      showError("Erreur lors de la création du compte. Réessayez.")
      setLoading(false)
      return
    }

    // Sign in FIRST to get a session — required so RLS allows us to update business_members
    let session = signUpData.session
    if (!session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: memberEmail,
        password: newPassword,
      })

      if (loginError) {
        showSuccess("Compte créé. Vérifiez votre email pour confirmer votre compte, puis connectez-vous.")
        setLoading(false)
        return
      }
      session = loginData.session
    }

    // Now that we have a session, check if the trigger linked the record
    const { data: linked } = await supabase
      .from('business_members')
      .select('id')
      .eq('id', memberId)
      .eq('user_id', newUserId)
      .maybeSingle()

    if (!linked) {
      // Trigger did not fire — retry update with active session so RLS passes
      let success = false
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 600))
        const { error: updateError } = await supabase
          .from('business_members')
          .update({ user_id: newUserId, temp_password: null, temporary_password: null, must_change_password: false })
          .eq('id', memberId)
        if (!updateError) { success = true; break }
      }
      if (!success) {
        console.warn('[employee-setup] Could not link user_id — will be repaired on first login')
      }
    }

    // Store business_id so dashboard loads the correct business
    const { data: linkedMember } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('id', memberId)
      .maybeSingle()
    if (linkedMember?.business_id) {
      localStorage.setItem('caissepro_active_business', linkedMember.business_id)
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
