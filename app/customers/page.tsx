'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Gift, Phone, Plus, QrCode, Search, Star, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Customer = {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  email: string | null
  loyalty_points: number | null
  total_spent: number | null
  qr_code: string | null
  created_at: string
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function CustomersPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })

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
        .maybeSingle()

      if (!membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      await loadCustomers(membership.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customer_profiles')
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

    const qrCode = `CP-${businessId.slice(0, 6)}-${Date.now()}`

    const { error } = await supabase.from('customer_profiles').insert({
      business_id: businessId,
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      loyalty_points: 0,
      total_spent: 0,
      qr_code: qrCode
    })

    if (error) setMessage(error.message)
    else {
      setForm({ full_name: '', phone: '', email: '' })
      await loadCustomers(businessId)
      setMessage('Client ajouté avec profil fidélité.')
    }

    setSaving(false)
  }

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return customers
    return customers.filter((customer) =>
      customer.full_name.toLowerCase().includes(q) ||
      (customer.phone || '').toLowerCase().includes(q) ||
      (customer.email || '').toLowerCase().includes(q) ||
      (customer.qr_code || '').toLowerCase().includes(q)
    )
  }, [customers, search])

  const totalSpent = customers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0)
  const totalPoints = customers.reduce((sum, customer) => sum + Number(customer.loyalty_points || 0), 0)
  const vipCustomers = customers.filter((customer) => Number(customer.loyalty_points || 0) >= 500)

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement clients...</p></main>
  }

  return (
    <AppShell title="Clients & fidélité" subtitle="Profils clients, points, historique et QR identité.">
      <div className="mx-auto max-w-[1500px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Clients</p><p className="mt-2 text-3xl font-black text-slate-950">{customers.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Gift className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">VIP</p><p className="mt-2 text-3xl font-black text-emerald-700">{vipCustomers.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Star className="text-amber-600" /><p className="mt-5 text-sm font-bold text-slate-500">Points total</p><p className="mt-2 text-3xl font-black text-amber-600">{totalPoints}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><QrCode className="text-slate-700" /><p className="mt-5 text-sm font-bold text-slate-500">Total dépensé</p><p className="mt-2 text-2xl font-black text-slate-950">{cfa(totalSpent)}</p></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={addCustomer} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Ajouter client</h3>
            <div className="space-y-4">
              <input required placeholder="Nom complet" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-60"><Plus size={18}/>{saving ? 'Ajout...' : 'Ajouter client'}</button>
            </div>
            <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Chaque client reçoit automatiquement un code QR/identité pour la fidélité et l’historique.</div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><h3 className="text-xl font-black text-slate-950">Base clients</h3><p className="text-sm font-semibold text-slate-500">{customers.length} client(s)</p></div>
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none md:w-80"/></div>
            </div>

            <div className="space-y-4">
              {filteredCustomers.map((customer, index) => (
                <div key={customer.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-black text-slate-950">{customer.full_name}</h4>
                        {index < 3 && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Top client</span>}
                        {Number(customer.loyalty_points || 0) >= 500 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">VIP</span>}
                      </div>
                      {customer.phone && <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500"><Phone size={14}/>{customer.phone}</p>}
                      {customer.email && <p className="mt-1 text-sm font-semibold text-slate-500">{customer.email}</p>}
                      <p className="mt-2 text-xs font-black text-slate-400">QR: {customer.qr_code || 'Non généré'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center"><p className="text-xs font-bold text-slate-500">Points</p><p className="text-lg font-black text-amber-700">{customer.loyalty_points || 0}</p></div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center"><p className="text-xs font-bold text-slate-500">Dépensé</p><p className="text-lg font-black text-slate-950">{cfa(Number(customer.total_spent || 0))}</p></div>
                      <Link href={`/customers/${customer.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Eye size={16}/>Profil</Link>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCustomers.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Users className="mx-auto text-slate-300" size={48}/><p className="mt-4 font-black text-slate-950">Aucun client</p></div>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
