'use client'

import AppShell from '@/components/AppShell'
import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import { supabase } from '@/lib/supabaseClient'
import { Lock, Mail, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

type Member = {
  id?: string
  business_id: string
  user_id?: string | null
  full_name?: string | null
  email?: string | null
  role?: string | null
  created_at?: string | null
}

export default function EmployeesPage() {
  const [businessId, setBusinessId] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [role, setRole] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      await loadMembers(membership.business_id)
      setLoading(false)
    }

    init()
  }, [])

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setMembers((data || []) as Member[])
  }

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()

    const exists = members.some((member) => member.email?.toLowerCase() === cleanEmail)
    if (exists) {
      setMessage('Cet employé existe déjà dans cette boutique.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('business_members').insert({
      business_id: businessId,
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
      role
    })

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setEmail('')
    setFullName('')
    setTemporaryPassword('')
    setRole('sales')
    setMessage('Employé ajouté avec mot de passe temporaire.')
    await loadMembers(businessId)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement employés...</p></main>
  }

  return (
    <AppShell title="Employés" subtitle="Ajoutez et gérez les accès de votre équipe.">
      <div className="mx-auto max-w-6xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><UserPlus /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Ajouter un employé</h2>
            </div>
          </div>

          <form onSubmit={addEmployee} className="grid gap-4 lg:grid-cols-2">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" />
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input type="password" value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} placeholder="Mot de passe temporaire" className="w-full rounded-2xl border border-slate-300 py-4 pl-12 pr-5 font-bold outline-none focus:border-emerald-500" />
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none focus:border-emerald-500">
              <option value="sales">Vendeur</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white disabled:opacity-60 lg:col-span-2"><UserPlus size={18} />{saving ? 'Ajout...' : 'Ajouter'}</button>
          </form>
        </div>

        <div className="mt-10 flex justify-center"><AmdyLabsBrand /></div>
      </div>
    </AppShell>
  )
}
