'use client'

import { supabase } from '@/lib/supabaseClient'
import { getAdminContext, type AdminRole } from '@/lib/superAdmin'
import {
  ShieldCheck,
  UserPlus,
  Mail,
  User,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const PLATFORM_WHATSAPP = '+221784581111'

type AdminUser = {
  id: string
  user_id: string | null
  name: string | null
  email: string
  role: AdminRole
  status: 'active' | 'suspended'
  created_at: string
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analyste' },
  { value: 'agent_manager', label: 'Agent Manager' },
]

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Founder',
  admin: 'Admin',
  analyst: 'Analyste',
  agent_manager: 'Agent Manager',
}

const ROLE_STYLE: Record<AdminRole, string> = {
  super_admin: 'bg-emerald-400/20 text-emerald-300',
  admin: 'bg-sky-400/20 text-sky-300',
  analyst: 'bg-violet-400/20 text-violet-300',
  agent_manager: 'bg-amber-400/20 text-amber-300',
}

function notifyWhatsApp(body: string) {
  fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: PLATFORM_WHATSAPP, body }),
  }).catch(() => null)
}

export default function SuperAdminAdminsPage() {
  const [loading, setLoading] = useState(true)
  const [isFounder, setIsFounder] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('admin')
  const [inviting, setInviting] = useState(false)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const ctx = await getAdminContext()
    setIsFounder(ctx?.role === 'super_admin')
    if (ctx?.role === 'super_admin') {
      await load()
    }
    setLoading(false)
  }

  async function load() {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true })
    setAdmins((data || []) as AdminUser[])
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return
    setInviting(true)

    const { data: userData } = await supabase.auth.getUser()
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    // Provision the auth account + email credentials server-side (needs the
    // service-role key), then persist the admin_users row.
    const res = await fetch('/api/admins/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        email: cleanEmail,
        name: name.trim() || null,
        role,
        invitedBy: userData.user?.id || null,
      }),
    })
    const result = await res.json().catch(() => ({}))

    if (!res.ok) {
      flash(result.error || "Erreur lors de l'invitation.")
      setInviting(false)
      return
    }

    setName('')
    setEmail('')
    setRole('admin')
    await load()
    flash(`Admin ${ROLE_LABEL[role]} ajouté. Identifiants envoyés par email.`)
    setInviting(false)
  }

  async function setStatus(admin: AdminUser, status: 'active' | 'suspended') {
    setBusyId(admin.id)
    const { error } = await supabase.from('admin_users').update({ status, updated_at: new Date().toISOString() }).eq('id', admin.id)
    setBusyId(null)
    if (error) {
      flash(error.message)
      return
    }
    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, status } : a)))
    notifyWhatsApp(`ADMIN ${status === 'active' ? 'RÉACTIVÉ' : 'SUSPENDU'}\n${admin.name || admin.email}\nRôle: ${ROLE_LABEL[admin.role]}`)
    flash(status === 'active' ? 'Admin réactivé.' : 'Admin suspendu.')
  }

  async function changeRole(admin: AdminUser, newRole: AdminRole) {
    if (newRole === admin.role) return
    setBusyId(admin.id)
    const { error } = await supabase.from('admin_users').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', admin.id)
    setBusyId(null)
    if (error) {
      flash(error.message)
      return
    }
    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, role: newRole } : a)))
    notifyWhatsApp(`RÔLE MODIFIÉ\n${admin.name || admin.email}\n${ROLE_LABEL[admin.role]} -> ${ROLE_LABEL[newRole]}`)
    flash('Rôle mis à jour.')
  }

  async function remove(admin: AdminUser) {
    if (!confirm(`Supprimer ${admin.name || admin.email} de l'équipe admin ?`)) return
    setBusyId(admin.id)
    const { error } = await supabase.from('admin_users').delete().eq('id', admin.id)
    setBusyId(null)
    if (error) {
      flash(error.message)
      return
    }
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
    notifyWhatsApp(`ADMIN SUPPRIMÉ\n${admin.name || admin.email}`)
    flash('Admin supprimé.')
  }

  if (loading) {
    return <div className="px-5 py-10 font-black text-white/70">Chargement...</div>
  }

  if (!isFounder) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
          <Lock className="mx-auto text-amber-400" size={48} />
          <h1 className="mt-4 text-2xl font-black">Réservé aux founders</h1>
          <p className="mt-2 text-sm font-semibold text-white/50">
            La gestion de l&apos;équipe admin est réservée aux founders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/15 p-3">
          <ShieldCheck className="text-emerald-300" size={26} />
        </div>
        <div>
          <h1 className="text-3xl font-black">Équipe admin</h1>
          <p className="text-sm font-semibold text-white/50">Gérez les administrateurs de la plateforme.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Invite */}
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-6">
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="text-emerald-300" size={22} />
            <h2 className="text-xl font-black">Inviter un admin</h2>
          </div>

          <form onSubmit={invite} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-white/60">Nom</label>
              <div className="relative mt-2">
                <User className="absolute left-4 top-3.5 text-white/30" size={16} />
                <input
                  type="text"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
                  placeholder="Nom de l'admin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-white/60">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-3.5 text-white/30" size={16} />
                <input
                  required
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 font-bold text-white outline-none placeholder:text-white/20 focus:border-emerald-400/50"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-white/60">Rôle</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={`rounded-2xl border py-3 text-xs font-black transition ${
                      role === opt.value
                        ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={inviting}
              className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {inviting ? 'Ajout...' : "Inviter l'admin"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">Administrateurs ({admins.length})</h2>
            <button onClick={load} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:text-white">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {admins.length === 0 ? (
              <p className="rounded-2xl bg-white/5 p-5 text-sm font-bold text-white/50">Aucun admin.</p>
            ) : (
              admins.map((admin) => {
                const isProtected = admin.role === 'super_admin'
                return (
                  <div
                    key={admin.id}
                    className={`rounded-3xl border border-white/5 p-5 ${admin.status === 'active' ? 'bg-slate-900' : 'bg-white/[0.02] opacity-70'}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-black">{admin.name || admin.email}</p>
                        <p className="text-xs font-bold text-white/40">{admin.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${ROLE_STYLE[admin.role]}`}>
                            {ROLE_LABEL[admin.role]}
                          </span>
                          <span className={`text-[10px] font-bold ${admin.status === 'active' ? 'text-emerald-400' : 'text-white/30'}`}>
                            {admin.status === 'active' ? 'actif' : 'suspendu'}
                          </span>
                        </div>
                      </div>

                      {!isProtected && (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={admin.role}
                            disabled={busyId === admin.id}
                            onChange={(e) => changeRole(admin, e.target.value as AdminRole)}
                            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-black text-white outline-none"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {admin.status === 'active' ? (
                            <button
                              onClick={() => setStatus(admin, 'suspended')}
                              disabled={busyId === admin.id}
                              className="rounded-xl bg-amber-500/15 p-2.5 text-amber-300 hover:bg-amber-500/25 disabled:opacity-40"
                              title="Suspendre"
                            >
                              <Pause size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatus(admin, 'active')}
                              disabled={busyId === admin.id}
                              className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40"
                              title="Réactiver"
                            >
                              <Play size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => remove(admin)}
                            disabled={busyId === admin.id}
                            className="rounded-xl bg-red-500/15 p-2.5 text-red-300 hover:bg-red-500/25 disabled:opacity-40"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
