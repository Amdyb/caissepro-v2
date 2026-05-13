'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, CreditCard, Eye, ReceiptText, Search } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type SaleItem = {
  id: string
  sale_id: string
  product_id: string | null
  quantity: number | null
  price: number | null
  total: number | null
  products?: {
    name: string
    image: string | null
  } | null
}

type Sale = {
  id: string
  business_id: string
  cashier_id: string | null
  customer_id: string | null
  total: number | null
  payment_method: string | null
  status: string | null
  created_at: string
  sale_items?: SaleItem[]
}

function paymentLabel(method: string | null) {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'wave':
      return 'Wave'
    case 'orange_money':
      return 'Orange Money'
    case 'card':
      return 'Carte'
    case 'credit':
      return 'Crédit client'
    default:
      return method || 'Non précisé'
  }
}

export default function SalesPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [openSaleId, setOpenSaleId] = useState<string | null>(null)

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const today = new Date().toDateString()
  const todaySales = sales
    .filter((sale) => new Date(sale.created_at).toDateString() === today)
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0)

  const filteredSales = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return sales

    return sales.filter((sale) =>
      sale.id.toLowerCase().includes(q) ||
      paymentLabel(sale.payment_method).toLowerCase().includes(q) ||
      String(Number(sale.total || 0)).includes(q)
    )
  }, [sales, search])

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(name, currency)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      await loadSales(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          sale_id,
          product_id,
          quantity,
          price,
          total,
          products (
            name,
            image
          )
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as Sale[])
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des ventes...</p>
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
            <h1 className="mt-1 text-2xl font-black text-slate-950">Historique des ventes</h1>
            <p className="text-sm font-semibold text-slate-500">{businessName}</p>
          </div>

          <div className="flex gap-3">
            <Link href="/pos" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
              Ouvrir la caisse
            </Link>
            <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReceiptText className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Ventes totales</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalSales.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <CalendarDays className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{todaySales.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <CreditCard className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Nombre de ventes</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{sales.length}</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Toutes les ventes</h2>
              <p className="text-sm text-slate-500">Cliquez sur une vente pour voir les détails.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-80"
                placeholder="Rechercher vente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          {filteredSales.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <ReceiptText className="mx-auto text-slate-400" size={42} />
              <h3 className="mt-4 text-xl font-black text-slate-950">Aucune vente</h3>
              <p className="mt-2 text-slate-500">Les ventes enregistrées dans la caisse apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => {
                const isOpen = openSaleId === sale.id
                const date = new Date(sale.created_at)

                return (
                  <div key={sale.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    <button
                      onClick={() => setOpenSaleId(isOpen ? null : sale.id)}
                      className="grid w-full gap-4 p-5 text-left md:grid-cols-[1fr_.7fr_.7fr_.7fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-950">Vente #{sale.id.slice(0, 8)}</p>
                        <p className="text-sm font-semibold text-slate-500">
                          {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Paiement</p>
                        <p className="font-black text-slate-800">{paymentLabel(sale.payment_method)}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Statut</p>
                        <p className="font-black text-brand-700">{sale.status || 'completed'}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Total</p>
                        <p className="text-xl font-black text-slate-950">{Number(sale.total || 0).toLocaleString('fr-FR')} CFA</p>
                      </div>

                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                        <Eye size={18} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 p-5">
                        <h3 className="mb-4 font-black text-slate-950">Détails de la vente</h3>

                        <div className="space-y-3">
                          {(sale.sale_items || []).map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4">
                              <div>
                                <p className="font-black text-slate-950">{item.products?.name || 'Produit supprimé'}</p>
                                <p className="text-sm text-slate-500">
                                  {item.quantity || 0} × {Number(item.price || 0).toLocaleString('fr-FR')} CFA
                                </p>
                              </div>
                              <p className="font-black text-slate-950">
                                {Number(item.total || 0).toLocaleString('fr-FR')} CFA
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex justify-end">
                          <Link
                            href={`/sales/${sale.id}`}
                            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
                          >
                            Voir reçu
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
