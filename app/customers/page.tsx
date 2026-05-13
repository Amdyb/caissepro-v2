'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Gift, Phone, Plus, Search, Star, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Customer = {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  email: string | null
  points: number | null
  total_spent: number | null
  debt_balance: number | null
  created_at: string
}

export default function CustomersPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  })

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim()

    if (!q) return customers

    return customers.filter((customer) =>
      customer.full_name.toLowerCase().includes(q) ||
      (customer.phone || '').toLowerCase().includes(q) ||
      (customer.email || '').toLowerCase().includes(q)
    )
  }, [customers, search])

  const totalSpent = customers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0)
  const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)
  const vipCustomers = customers.filter((customer) => Number(customer.points || 0) >= 10)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await loadCustomers(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', id)
      .order('total_spent', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as Customer[])
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        full_name: form.full_name,
        phone: form.phone || null,
        email: form.email || null,
        points: 0,
        total_spent: 0,
        debt_balance: 0
      })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({
      full_name: '',
      phone: '',
      email: ''
    })

    await loadCustomers(businessId)
    setMessage('Client ajouté avec succès.')
    setSaving(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des clients...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} /> Tableau de bord
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Clients & fidélité
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Clients</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{customers.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Gift className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">VIP</p>
            <p className="mt-2 text-3xl font-black text-brand-700">{vipCustomers.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Star className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total dépensé</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalSpent.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <Phone className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Client Doit</p>
            <p className="mt-2 text-3xl font-black text-red-700">{totalDebt.toLocaleString('fr-FR')} CFA</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Plus />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Ajouter un client
                </h2>

                <p className="text-sm text-slate-500">
                  Créez votre base de clients fidèles.
                </p>
              </div>
            </div>

            <form onSubmit={addCustomer} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Nom complet
                </label>

                <input
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: Fatou Ndiaye"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Téléphone
                </label>

                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="77 000 00 00"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="client@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              {message && (
                <div className="rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-700">
                  {message}
                </div>
              )}

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? 'Ajout...' : 'Ajouter le client'}
              </button>
            </form>

            <div className="mt-8 rounded-3xl bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Gift className="text-brand-600" />

                <h3 className="font-black text-slate-950">
                  Système fidélité
                </h3>
              </div>

              <p className="text-sm text-slate-600">
                Chaque client possède maintenant une fiche détaillée avec historique d’achats,
                dettes, paiements et points fidélité.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Base clients
                </h2>

                <p className="text-sm text-slate-500">
                  {customers.length} client(s)
                </p>
              </div>

              <div className="relative">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={18}
                />

                <input
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-72"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Users className="mx-auto text-slate-400" size={42} />

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun client
                </h3>

                <p className="mt-2 text-slate-500">
                  Les clients ajoutés apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="rounded-3xl border border-slate-200 p-5 transition hover:border-brand-200 hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-black text-slate-950">
                            {customer.full_name}
                          </p>

                          {index < 3 && (
                            <div className="rounded-full bg-yellow-100 p-1 text-yellow-600">
                              <Star size={14} />
                            </div>
                          )}

                          {Number(customer.debt_balance || 0) > 0 && (
                            <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              Doit
                            </div>
                          )}
                        </div>

                        {customer.phone && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Phone size={14} />
                            {customer.phone}
                          </div>
                        )}

                        {customer.email && (
                          <p className="mt-1 text-sm text-slate-500">
                            {customer.email}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 md:items-end">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              Points
                            </p>

                            <p className="mt-1 text-lg font-black text-brand-700">
                              {customer.points || 0}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              Dépensé
                            </p>

                            <p className="mt-1 text-lg font-black text-slate-950">
                              {Number(customer.total_spent || 0).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          <div className={`rounded-2xl px-4 py-3 text-center ${Number(customer.debt_balance || 0) > 0 ? 'bg-red-50' : 'bg-brand-50'}`}>
                            <p className="text-xs font-bold text-slate-500">
                              Dette
                            </p>

                            <p className={`mt-1 text-lg font-black ${Number(customer.debt_balance || 0) > 0 ? 'text-red-700' : 'text-brand-700'}`}>
                              {Number(customer.debt_balance || 0).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                        >
                          <Eye size={16} />
                          Voir profil
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
