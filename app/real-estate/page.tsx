'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Building2, CalendarClock, Home, MessageCircle, Plus, Search, UserRound, WalletCards } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Property = {
  id: string
  name: string
  property_type: string | null
  address: string | null
  monthly_rent: number | null
  status: string | null
}

type Tenant = {
  id: string
  property_id: string | null
  full_name: string
  phone: string | null
  email: string | null
  monthly_rent: number | null
  status: string | null
  properties?: { name: string | null } | null
}

type RentPayment = {
  id: string
  tenant_id: string | null
  property_id: string | null
  amount: number | null
  due_date: string | null
  paid_date: string | null
  status: string | null
  tenants?: { full_name: string | null; phone: string | null } | null
  properties?: { name: string | null } | null
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function RealEstatePage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<RentPayment[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [propertyForm, setPropertyForm] = useState({
    name: '',
    property_type: 'apartment',
    address: '',
    monthly_rent: ''
  })

  const [tenantForm, setTenantForm] = useState({
    property_id: '',
    full_name: '',
    phone: '',
    email: '',
    monthly_rent: ''
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
        .maybeSingle()

      if (!membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      await loadData(membership.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadData(id: string) {
    const [propertiesResult, tenantsResult, paymentsResult] = await Promise.all([
      supabase.from('properties').select('*').eq('business_id', id).order('created_at', { ascending: false }),
      supabase.from('tenants').select('*, properties(name)').eq('business_id', id).order('created_at', { ascending: false }),
      supabase.from('rent_payments').select('*, tenants(full_name, phone), properties(name)').eq('business_id', id).order('due_date', { ascending: true }).limit(100)
    ])

    if (propertiesResult.error) setMessage(propertiesResult.error.message)
    if (tenantsResult.error) setMessage(tenantsResult.error.message)
    if (paymentsResult.error) setMessage(paymentsResult.error.message)

    setProperties((propertiesResult.data || []) as Property[])
    setTenants((tenantsResult.data || []) as Tenant[])
    setPayments((paymentsResult.data || []) as unknown as RentPayment[])
  }

  const stats = useMemo(() => {
    const unpaid = payments.filter((p) => (p.status || 'unpaid') === 'unpaid')
    const paid = payments.filter((p) => p.status === 'paid')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdue = unpaid.filter((p) => p.due_date && new Date(p.due_date) < today)

    return {
      totalRent: tenants.reduce((sum, t) => sum + Number(t.monthly_rent || 0), 0),
      paidTotal: paid.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      unpaidTotal: unpaid.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      overdue
    }
  }, [tenants, payments])

  const filteredTenants = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return tenants
    return tenants.filter((t) =>
      t.full_name.toLowerCase().includes(q) ||
      (t.phone || '').toLowerCase().includes(q) ||
      (t.properties?.name || '').toLowerCase().includes(q)
    )
  }, [tenants, search])

  async function addProperty(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('properties').insert({
      business_id: businessId,
      name: propertyForm.name,
      property_type: propertyForm.property_type,
      address: propertyForm.address || null,
      monthly_rent: Number(propertyForm.monthly_rent || 0),
      status: 'available'
    })

    if (error) setMessage(error.message)
    else {
      setPropertyForm({ name: '', property_type: 'apartment', address: '', monthly_rent: '' })
      await loadData(businessId)
      setMessage('Bien immobilier ajouté.')
    }

    setSaving(false)
  }

  async function addTenant(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')

    const rent = Number(tenantForm.monthly_rent || 0)

    const { data: tenant, error } = await supabase.from('tenants').insert({
      business_id: businessId,
      property_id: tenantForm.property_id || null,
      full_name: tenantForm.full_name,
      phone: tenantForm.phone || null,
      email: tenantForm.email || null,
      monthly_rent: rent,
      status: 'active'
    }).select('id').single()

    if (error || !tenant) {
      setMessage(error?.message || 'Impossible d’ajouter le locataire.')
      setSaving(false)
      return
    }

    const due = new Date()
    due.setDate(5)
    if (due < new Date()) due.setMonth(due.getMonth() + 1)

    await supabase.from('rent_payments').insert({
      business_id: businessId,
      tenant_id: tenant.id,
      property_id: tenantForm.property_id || null,
      amount: rent,
      due_date: due.toISOString().slice(0, 10),
      status: 'unpaid'
    })

    setTenantForm({ property_id: '', full_name: '', phone: '', email: '', monthly_rent: '' })
    await loadData(businessId)
    setMessage('Locataire ajouté avec échéance de loyer.')
    setSaving(false)
  }

  async function markPaid(payment: RentPayment) {
    if (!businessId) return
    const { error } = await supabase.from('rent_payments').update({
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10)
    }).eq('id', payment.id)

    if (error) setMessage(error.message)
    else await loadData(businessId)
  }

  function sendReminder(payment: RentPayment) {
    const phone = (payment.tenants?.phone || '').replace(/\D/g, '')
    const text = `Bonjour ${payment.tenants?.full_name || ''}, rappel: votre loyer de ${cfa(Number(payment.amount || 0))} pour ${payment.properties?.name || 'votre logement'} est dû le ${payment.due_date || ''}. Merci.`
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement immobilier...</p></main>
  }

  return (
    <AppShell title="Gestionnaire Immobilier" subtitle="Appartements, locataires, loyers et rappels WhatsApp.">
      <div className="mx-auto max-w-[1500px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Home className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Biens</p><p className="mt-2 text-3xl font-black text-slate-950">{properties.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><UserRound className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Locataires</p><p className="mt-2 text-3xl font-black text-slate-950">{tenants.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><WalletCards className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Loyers mensuels</p><p className="mt-2 text-3xl font-black text-slate-950">{cfa(stats.totalRent)}</p></div>
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm"><CalendarClock className="text-red-600" /><p className="mt-5 text-sm font-bold text-slate-500">En retard</p><p className="mt-2 text-3xl font-black text-red-600">{stats.overdue.length}</p></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={addProperty} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Ajouter un bien</h3>
            <div className="space-y-4">
              <input required placeholder="Nom: Appartement Sacré-Cœur" value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <select value={propertyForm.property_type} onChange={(e) => setPropertyForm({ ...propertyForm, property_type: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="apartment">Appartement</option><option value="house">Maison</option><option value="room">Chambre</option><option value="commercial">Local commercial</option></select>
              <input placeholder="Adresse" value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input type="number" placeholder="Loyer mensuel" value={propertyForm.monthly_rent} onChange={(e) => setPropertyForm({ ...propertyForm, monthly_rent: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white"><Plus size={18}/>Ajouter bien</button>
            </div>
          </form>

          <form onSubmit={addTenant} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Ajouter un locataire</h3>
            <div className="space-y-4">
              <select value={tenantForm.property_id} onChange={(e) => setTenantForm({ ...tenantForm, property_id: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="">Choisir un bien</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <input required placeholder="Nom complet" value={tenantForm.full_name} onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input placeholder="Téléphone WhatsApp" value={tenantForm.phone} onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input placeholder="Email" value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input type="number" required placeholder="Loyer mensuel" value={tenantForm.monthly_rent} onChange={(e) => setTenantForm({ ...tenantForm, monthly_rent: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white"><Plus size={18}/>Ajouter locataire</button>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h3 className="text-xl font-black text-slate-950">Locataires & loyers</h3><p className="text-sm font-semibold text-slate-500">Suivi des paiements et rappels.</p></div>
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none md:w-80"/></div>
          </div>

          <div className="space-y-4">
            {filteredTenants.map((tenant) => {
              const due = payments.find((p) => p.tenant_id === tenant.id && (p.status || 'unpaid') === 'unpaid')
              return (
                <div key={tenant.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div><p className="text-lg font-black text-slate-950">{tenant.full_name}</p><p className="mt-1 text-sm font-semibold text-slate-500">{tenant.properties?.name || 'Bien non assigné'} • {tenant.phone || 'Sans téléphone'}</p><p className="mt-2 text-sm font-black text-slate-900">Loyer: {cfa(Number(tenant.monthly_rent || 0))}</p></div>
                    <div className="flex flex-wrap gap-3">
                      {due && <button onClick={() => sendReminder(due)} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white"><MessageCircle size={18}/>Rappel WhatsApp</button>}
                      {due && <button onClick={() => markPaid(due)} className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Marquer payé</button>}
                      {due ? <span className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700">Dû: {due.due_date}</span> : <span className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">À jour</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredTenants.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Building2 className="mx-auto text-slate-300" size={48}/><p className="mt-4 font-black text-slate-950">Aucun locataire</p></div>}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
