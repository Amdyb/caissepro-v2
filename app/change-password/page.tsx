'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext } from '@/lib/superAdmin'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleChange(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.")
      setIsError(true)
      return
    }
    if (newPassword.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.")
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage(error.message)
      setIsError(true)
      setLoading(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      router.push('/login')
      return
    }

    const email = (user.email || '').toLowerCase()

    // Clear the forced-change flag everywhere this user could be referenced.
    await Promise.all([
      supabase.from('business_members').update({ temp_password: null, must_change_password: false }).eq('user_id', user.id),
      supabase.from('admin_users').update({ must_change_password: false }).or(`user_id.eq.${user.id},email.ilike.${email}`),
      supabase.from('agents').update({ must_change_password: false }).or(`auth_user_id.eq.${user.id},email.ilike.${email}`),
    ])

    // Route to the correct home: admins → /super-admin, agents → /agents/dashboard,
    // merchants → /dashboard.
    const ctx = await getAdminContext()
    if (ctx?.allowed) {
      router.push('/super-admin')
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()
    if (agent && agent.status === 'active') {
      router.push('/agents/dashboard')
      return
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
          <h1 className="text-3xl font-black text-slate-950">Changer le mot de passe</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Définissez un mot de passe personnel pour sécuriser votre compte.
          </p>
        </div>

        {message && (
          <div className={`mb-6 rounded-2xl p-4 text-sm font-bold ${isError ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleChange} className="space-y-4">
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
            {loading ? 'Mise à jour...' : 'Définir mon mot de passe'}
          </button>
        </form>
      </div>
    </main>
  )
}
