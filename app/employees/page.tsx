'use client'

import AppShell from '@/components/AppShell'
import { PlanName, getNumericLimit } from '@/lib/plans'
import { supabase } from '@/lib/supabaseClient'
import { Copy, MessageCircle, RefreshCw, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

type Member = {
  id?: string
  business_id: string
  user_id?: string | null
  full_name?: string | null
  email?: string | null
  role?: string | null
  temp_password?: string | null
  created_at?: string | null
}

const roleLabels: Record<string, string> = {
  sales: 'Vendeur',
  cashier: 'Caissier',
  staff: 'Employé',
  employee: 'Employé',
  manager: 'Manager',
  admin: 'Administrateur',
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function EmployeesPage() {
  const [businessId, setBusinessId] = useState('')
  const [plan, setPlan] = useState<PlanName>('free')
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [tempPassword, setTempPassword] = useState(generateTempPassword())
  const [role, setRole] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [lastAdded, setLastAdded] = useState<Member | null>(null)

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
        setIsError(true)
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      const { data: sub } = await supabase.from('subscriptions').select('plan').eq('business_id', membership.business_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
      setPlan((sub?.plan as PlanName) || 'free')
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
      setIsError(true)
      return
    }

    setMembers((data || []) as Member[])
  }

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    const empLimit = getNumericLimit(plan, 'employees')
    const nonOwnerCount = members.filter(m => m.role !== 'owner').length
    if (empLimit !== -1 && nonOwnerCount >= empLimit) {
      setMessage(`Limite atteinte : votre plan ${plan === 'free' ? 'Gratuit' : plan} permet ${empLimit} employé(s) maximum. Passez à un plan supérieur pour en ajouter.`)
      setIsError(true)
      return
    }

    setSaving(true)
    setMessage('')
    setIsError(false)

    const cleanEmail = email.trim().toLowerCase()
    const exists = members.some((m) => m.email?.toLowerCase() === cleanEmail)

    if (exists) {
      setMessage('Cet employé existe déjà dans cette boutique.')
      setIsError(true)
      setSaving(false)
      return
    }

    const newMember: any = {
      business_id: businessId,
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
      role,
      temp_password: tempPassword
    }

    const { error } = await supabase.from('business_members').insert({
      business_id: businessId,
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
      role,
      temp_password: tempPassword,
      must_change_password: true,
      is_active: true
    })

    setSaving(false)

    if (error) {
      setMessage(error.message)
      setIsError(true)
      return
    }

    setLastAdded({ ...newMember })
    setEmail('')
    setFullName('')
    setTempPassword(generateTempPassword())
    setRole('sales')
    setMessage('Employé ajouté. Partagez les identifiants ci-dessous.')
    setIsError(false)
    await loadMembers(businessId)
  }

  function shareWhatsApp(member: Member, pw: string) {
    const name = member.full_name || member.email || 'votre employé'
    const text = encodeURIComponent(
      `Bonjour ${name} 👋\n\nVoici vos identifiants CaissePro :\n\n📧 Email : ${member.email}\n🔑 Mot de passe : ${pw}\n\n👉 Activez votre compte ici :\ncaissepro.app/employee-setup\n\nBon travail !`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function copyCredentials(member: Member, pw: string) {
    const text = `Email : ${member.email}\nMot de passe : ${pw}\nActivation : caissepro.app/employee-setup`
    await navigator.clipboard.writeText(text)
    setMessage('Identifiants copiés !')
    setIsError(false)
    setTimeout(() => setMessage(''), 2500)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-black text-slate-600">Chargement employés...</p></main>
  }

  return (
    <AppShell title="Employés" subtitle="Ajoutez et gérez les accès de votre équipe.">
      <div className="mx-auto max-w-4xl space-y-8 pb-20">
        {message && (
          <div className={`rounded-2xl p-4 text-sm font-black ${isError ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        {/* Add employee form */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><UserPlus /></div>
            <h2 className="text-2xl font-black text-slate-950">Ajouter un employé</h2>
          </div>

          <form onSubmit={addEmployee} className="grid gap-4 lg:grid-cols-2">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom complet"
              className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none focus:border-emerald-500"
            />

            <div className="flex gap-2">
              <input
                type="text"
                required
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value.toUpperCase())}
                placeholder="Mot de passe temporaire"
                className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 font-mono font-bold tracking-widest outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setTempPassword(generateTempPassword())}
                title="Générer un nouveau mot de passe"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500 hover:bg-slate-100"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none focus:border-emerald-500"
            >
              <option value="sales">Vendeur</option>
              <option value="cashier">Caissier</option>
              <option value="staff">Employé</option>
              <option value="employee">Employé (général)</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>

            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white disabled:opacity-60 lg:col-span-2"
            >
              <UserPlus size={18} />
              {saving ? 'Ajout...' : 'Ajouter l\'employé'}
            </button>
          </form>
        </div>

        {/* Credentials card shown after adding */}
        {lastAdded && (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-700">Identifiants à partager avec l'employé</p>
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-white p-4 font-mono text-sm font-bold text-slate-800 space-y-1">
              <p>📧 {lastAdded.email}</p>
              <p>🔑 {lastAdded.temp_password}</p>
              <p className="text-slate-500">👉 caissepro.app/employee-setup</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copyCredentials(lastAdded, lastAdded.temp_password || '')}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <Copy size={16} /> Copier
              </button>
              <button
                onClick={() => shareWhatsApp(lastAdded, lastAdded.temp_password || '')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
              >
                <MessageCircle size={16} /> Envoyer par WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Users className="text-sky-500" />
            <h2 className="text-2xl font-black text-slate-950">Équipe ({members.length})</h2>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                Aucun employé ajouté pour l'instant.
              </p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{member.full_name || member.email}</p>
                      <p className="text-xs font-bold text-slate-500">
                        {member.email} · {roleLabels[member.role || ''] || member.role}
                      </p>
                      {!member.user_id ? (
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                          Compte non activé
                        </span>
                      ) : (
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                          Actif
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
