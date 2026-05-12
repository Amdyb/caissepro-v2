'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, Package, ReceiptText, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      setEmail(data.user.email ?? null)
      setLoading(false)
    }

    loadUser()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-black text-slate-950">CaissePro</Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">{email}</span>
            <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="font-bold uppercase tracking-wide text-brand-600">Tableau de bord</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Bienvenue sur CaissePro</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Ceci est la première version de l’espace privé. Ensuite, nous allons connecter les boutiques, les produits, le stock et les ventes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Ventes aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">0 CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Package className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Produits</p>
            <p className="mt-2 text-3xl font-black text-slate-950">0</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Employés</p>
            <p className="mt-2 text-3xl font-black text-slate-950">1</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <BarChart3 className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Rapports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">Actif</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Prochaine étape</h2>
          <p className="mt-3 text-slate-600">
            Nous allons créer la base de données multi-tenant: businesses, profiles, business_members, products, sales et sale_items.
          </p>
        </div>
      </section>
    </main>
  )
}
