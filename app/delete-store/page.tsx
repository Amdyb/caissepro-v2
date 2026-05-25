'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteStorePage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle()

      const member: any = membership
      if (!member?.business_id) {
        setMessage('Vous devez être propriétaire pour supprimer la boutique.')
        setLoading(false)
        return
      }

      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      setLoading(false)
    }
    init()
  }, [router])

  async function deleteStore() {
    if (!businessId || confirm !== businessName) return
    setDeleting(true)

    const { error } = await supabase
      .from('businesses')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', businessId)

    if (error) {
      setMessage(error.message)
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/register')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-bold text-slate-600 dark:text-slate-400">Chargement...</p>
      </main>
    )
  }

  const canDelete = confirm === businessName

  return (
    <AppShell title="Supprimer la boutique" subtitle="Action irréversible — procédez avec prudence.">
      <div className="mx-auto max-w-xl space-y-6">
        {message && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700 dark:border-red-900 dark:bg-red-900/20">
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 shrink-0 text-red-600" size={28} />
            <div>
              <h3 className="text-xl font-black text-red-900 dark:text-red-400">Attention — suppression définitive</h3>
              <ul className="mt-3 space-y-1 text-sm font-semibold text-red-700 dark:text-red-400">
                <li>• Tous les produits, ventes et clients seront supprimés</li>
                <li>• Vos données ne pourront pas être récupérées</li>
                <li>• Votre compte sera déconnecté immédiatement</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 text-lg font-black text-slate-950 dark:text-white">Confirmer la suppression</h3>
          <p className="mb-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Tapez <span className="rounded bg-slate-100 px-2 py-0.5 font-black text-slate-950 dark:bg-slate-700 dark:text-white">{businessName}</span> pour confirmer.
          </p>

          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={businessName}
            className="mb-5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-red-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
          />

          <button
            onClick={deleteStore}
            disabled={!canDelete || deleting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={18} />
            {deleting ? 'Suppression en cours...' : 'Supprimer définitivement la boutique'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
