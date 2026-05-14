'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, MessageCircle, PackageCheck, Search, ShoppingBag, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type OnlineOrder = {
  id: string
  business_id: string
  customer_name: string | null
  customer_phone: string | null
  product_name: string | null
  product_id: string | null
  quantity: number | null
  total_amount: number | null
  note: string | null
  status: string | null
  created_at: string
}

function statusBadge(status: string | null) {
  switch (status) {
    case 'confirmed':
      return 'bg-sky-50 text-sky-700'
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700'
    case 'canceled':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-amber-50 text-amber-700'
  }
}

function statusLabel(status: string | null) {
  switch (status) {
    case 'confirmed':
      return 'Confirmée'
    case 'delivered':
      return 'Livrée'
    case 'canceled':
      return 'Annulée'
    default:
      return 'Nouvelle'
  }
}

function formatCfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function OrdersPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [orders, setOrders] = useState<OnlineOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'confirmed' | 'delivered' | 'canceled'>('all')

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

      setBusinessId(membership.business_id)
      await loadOrders(membership.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadOrders(id: string) {
    const { data, error } = await supabase
      .from('online_orders')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      setMessage(error.message)
      return
    }

    setOrders((data || []) as OnlineOrder[])
  }

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim()

    return orders.filter((order) => {
      const statusOk = filter === 'all' || (order.status || 'new') === filter
      const searchOk = !q ||
        (order.customer_name || '').toLowerCase().includes(q) ||
        (order.customer_phone || '').toLowerCase().includes(q) ||
        (order.product_name || '').toLowerCase().includes(q) ||
        (order.note || '').toLowerCase().includes(q)

      return statusOk && searchOk
    })
  }, [orders, search, filter])

  const stats = useMemo(() => {
    return {
      total: orders.length,
      newOrders: orders.filter((order) => (order.status || 'new') === 'new').length,
      confirmed: orders.filter((order) => order.status === 'confirmed').length,
      delivered: orders.filter((order) => order.status === 'delivered').length
    }
  }, [orders])

  async function updateStatus(orderId: string, status: string) {
    setMessage('')

    const { error } = await supabase
      .from('online_orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      setMessage(error.message)
      return
    }

    if (businessId) await loadOrders(businessId)
  }

  function contactWhatsApp(order: OnlineOrder) {
    const phone = (order.customer_phone || '').replace(/\D/g, '')
    const text = `Bonjour${order.customer_name ? ` ${order.customer_name}` : ''}, concernant votre commande ${order.product_name || ''} sur notre boutique.`
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-700">Chargement commandes...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Commandes en ligne"
      subtitle="Suivez les demandes reçues depuis votre boutique publique."
    >
      <div className="mx-auto max-w-[1500px]">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShoppingBag className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <PackageCheck className="text-amber-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Nouvelles</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{stats.newOrders}</p>
          </div>
          <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
            <CheckCircle className="text-sky-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Confirmées</p>
            <p className="mt-2 text-3xl font-black text-sky-600">{stats.confirmed}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <CheckCircle className="text-emerald-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Livrées</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{stats.delivered}</p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher client, téléphone, produit..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(['all', 'new', 'confirmed', 'delivered', 'canceled'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-xl px-4 py-3 text-sm font-black ${filter === item ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {item === 'all' ? 'Toutes' : statusLabel(item)}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
            <ShoppingBag className="mx-auto text-slate-300" size={54} />
            <h3 className="mt-4 text-2xl font-black text-slate-950">Aucune commande</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Les commandes de la boutique en ligne apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusBadge(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(order.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-950">{order.product_name || 'Commande boutique'}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Client: {order.customer_name || 'Non renseigné'} • {order.customer_phone || 'Sans téléphone'}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      Qté: {order.quantity || 1} • Total: {formatCfa(Number(order.total_amount || 0))}
                    </p>
                    {order.note && (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">{order.note}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 xl:justify-end">
                    <button
                      onClick={() => contactWhatsApp(order)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white hover:bg-green-700"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'confirmed')}
                      className="rounded-2xl bg-sky-50 px-5 py-3 text-sm font-black text-sky-700 hover:bg-sky-100"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'delivered')}
                      className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                    >
                      Livrée
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'canceled')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700 hover:bg-red-100"
                    >
                      <XCircle size={18} />
                      Annuler
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
