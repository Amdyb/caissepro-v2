'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, Building2, Search, ShieldCheck, Store, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAILS = ['infos@dakarvapes.com']

export default function SuperAdminBusinessesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      router.push('/login')
      return
    }

    const email = userData.user.email || ''

    if (!SUPER_ADMIN_EMAILS.includes(email)) {
      router.push('/dashboard')
      return
    }

    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    setBusinesses(data || [])
    setLoading(false)
  }

  async function toggleStatus(business: any) {
    const nextStatus = business.status === 'suspended' ? 'active' : 'suspended'

    const { error } = await supabase
      .from('businesses')
      .update({ status: nextStatus })
      .eq('id', business.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === business.id
          ? { ...b, status: nextStatus }
          : b
      )
    )

    setMessage(
      nextStatus === 'suspended'
        ? 'Boutique suspendue.'
        : 'Boutique réactivée.'
    )
  }

  const filteredBusinesses = useMemo(() => {
    const q = search.toLowerCase().trim()

    if (!q) return businesses

    return businesses.filter((business) =>
      (business.name || '').toLowerCase().includes(q) ||
      (business.slug || '').toLowerCase().includes(q) ||
      (business.owner_email || '').toLowerCase().includes(q)
    )
  }, [businesses, search])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="font-black">Chargement businesses...</p>
      </main>
    )
  }

  return (
    <AppShell title="Super Admin Businesses" subtitle="Gestion globale des boutiques.">
      <div className="mx-auto max-w-7xl pb-20">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Store className="text-emerald-600" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Total boutiques</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{businesses.length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="text-emerald-600" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Actives</p>
            <p className="mt-2 text-5xl font-black text-emerald-600">{businesses.filter((b) => b.status !== 'suspended').length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <AlertTriangle className="text-orange-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Suspendues</p>
            <p className="mt-2 text-5xl font-black text-orange-500">{businesses.filter((b) => b.status === 'suspended').length}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="text-sky-500" />
            <p className="mt-5 text-sm font-black uppercase text-slate-500">Recherche rapide</p>
            <div className="relative mt-3">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, slug, email..." className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 font-bold outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="text-emerald-600" />
            <h2 className="text-3xl font-black text-slate-950">Businesses</h2>
          </div>

          <div className="mt-6 space-y-4">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-2xl font-black text-slate-950">{business.name || 'Sans nom'}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">/{business.slug || 'no-slug'} · {business.business_type || 'retail'}</p>
                    <div className="mt-3 flex gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${business.status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {business.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href={`/store/${business.slug}`} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
                      Voir boutique
                    </Link>

                    <button onClick={() => toggleStatus(business)} className={`rounded-2xl px-5 py-3 text-sm font-black text-white ${business.status === 'suspended' ? 'bg-emerald-600' : 'bg-orange-500'}`}>
                      {business.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
