'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Mail, MapPin, Phone, Plus, Search, Trash2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Supplier = {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  balance: number | null
  note: string | null
  created_at: string
}

export default function SuppliersPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: '',
    note: ''
  })

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return suppliers

    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(q) ||
      (supplier.phone || '').toLowerCase().includes(q) ||
      (supplier.email || '').toLowerCase().includes(q) ||
      (supplier.address || '').toLowerCase().includes(q)
    )
  }, [suppliers, search])

  const totalBalance = suppliers.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0)
  const suppliersWithDebt = suppliers.filter((supplier) => Number(supplier.balance || 0) > 0)

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
        .maybeSingle()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      await loadSuppliers(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadSuppliers(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setSuppliers((data || []) as Supplier[])
  }

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('suppliers')
      .insert({
        business_id: businessId,
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        balance: Number(form.balance || 0),
        note: form.note || null
      })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      balance: '',
      note: ''
    })

    await loadSuppliers(businessId)
    setMessage('Fournisseur ajouté avec succès.')
    setSaving(false)
  }

  async function deleteSupplier(id: string) {
    if (!businessId) return
    if (!confirm('Supprimer ce fournisseur ?')) return

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadSuppliers(businessId)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des fournisseurs...</p>
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

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Fournisseurs
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/purchases" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
              Réassort
            </Link>

            <button
              onClick={logout}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Building2 className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Fournisseurs</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{suppliers.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className={totalBalance > 0 ? 'text-red-600' : 'text-brand-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Solde dû</p>
            <p className={`mt-2 text-3xl font-black ${totalBalance > 0 ? 'text-red-700' : 'text-slate-950'}`}>
              {totalBalance.toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Phone className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">À payer</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {suppliersWithDebt.length}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Plus />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Ajouter un fournisseur
                </h2>

                <p className="text-sm text-slate-500">
                  Gardez vos contacts et soldes fournisseurs.
                </p>
              </div>
            </div>

            <form onSubmit={addSupplier} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Nom du fournisseur</label>
                <input
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: Grossiste Sandaga"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Téléphone</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                    placeholder="77 000 00 00"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                    placeholder="contact@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Adresse</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Adresse ou marché"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Solde dû</label>
                <input
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="0"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: livre le mardi, paiement Wave..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? 'Ajout...' : 'Ajouter fournisseur'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Liste fournisseurs</h2>
                <p className="text-sm text-slate-500">{suppliers.length} fournisseur(s)</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-72"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredSuppliers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Building2 className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucun fournisseur</h3>
                <p className="mt-2 text-slate-500">Les fournisseurs ajoutés apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-950">{supplier.name}</p>

                        <div className="mt-3 space-y-2 text-sm font-semibold text-slate-500">
                          {supplier.phone && (
                            <p className="flex items-center gap-2">
                              <Phone size={15} />
                              {supplier.phone}
                            </p>
                          )}

                          {supplier.email && (
                            <p className="flex items-center gap-2">
                              <Mail size={15} />
                              {supplier.email}
                            </p>
                          )}

                          {supplier.address && (
                            <p className="flex items-center gap-2">
                              <MapPin size={15} />
                              {supplier.address}
                            </p>
                          )}

                          {supplier.note && (
                            <p className="text-slate-600">{supplier.note}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`rounded-2xl px-5 py-4 text-center ${Number(supplier.balance || 0) > 0 ? 'bg-red-50' : 'bg-brand-50'}`}>
                          <p className={`text-xs font-bold ${Number(supplier.balance || 0) > 0 ? 'text-red-600' : 'text-brand-700'}`}>
                            Solde
                          </p>
                          <p className={`text-xl font-black ${Number(supplier.balance || 0) > 0 ? 'text-red-700' : 'text-brand-700'}`}>
                            {Number(supplier.balance || 0).toLocaleString('fr-FR')} CFA
                          </p>
                        </div>

                        <button
                          onClick={() => deleteSupplier(supplier.id)}
                          className="rounded-2xl p-3 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
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
