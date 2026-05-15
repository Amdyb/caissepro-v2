'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, CheckCircle2, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

type Sale = {
  id: string
  business_id: string
  total: number | null
  payment_method: string | null
  created_at: string
  status?: string | null
}

export default function RefundsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)

      const { data } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', membership.business_id)
        .order('created_at', { ascending: false })
        .limit(100)

      setSales((data || []) as Sale[])
      setLoading(false)
    }
    init()
  }, [])

  async function markRefunded(sale: Sale) {
    const ok = confirm('Marquer cette vente comme remboursee ?')
    if (!ok) return

    const { error } = await supabase
      .from('sales')
      .update({ status: 'refunded' })
      .eq('id', sale.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((prev) => prev.map((item) => item.id === sale.id ? { ...item, status: 'refunded' } : item))
    setMessage('Vente marquee comme remboursee.')
  }

  const filtered = sales.filter((sale) => sale.id.toLowerCase().includes(query.toLowerCase()))

  return (
    <AppShell title="Remboursements" subtitle="Rechercher une vente et la marquer comme remboursee.">
      <div className="mx-auto max-w-6xl">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}

        <div className="mb-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1" />
            <div>
              <h2 className="font-black">Mode beta</h2>
              <p className="mt-1 text-sm font-bold">Cette page marque une vente comme remboursee dans CaissePro. Le remboursement Wave/Orange Money devra etre confirme separement jusqu'a l'integration paiement complete.</p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par ID vente..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 font-semibold outline-none" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? <p className="font-black text-slate-500">Chargement...</p> : filtered.length === 0 ? (
            <div className="py-12 text-center"><RotateCcw className="mx-auto text-slate-300" size={60} /><h3 className="mt-4 text-2xl font-black">Aucune vente trouvee</h3></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((sale) => (
                <div key={sale.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Vente #{sale.id.slice(0, 8)}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{Number(sale.total || 0).toLocaleString('fr-FR')} CFA · {sale.payment_method || 'paiement'} · {new Date(sale.created_at).toLocaleString('fr-FR')}</p>
                    {sale.status === 'refunded' && <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"><CheckCircle2 size={14} /> Remboursee</p>}
                  </div>
                  <button disabled={sale.status === 'refunded'} onClick={() => markRefunded(sale)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:opacity-40"><RotateCcw size={17} /> Marquer rembourse</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
