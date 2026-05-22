'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type StaffMember = {
  id: string
  business_id: string
  user_id: string
  role: string
  created_at: string
  profiles?: {
    full_name: string | null
    phone: string | null
  } | null
}

const roleLabels: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  manager: 'Manager',
  cashier: 'Vendeur / Caissier'
}

export default function StaffPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [members, setMembers] = useState<StaffMember[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('cashier')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(name, currency)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      await loadMembers(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select('id, business_id, user_id, role, created_at, profiles(full_name, phone)')
      .eq('business_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    setMembers((data || []) as unknown as StaffMember[])
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase.rpc('add_business_member_by_email', {
      target_business_id: businessId,
      target_email: email.trim().toLowerCase(),
      target_role: role
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage(String(data || 'Employé ajouté.'))
    setEmail('')
    setRole('cashier')
    await loadMembers(businessId)
    setSaving(false)
  }

  async function updateRole(memberId: string, newRole: string) {
    if (!businessId) return

    setMessage('')

    const { error } = await supabase.rpc('update_business_member_role', {
      target_member_id: memberId,
      target_role: newRole
    })

    if (error) {
      setMessage(error.message)
      return
    }

    await loadMembers(businessId)
  }

  async function removeMember(memberId: string) {
    if (!businessId) return
    if (!confirm('Retirer cet employé de la boutique ?')) return

    setMessage('')

    const { error } = await supabase.rpc('remove_business_member', {
      target_member_id: memberId
    })

    if (error) {
      setMessage(error.message)
      return
    }

    await loadMembers(businessId)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des employés...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} /> Tableau de bord
            </Link>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Employés & permissions</h1>
            <p className="text-sm font-semibold text-slate-500">{businessName}</p>
          </div>

          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <UserPlus />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Ajouter un employé</h2>
              <p className="text-sm text-slate-500">L’employé doit déjà avoir un compte CaissePro.</p>
            </div>
          </div>

          <form onSubmit={addMember} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Email de l’employé</label>
              <input
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                placeholder="employe@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Rôle</label>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="cashier">Vendeur / Caissier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {message && (
              <div className="rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-700">
                {message}
              </div>
            )}

            <button disabled={saving} className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Ajout...' : 'Ajouter l’employé'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl bg-slate-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="text-brand-600" />
              <h3 className="font-black text-slate-950">Permissions recommandées</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p><strong>Propriétaire / Admin :</strong> tout gérer, employés, produits, ventes, rapports.</p>
              <p><strong>Manager:</strong> produits, stock, ventes, rapports.</p>
              <p><strong>Caissier:</strong> caisse, ventes, lecture des produits.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Équipe</h2>
              <p className="text-sm text-slate-500">{members.length} membre(s)</p>
            </div>
            <Users className="text-brand-600" />
          </div>

          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Users className="mx-auto text-slate-400" size={42} />
              <h3 className="mt-4 text-xl font-black text-slate-950">Aucun membre</h3>
              <p className="mt-2 text-slate-500">Les employés ajoutés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-950">
                        {member.profiles?.full_name || 'Utilisateur'}
                      </p>
                      <p className="text-sm font-semibold text-slate-500">
                        ID: {member.user_id.slice(0, 8)} • {roleLabels[member.role] || member.role}
                      </p>
                      {member.profiles?.phone && (
                        <p className="mt-1 text-sm text-slate-500">{member.profiles.phone}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        disabled={member.role === 'owner'}
                        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-brand-600 disabled:bg-slate-100"
                        value={member.role}
                        onChange={(e) => updateRole(member.id, e.target.value)}
                      >
                        <option value="owner">Propriétaire</option>
                        <option value="admin">Administrateur</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Vendeur / Caissier</option>
                      </select>

                      <button
                        disabled={member.role === 'owner'}
                        onClick={() => removeMember(member.id)}
                        className="rounded-2xl p-3 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
