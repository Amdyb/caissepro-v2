'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Phone, Plus, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useBusinessData } from '@/lib/hooks/useBusinessData'
import { useCustomers } from '@/lib/hooks/useCustomers'

type Customer = {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  debt_balance: number | null
  total_spent: number | null
  created_at: string
}

function cfa(v: number) {
  return v.toLocaleString('fr-FR') + ' CFA'
}

export default function CustomersPage() {
  const router = useRouter()
  const { businessId, loading: bdLoading } = useBusinessData()
  const { customers, loading: customersLoading, mutate } = useCustomers(businessId)

  const loading = bdLoading || customersLoading

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Redirect to login if no business found
  useEffect(() => {
    if (!bdLoading && !businessId) router.push('/login')
  }, [bdLoading, businessId, router])

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('customers').insert({
      business_id: businessId,
      full_name: name,
      phone: phone || null,
      debt_balance: 0
    })

    if (error) {
      setMessage(error.message)
    } else {
      setName('')
      setPhone('')
      await mutate()
      setMessage('Client ajoute avec succes.')
    }
    setSaving(false)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return customers
    return customers.filter((c) =>
      c.full_name.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    )
  }, [customers, search])

  const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0)
  const totalDebt = customers.reduce((s, c) => s + Number(c.debt_balance || 0), 0)

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement clients...</p>
      </main>
    )
  }

  return (
    <AppShell title="Clients" subtitle="Gerez votre base clients.">
      <div className="mx-auto max-w-6xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Users className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Clients</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{customers.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total depense</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{cfa(totalSpent)}</p>
          </div>
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-slate-800">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total du (dettes)</p>
            <p className="mt-2 text-2xl font-black text-red-700">{cfa(totalDebt)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={addCustomer} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-5 text-xl font-black text-slate-950 dark:text-white">Ajouter client</h3>
            <div className="space-y-4">
              <input
                required
                placeholder="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
              />
              <input
                placeholder="Telephone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
              />
              <button
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-60"
              >
                <Plus size={18} />
                {saving ? 'Ajout...' : 'Ajouter client'}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">Base clients</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{customers.length} client(s)</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none md:w-80 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filtered.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-600 dark:bg-slate-700/50">
                  <Users className="mx-auto text-slate-300" size={48} />
                  <p className="mt-4 font-black text-slate-950 dark:text-white">Aucun client</p>
                </div>
              )}
              {filtered.map((customer, index) => (
                <div key={customer.id} className="rounded-3xl border border-slate-200 p-5 dark:border-slate-700">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-black text-slate-950 dark:text-white">{customer.full_name}</h4>
                        {index < 3 && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                            Top client
                          </span>
                        )}
                      </div>
                      {customer.phone && (
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          <Phone size={14} />
                          {customer.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {Number(customer.debt_balance || 0) > 0 && (
                        <div className="rounded-2xl bg-red-50 px-4 py-3 text-center dark:bg-red-900/30">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Doit</p>
                          <p className="text-lg font-black text-red-700">{cfa(Number(customer.debt_balance || 0))}</p>
                        </div>
                      )}
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center dark:bg-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Depense</p>
                        <p className="text-lg font-black text-slate-950 dark:text-white">{cfa(Number(customer.total_spent || 0))}</p>
                      </div>
                      <Link
                        href={'/customers/' + customer.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                      >
                        <Eye size={16} />
                        Profil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
