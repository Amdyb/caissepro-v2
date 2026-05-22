'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetProductsPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)

      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', membership.business_id)

      setProductCount(count || 0)
      setLoading(false)
    }
    init()
  }, [router])

  async function resetStock() {
    if (!businessId) return
    if (!confirm('Remettre le stock de tous les produits à 0 ?')) return

    setWorking(true)
    setMessage('')

    const { error } = await supabase
      .from('products')
      .update({ stock: 0 })
      .eq('business_id', businessId)

    setWorking(false)
    if (error) {
      setMessage(error.message)
      setIsError(true)
    } else {
      setMessage('Stock de tous les produits remis à 0.')
      setIsError(false)
    }
  }

  async function deleteAllProducts() {
    if (!businessId) return
    if (!confirm('SUPPRIMER DÉFINITIVEMENT tous les produits ? Cette action est irréversible.')) return
    if (!confirm('Êtes-vous vraiment sûr ? Tous les produits seront supprimés.')) return

    setWorking(true)
    setMessage('')

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('business_id', businessId)

    setWorking(false)
    if (error) {
      setMessage(error.message)
      setIsError(true)
    } else {
      setProductCount(0)
      setMessage('Tous les produits ont été supprimés.')
      setIsError(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement...</p>
      </main>
    )
  }

  return (
    <AppShell title="Réinitialisation produits" subtitle="Remettez à zéro ou supprimez votre catalogue.">
      <div className="mx-auto max-w-2xl space-y-6">
        {message && (
          <div className={`rounded-2xl p-4 text-sm font-black ${isError ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={24} />
            <div>
              <h3 className="font-black text-amber-900">Zone de réinitialisation</h3>
              <p className="text-sm font-semibold text-amber-700">Ces actions sont irréversibles. Procédez avec prudence.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3"><RotateCcw className="text-slate-700" /></div>
            <div>
              <h3 className="text-xl font-black text-slate-950">Réinitialiser le stock</h3>
              <p className="text-sm font-semibold text-slate-500">Remet le stock de tous les produits à 0. Les produits ne sont pas supprimés.</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">{productCount} produit(s) dans votre catalogue</p>
          </div>
          <button
            onClick={resetStock}
            disabled={working || productCount === 0}
            className="mt-4 w-full rounded-2xl border border-amber-300 bg-amber-50 py-4 font-black text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            {working ? 'En cours...' : 'Remettre tout le stock à 0'}
          </button>
        </div>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-100 p-3"><Trash2 className="text-red-700" /></div>
            <div>
              <h3 className="text-xl font-black text-slate-950">Supprimer tous les produits</h3>
              <p className="text-sm font-semibold text-slate-500">Supprime définitivement tous les produits du catalogue. Irréversible.</p>
            </div>
          </div>
          <button
            onClick={deleteAllProducts}
            disabled={working || productCount === 0}
            className="mt-4 w-full rounded-2xl bg-red-600 py-4 font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {working ? 'En cours...' : `Supprimer ${productCount} produit(s)`}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
