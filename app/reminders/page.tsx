'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { BellRing, Copy, HandCoins, MessageCircle, RefreshCcw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type CustomerDebt = {
  id: string
  full_name: string
  phone: string | null
  debt_balance: number | null
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

function reminderText(customer: CustomerDebt) {
  return `Bonjour ${customer.full_name}, rappel: vous avez un solde impayé de ${cfa(Number(customer.debt_balance || 0))}. Merci de passer régler dès que possible.`
}

export default function RemindersPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<CustomerDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

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
      await loadDebts(membership.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadDebts(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, debt_balance')
      .eq('business_id', id)
      .gt('debt_balance', 0)
      .order('debt_balance', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as CustomerDebt[])
  }

  async function refresh() {
    if (!businessId) return
    setLoading(true)
    await loadDebts(businessId)
    setLoading(false)
  }

  function openWhatsApp(customer: CustomerDebt) {
    const phone = (customer.phone || '').replace(/\D/g, '')
    const text = encodeURIComponent(reminderText(customer))
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  async function copyMessage(customer: CustomerDebt) {
    await navigator.clipboard.writeText(reminderText(customer))
    setMessage('Message copié.')
  }

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return customers
    return customers.filter((customer) =>
      customer.full_name.toLowerCase().includes(q) ||
      (customer.phone || '').toLowerCase().includes(q)
    )
  }, [customers, search])

  const totalDebt = customers.reduce((sum, customer) => sum + Number(customer.debt_balance || 0), 0)

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement rappels...</p></main>
  }

  return (
    <AppShell
      title="Rappels"
      subtitle="Liste des clients à relancer."
      action={
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">
          <RefreshCcw size={18} />
          Actualiser
        </button>
      }
    >
      <div className="mx-auto max-w-[1300px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <BellRing className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Rappels</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{customers.length}</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <HandCoins className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total Client Doit</p>
            <p className="mt-2 text-3xl font-black text-red-600">{cfa(totalDebt)}</p>
          </div>
        </div>

        <div className="mb-8 relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client ou téléphone..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold outline-none"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
            <BellRing className="mx-auto text-slate-300" size={54} />
            <h3 className="mt-4 text-2xl font-black text-slate-950">Aucun rappel</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Les clients avec dettes apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">Client Doit</span>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{customer.full_name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{customer.phone || 'Sans téléphone'}</p>
                    <p className="mt-2 text-lg font-black text-red-600">{cfa(Number(customer.debt_balance || 0))}</p>
                    <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">{reminderText(customer)}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => openWhatsApp(customer)} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white hover:bg-green-700">
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                    <button onClick={() => copyMessage(customer)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">
                      <Copy size={18} />
                      Copier
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
