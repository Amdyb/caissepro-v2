'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Phone, Plus, Store } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Branch = {
  id: string
  name: string
  phone: string | null
  address: string | null
  logo_url: string | null
}

export default function BranchesPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    logo_url: ''
  })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (!membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      await loadBranches(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadBranches(id: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setBranches((data || []) as Branch[])
  }

  async function createBranch(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('branches')
      .insert({
        business_id: businessId,
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
        logo_url: form.logo_url || null
      })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({
      name: '',
      phone: '',
      address: '',
      logo_url: ''
    })

    await loadBranches(businessId)

    setMessage('Succursale ajoutée avec succès.')
    setSaving(false)
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
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>

            <h1 className="mt-1 text-3xl font-black text-slate-950">
              Multi-boutiques
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              Gérez plusieurs magasins et logos
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Plus />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Ajouter une boutique
              </h2>
              <p className="text-sm text-slate-500">
                Chaque boutique peut avoir son propre logo.
              </p>
            </div>
          </div>

          <form onSubmit={createBranch} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Nom boutique</label>
              <input
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Logo URL</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="https://..."
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Téléphone</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Adresse</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            {message && (
              <div className="rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-700">
                {message}
              </div>
            )}

            <button
              disabled={saving}
              className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white"
            >
              {saving ? 'Création...' : 'Créer boutique'}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                  {branch.logo_url ? (
                    <img
                      src={branch.logo_url}
                      alt={branch.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="text-slate-400" size={32} />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-950">
                    {branch.name}
                  </h3>

                  {branch.phone && (
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Phone size={15} />
                      {branch.phone}
                    </p>
                  )}

                  {branch.address && (
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <MapPin size={15} />
                      {branch.address}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-brand-50 px-4 py-3">
                  <Building2 className="text-brand-700" />
                </div>
              </div>
            </div>
          ))}

          {branches.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Store className="mx-auto text-slate-400" size={42} />
              <h3 className="mt-4 text-xl font-black text-slate-950">
                Aucune boutique
              </h3>
              <p className="mt-2 text-slate-500">
                Créez votre première succursale.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
