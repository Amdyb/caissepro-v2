'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Camera, KeyRound, Mail, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passwordMode, setPasswordMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      setEmail(userData.user.email || '')
      setFullName(userData.user.user_metadata?.full_name || '')
      setAvatarUrl(userData.user.user_metadata?.avatar_url || null)
      setLoading(false)
    }
    init()
  }, [])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      let uploadedAvatarUrl = avatarUrl

      if (avatarFile) {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        if (userId) {
          const ext = avatarFile.name.split('.').pop()
          const path = `avatars/${userId}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('business-assets')
            .upload(path, avatarFile, { upsert: true })
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('business-assets').getPublicUrl(path)
            uploadedAvatarUrl = urlData.publicUrl
          }
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: uploadedAvatarUrl }
      })

      if (updateError) throw updateError

      setAvatarUrl(uploadedAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview(null)
      setMessage('Profil mis à jour avec succès.')
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde.')
    }

    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    if (newPassword.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setPasswordSaving(true)
    setMessage('')
    setError('')

    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
    if (pwError) {
      setError(pwError.message)
    } else {
      setMessage('Mot de passe modifié avec succès.')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMode(false)
    }
    setPasswordSaving(false)
  }

  if (loading) {
    return (
      <AppShell title="Profil" subtitle="Vos informations personnelles.">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-200" />
        </div>
      </AppShell>
    )
  }

  const displayAvatar = avatarPreview || avatarUrl

  return (
    <AppShell title="Profil" subtitle="Vos informations personnelles et sécurité du compte.">
      <div className="mx-auto max-w-lg space-y-5">
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}

        {/* Avatar + name/email */}
        <form onSubmit={saveProfile} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-black text-slate-950">Informations personnelles</h2>

          {/* Avatar */}
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-100">
                {displayAvatar
                  ? <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
                  : <User size={32} className="text-slate-400" />
                }
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md"
              >
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-700">Photo de profil</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Changer la photo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                <User size={15} /> Nom complet
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                <Mail size={15} /> Adresse e-mail
              </label>
              <input
                value={email}
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-400 outline-none"
              />
              <p className="mt-1 text-xs font-bold text-slate-400">L'adresse e-mail ne peut pas être modifiée ici.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20 disabled:opacity-60"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </form>

        {/* Password */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Mot de passe</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">Sécurisez votre compte avec un mot de passe fort.</p>
            </div>
            <KeyRound className="text-slate-300" size={28} />
          </div>

          {!passwordMode ? (
            <button
              onClick={() => { setPasswordMode(true); setError(''); setMessage('') }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <KeyRound size={16} /> Changer le mot de passe
            </button>
          ) : (
            <form onSubmit={changePassword} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                  placeholder="Répétez le mot de passe"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setPasswordMode(false); setNewPassword(''); setConfirmPassword(''); setError('') }} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600">
                  Annuler
                </button>
                <button type="submit" disabled={passwordSaving} className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-60">
                  {passwordSaving ? 'Modification...' : 'Confirmer'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  )
}
