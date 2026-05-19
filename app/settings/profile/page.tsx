'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import {
  AlertTriangle,
  Download,
  Lock,
  Trash2,
  User
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [message, setMessage] = useState('')

  const [passwords, setPasswords] = useState({
    current: '',
    password: '',
    confirm: ''
  })

  const [deletePassword, setDeletePassword] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle()

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(*)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      setProfile(profileData)
      setBusiness((membership as any)?.businesses || null)
      setLoading(false)
    }

    init()
  }, [])

  async function changePassword() {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user?.email) {
      setMessage('Utilisateur introuvable.')
      return
    }

    if (!passwords.current) {
      setMessage('Veuillez saisir votre mot de passe actuel.')
      return
    }

    if (passwords.password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (passwords.password !== passwords.confirm) {
      setMessage('Les mots de passe ne correspondent pas.')
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: passwords.current
    })

    if (authError) {
      setMessage('Mot de passe actuel incorrect.')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: passwords.password
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setPasswords({
      current: '',
      password: '',
      confirm: ''
    })

    setMessage('Mot de passe mis à jour.')
  }

  async function exportProducts() {
    if (!business?.id) return

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)

    const json = JSON.stringify(data || [], null, 2)
    const blob = new Blob([json], { type: 'application/json' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products-backup.json'
    a.click()

    URL.revokeObjectURL(url)
  }

  async function resetProducts() {
    if (!business?.id) return

    const confirmed = confirm('Supprimer tous les produits ? Cette action est irréversible.')

    if (!confirmed) return

    const secondConfirm = confirm('Êtes-vous absolument sûr ?')

    if (!secondConfirm) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('business_id', business.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Tous les produits ont été supprimés.')
  }

  async function deleteAccount() {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user?.email) {
      setMessage('Utilisateur introuvable.')
      return
    }

    if (!deletePassword) {
      setMessage('Veuillez confirmer votre mot de passe.')
      return
    }

    const confirmDelete = confirm('Cette action supprimera votre boutique. Continuer ?')

    if (!confirmDelete) return

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: deletePassword
    })

    if (authError) {
      setMessage('Mot de passe incorrect.')
      return
    }

    if (!business?.id) return

    const { error } = await supabase
      .from('businesses')
      .update({ is_deleted: true })
      .eq('id', business.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setDeletePassword('')
    setMessage('Compte désactivé.')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-black text-slate-700">Chargement profil...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Mon profil"
      subtitle="Compte, abonnement et sécurité"
    >
      <div className="mx-auto max-w-5xl pb-20">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-6 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 text-white shadow-2xl">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-slate-950 shadow-2xl">
                  <User size={38} />
                </div>

                <div>
                  <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                    {profile?.full_name || 'Utilisateur'}
                  </h1>

                  <p className="mt-2 text-lg font-semibold text-white/70">
                    {business?.name || 'CaissePro'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-5 backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-wide text-white/60">
                  Plan actuel
                </p>

                <p className="mt-2 text-3xl font-black uppercase text-emerald-300">
                  {business?.plan || 'free'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                <User size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Informations
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Nom
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {profile?.full_name || 'Non défini'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Téléphone
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {profile?.phone || 'Non défini'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                <Lock size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Sécurité
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none"
              />

              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={passwords.password}
                onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none"
              />

              <input
                type="password"
                placeholder="Confirmer mot de passe"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-bold outline-none"
              />

              <button
                onClick={changePassword}
                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white"
              >
                Mettre à jour mot de passe
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                <Download size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Sauvegarde
                </h2>
              </div>
            </div>

            <button
              onClick={exportProducts}
              className="w-full rounded-2xl border border-slate-200 bg-slate-950 py-3 text-sm font-black text-white"
            >
              Exporter produits
            </button>
          </section>

          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-red-100 p-4 text-red-700">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Zone dangereuse
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={resetProducts}
                className="w-full rounded-2xl border border-red-300 bg-white py-3 text-sm font-black text-red-700"
              >
                Réinitialiser produits
              </button>

              <input
                type="password"
                placeholder="Confirmer mot de passe"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full rounded-2xl border border-red-200 px-5 py-4 font-bold outline-none"
              />

              <button
                onClick={deleteAccount}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-sm font-black text-white"
              >
                <Trash2 size={18} />
                Supprimer compte
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
