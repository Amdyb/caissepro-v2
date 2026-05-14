'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Plus, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Member = {
  id: string
  business_id: string
  user_id: string | null
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
}

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Accès complet: produits, ventes, utilisateurs et paramètres.' },
  { value: 'manager', label: 'Manager', description: 'Rapports, ventes et inventaire sans paramètres sensibles.' },
  { value: 'sales', label: 'Vendeur', description: 'Caisse POS, ventes et consultation produits.' }
]

function roleLabel(role: string | null) {
  return roleOptions.find((item) => item.value === role)?.label || 'Vendeur'
}

function roleBadge(role: string | null) {
  switch (role) {
    case 'admin':
      return 'bg-emerald-600 text-white'
    case 'manager':
      return 'bg-sky-600 text-white'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function UsersPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'sales'
  })

  const isAdmin = currentRole === 'admin'

  const stats = useMemo(() => {
    return {
      total: members.length,
      admins: members.filter((member) => member.role === 'admin').length,
      managers: members.filter((member) => member.role === 'manager').length,
      sellers: members.filter((member) => member.role === 'sales' || !member.role).length
    }
  }, [members])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setCurrentUserId(userData.user.id)

      const { data: membership, error: membershipError } = await supabase
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (membershipError || !membership) {
        setError('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      setCurrentRole(membership.role || 'sales')
      await loadMembers(membership.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setMembers((data || []) as Member[])
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId || !isAdmin) return

    setSaving(true)
    setMessage('')
    setError('')

    const normalizedEmail = form.email.trim().toLowerCase()

    const existing = members.find((member) => member.email?.toLowerCase() === normalizedEmail)
    if (existing) {
      setError('Cet utilisateur existe déjà dans cette boutique.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: null,
        full_name: form.full_name,
        email: normalizedEmail,
        role: form.role
      })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setForm({ full_name: '', email: '', role: 'sales' })
    await loadMembers(businessId)
    setMessage('Employé ajouté. Il pourra être lié au compte auth plus tard.')
    setSaving(false)
  }

  async function updateRole(memberId: string, role: string) {
    if (!businessId || !isAdmin) return

    setMessage('')
    setError('')

    const { error } = await supabase
      .from('business_members')
      .update({ role })
      .eq('id', memberId)

    if (error) {
      setError(error.message)
      return
    }

    await loadMembers(businessId)
    setMessage('Rôle mis à jour.')
  }

  async function removeMember(member: Member) {
    if (!businessId || !isAdmin) return

    if (member.user_id === currentUserId) {
      setError('Vous ne pouvez pas supprimer votre propre accès.')
      return
    }

    const confirmed = confirm(`Supprimer ${member.full_name || member.email} de cette boutique ?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('id', member.id)

    if (error) {
      setError(error.message)
      return
    }

    await loadMembers(businessId)
    setMessage('Employé supprimé.')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement utilisateurs...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Utilisateurs"
      subtitle="Employés, rôles et permissions de la boutique."
      action={
        <div className="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 md:block">
          {roleLabel(currentRole)}
        </div>
      }
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="mb-4 text-emerald-600" />
            <p className="text-sm font-bold text-slate-500">Total</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="mb-4 text-emerald-600" />
            <p className="text-sm font-bold text-slate-500">Admins</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{stats.admins}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <UserCog className="mb-4 text-sky-600" />
            <p className="text-sm font-bold text-slate-500">Managers</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{stats.managers}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Mail className="mb-4 text-slate-600" />
            <p className="text-sm font-bold text-slate-500">Vendeurs</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{stats.sellers}</p>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Ajouter un employé</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Créez une fiche employé avec son rôle. L’activation du compte auth viendra ensuite.
            </p>

            {!isAdmin && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
                Seul un admin peut ajouter ou modifier les utilisateurs.
              </div>
            )}

            <form onSubmit={addMember} className="mt-6 space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                placeholder="Nom complet"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                disabled={!isAdmin}
                required
              />

              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                placeholder="Email employé"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!isAdmin}
                required
              />

              <select
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={!isAdmin}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>

              <button
                disabled={!isAdmin || saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Plus size={18} />
                {saving ? 'Enregistrement...' : 'Ajouter employé'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {roleOptions.map((role) => (
                <div key={role.value} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black text-slate-900">{role.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-950">Équipe</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Liste des utilisateurs liés à cette boutique.</p>
              </div>
            </div>

            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="rounded-3xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 font-black text-emerald-700">
                        {(member.full_name || member.email || 'U').slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{member.full_name || 'Sans nom'}</p>
                        <p className="truncate text-sm font-semibold text-slate-500">{member.email || 'Email non renseigné'}</p>
                        {!member.user_id && (
                          <p className="mt-1 text-xs font-bold text-amber-600">Compte auth pas encore lié</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className={`rounded-full px-3 py-2 text-xs font-black ${roleBadge(member.role)}`}>
                        {roleLabel(member.role)}
                      </span>

                      <select
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black outline-none disabled:bg-slate-50"
                        value={member.role || 'sales'}
                        onChange={(e) => updateRole(member.id, e.target.value)}
                        disabled={!isAdmin}
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => removeMember(member)}
                        disabled={!isAdmin || member.user_id === currentUserId}
                        className="rounded-2xl bg-red-50 p-3 text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <Users className="mx-auto text-slate-300" size={46} />
                  <h3 className="mt-4 text-xl font-black text-slate-950">Aucun utilisateur</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Ajoutez votre première personne.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
