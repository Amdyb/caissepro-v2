'use client'

import AppShell from '@/components/AppShell'
import { PlanName, getNumericLimit } from '@/lib/plans'
import { canManageEmployees } from '@/lib/permissions'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Eye, MessageCircle, RefreshCw, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Member = {
  id?: string
  business_id: string
  user_id?: string | null
  full_name?: string | null
  email?: string | null
  role?: string | null
  temp_password?: string | null
  is_active?: boolean | null
  deactivated_at?: string | null
  deactivation_reason?: string | null
  created_at?: string | null
}

const roleLabels: Record<string, string> = {
  sales: 'Vendeur',
  cashier: 'Caissier',
  staff: 'Employé',
  employee: 'Employé',
  manager: 'Manager',
  admin: 'Administrateur',
  owner: 'Propriétaire',
}

const DEACTIVATION_REASONS = ['Fin de contrat', 'Licenciement', 'Démission', 'Autre']

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EmployeesPage() {
  const [businessId, setBusinessId] = useState('')
  const [currentRole, setCurrentRole] = useState<string>('')
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
  const [showInactive, setShowInactive] = useState(false)

  // Deactivation modal state
  const [deactivateTarget, setDeactivateTarget] = useState<Member | null>(null)
  const [deactivateReason, setDeactivateReason] = useState('Fin de contrat')
  const [deactivateCustom, setDeactivateCustom] = useState('')
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }

      // Read every membership and honour the user-selected business (multi-boutique),
      // so the role gating reflects the boutique actually being viewed — not just
      // an arbitrary first row.
      const { data: memberships } = await supabase
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', userData.user.id)

      if (!memberships || memberships.length === 0) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setIsError(true)
        setLoading(false)
        return
      }

      let membership: any = memberships[0]
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('caissepro_selected_business_id') : null
      if (savedId) {
        const found = memberships.find((m: any) => m.business_id === savedId)
        if (found) membership = found
      }

      setBusinessId(membership.business_id)
      setCurrentRole(membership.role || '')
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('business_id', membership.business_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setPlan((sub?.plan as PlanName) || 'free')
      await loadMembers(membership.business_id)
      setLoading(false)
    }
    init()
  }, [])

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select('id,business_id,user_id,full_name,email,role,temp_password,is_active,deactivated_at,deactivation_reason,created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) { setMessage(error.message); setIsError(true); return }
    setMembers((data || []) as Member[])
  }

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    const empLimit = getNumericLimit(plan, 'employees')
    const nonOwnerActive = members.filter(m => m.role !== 'owner' && m.is_active !== false).length
    if (empLimit !== -1 && nonOwnerActive >= empLimit) {
      setMessage(`Limite atteinte : votre plan ${plan === 'free' ? 'Gratuit' : plan} permet ${empLimit} employé(s) maximum.`)
      setIsError(true)
      return
    }

    setSaving(true)
    setMessage('')
    setIsError(false)

    const cleanEmail = email.trim().toLowerCase()
    const exists = members.some((m) => m.email?.toLowerCase() === cleanEmail && m.is_active !== false)
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
      temp_password: tempPassword,
    }

    const { error } = await supabase.from('business_members').insert({
      business_id: businessId,
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
      role,
      temp_password: tempPassword,
      temporary_password: tempPassword,
      must_change_password: true,
      is_active: true,
    })

    setSaving(false)
    if (error) { setMessage(error.message); setIsError(true); return }

    setLastAdded({ ...newMember })
    setEmail('')
    setFullName('')
    setTempPassword(generateTempPassword())
    setRole('sales')
    setMessage('Employé ajouté. Partagez les identifiants ci-dessous.')
    setIsError(false)
    await loadMembers(businessId)
  }

  async function confirmDeactivate() {
    if (!deactivateTarget?.id || !businessId) return
    setDeactivating(true)
    const reason = deactivateReason === 'Autre'
      ? (deactivateCustom.trim() || 'Autre')
      : deactivateReason

    const { data: updated, error } = await supabase
      .from('business_members')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason,
      })
      .eq('id', deactivateTarget.id)
      .eq('business_id', businessId)
      .select()

    setDeactivating(false)

    if (error) {
      setMessage(`Erreur: ${error.message}`)
      setIsError(true)
      setDeactivateTarget(null)
      return
    }

    if (!updated || updated.length === 0) {
      setMessage('Employé introuvable dans cette boutique.')
      setIsError(true)
      setDeactivateTarget(null)
      return
    }

    const name = deactivateTarget.full_name || deactivateTarget.email || 'L\'employé'
    setDeactivateTarget(null)
    await loadMembers(businessId)
    setMessage(`${name} a été désactivé.`)
    setIsError(false)

    notifyDeactivationWhatsApp(name, reason)
  }

  async function reactivateEmployee(member: Member) {
    if (!member.id || !businessId) return
    if (!confirm(`Réactiver ${member.full_name || member.email} ?`)) return

    const { data: updated, error } = await supabase
      .from('business_members')
      .update({
        is_active: true,
        deactivated_at: null,
        deactivation_reason: null,
      })
      .eq('id', member.id)
      .eq('business_id', businessId)
      .select()

    if (error) {
      setMessage(`Erreur: ${error.message}`)
      setIsError(true)
      return
    }

    if (!updated || updated.length === 0) {
      setMessage('Employé introuvable dans cette boutique.')
      setIsError(true)
      return
    }

    await loadMembers(businessId)
    setMessage(`${member.full_name || member.email} a été réactivé.`)
    setIsError(false)
  }

  function notifyDeactivationWhatsApp(name: string, reason: string) {
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const text = encodeURIComponent(
      `⚠️ *CaissePro – Compte désactivé*\n\n👤 Employé : ${name}\n📅 Date : ${date}\n📋 Motif : ${reason}\n\nVous pouvez réactiver ce compte depuis la page Employés.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
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

  const activeMembers = members.filter(m => m.is_active !== false)
  const inactiveMembers = members.filter(m => m.is_active === false)
  // Only owners/admins manage the team. Managers & staff are view-only.
  const canManage = canManageEmployees(currentRole)

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-600">Chargement employés...</p>
      </main>
    )
  }

  return (
    <AppShell title="Employés" subtitle="Ajoutez et gérez les accès de votre équipe.">
      {/* Deactivation modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-800">
            <button
              onClick={() => setDeactivateTarget(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-700"
            >
              <X size={16} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <UserMinus size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Désactiver l'accès</h2>
                <p className="text-sm font-semibold text-slate-500 truncate max-w-[220px]">
                  {deactivateTarget.full_name || deactivateTarget.email}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle size={14} className="mb-1 inline" /> Cet employé ne pourra plus se connecter à CaissePro.
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 dark:text-slate-300">Motif de désactivation</label>
              <div className="grid grid-cols-2 gap-2">
                {DEACTIVATION_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDeactivateReason(r)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                      deactivateReason === r
                        ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {deactivateReason === 'Autre' && (
                <input
                  type="text"
                  placeholder="Précisez le motif..."
                  value={deactivateCustom}
                  onChange={(e) => setDeactivateCustom(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeactivateTarget(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={deactivating || (deactivateReason === 'Autre' && !deactivateCustom.trim())}
                className="flex-1 rounded-2xl bg-orange-500 py-3 text-sm font-black text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {deactivating ? 'Désactivation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-8 pb-20">
        {message && (
          <div className={`rounded-2xl p-4 text-sm font-black ${isError ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        {/* Read-only notice for managers / staff */}
        {!canManage && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700">
            <Eye size={16} className="shrink-0" />
            Mode consultation — Vous pouvez voir l&apos;équipe mais pas la modifier.
          </div>
        )}

        {/* Add employee form — owners/admins only */}
        {canManage && (
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
              {saving ? 'Ajout...' : "Ajouter l'employé"}
            </button>
          </form>
        </div>
        )}

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

        {/* Active members list */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Users className="text-sky-500" />
            <h2 className="text-2xl font-black text-slate-950">Équipe active ({activeMembers.length})</h2>
          </div>

          <div className="space-y-3">
            {activeMembers.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                Aucun employé actif pour l'instant.
              </p>
            ) : (
              activeMembers.map((member) => (
                <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-950">{member.full_name || member.email}</p>
                      <p className="text-xs font-bold text-slate-500">
                        {member.email} · {roleLabels[member.role || ''] || member.role}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {!member.user_id ? (
                          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                            Compte non activé
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                            Actif
                          </span>
                        )}
                      </div>
                    </div>

                    {canManage && member.role !== 'owner' && (
                      <button
                        onClick={() => {
                          setDeactivateTarget(member)
                          setDeactivateReason('Fin de contrat')
                          setDeactivateCustom('')
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-100 shrink-0"
                      >
                        <UserMinus size={15} /> Désactiver
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inactive members — collapsed section */}
        {inactiveMembers.length > 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setShowInactive(v => !v)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <UserMinus className="text-slate-400" size={20} />
                <span className="text-lg font-black text-slate-700">Anciens employés</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">
                  {inactiveMembers.length}
                </span>
              </div>
              {showInactive ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {showInactive && (
              <div className="space-y-3 border-t border-slate-100 px-6 pb-6 pt-4">
                {inactiveMembers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 opacity-75">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-700">{member.full_name || member.email}</p>
                        <p className="text-xs font-bold text-slate-400">
                          {member.email} · {roleLabels[member.role || ''] || member.role}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                            Inactif
                          </span>
                          {member.deactivated_at && (
                            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                              Désactivé le {formatDate(member.deactivated_at)}
                            </span>
                          )}
                          {member.deactivation_reason && (
                            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                              {member.deactivation_reason}
                            </span>
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={() => reactivateEmployee(member)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 shrink-0"
                        >
                          <UserPlus size={15} /> Réactiver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
