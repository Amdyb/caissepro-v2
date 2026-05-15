'use client'

import AppShell from '@/components/AppShell'
import AmdyLabsBrand from '@/components/AmdyLabsBrand'
import { supabase } from '@/lib/supabaseClient'
import { Mail, ShieldCheck, UserPlus, Users } from 'lucide-react'
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
    setRole('sales')
    setMessage('Employé ajouté. Il pourra utiliser cet email pour accéder à la boutique après inscription/connexion.')
    await loadMembers(businessId)
  }

  async function updateRole(member: Member, nextRole: string) {
    if (!member.id) return

    const { error } = await supabase
      .from('business_members')
      .update({ role: nextRole })
      .eq('id', member.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMembers((prev) => prev.map((item) => item.id === member.id ? { ...item, role: nextRole } : item))
  }

  async function removeMember(member: Member) {
    if (!member.id) return
    const ok = confirm('Retirer cet employé de la boutique ?')
    if (!ok) return

    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('id', member.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMembers((prev) => prev.filter((item) => item.id !== member.id))
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
              <p className="text-sm font-semibold text-slate-500">Ajoutez un vendeur ou un administrateur à cette boutique.</p>
            </div>
          </div>

          <form onSubmit={addEmployee} className="grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto]">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none focus:border-emerald-500">
              <option value="sales">Vendeur</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white disabled:opacity-60"><UserPlus size={18} />{saving ? 'Ajout...' : 'Ajouter'}</button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><Users /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Équipe</h2>
              <p className="text-sm font-semibold text-slate-500">{members.length} membre(s)</p>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Users className="mx-auto text-slate-300" size={54} />
              <h3 className="mt-4 text-xl font-black text-slate-950">Aucun employé</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={member.id || index} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-black text-slate-950"><Mail size={16} />{member.email || 'Email manquant'}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{member.full_name || 'Nom non défini'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select value={member.role || 'sales'} onChange={(e) => updateRole(member, e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black outline-none">
                      <option value="sales">Vendeur</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-700"><ShieldCheck size={14} />Accès boutique</span>
                    <button onClick={() => removeMember(member)} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">Retirer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-center"><AmdyLabsBrand /></div>
      </div>
    </AppShell>
  )
}
