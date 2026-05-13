'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Banknote, Calculator, Lock, Unlock, WalletCards } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Shift = {
  id: string
  business_id: string
  opened_by: string | null
  closed_by: string | null
  opening_cash: number | null
  cash_sales: number | null
  expected_cash: number | null
  actual_cash: number | null
  difference: number | null
  status: string | null
  opened_at: string
  closed_at: string | null
}

type Sale = {
  id: string
  total: number | null
  payment_method: string | null
  created_at: string
}

export default function RegisterShiftsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [openingCash, setOpeningCash] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const openShift = shifts.find((shift) => shift.status === 'open') || null

  const openShiftCashSales = useMemo(() => {
    if (!openShift) return 0

    const openedAt = new Date(openShift.opened_at)

    return sales
      .filter((sale) => sale.payment_method === 'cash')
      .filter((sale) => new Date(sale.created_at) >= openedAt)
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  }, [sales, openShift])

  const expectedCash = Number(openShift?.opening_cash || 0) + openShiftCashSales
  const difference = Number(actualCash || 0) - expectedCash

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setUserId(userData.user.id)

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

      await Promise.all([
        loadShifts(member.business_id),
        loadSales(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadShifts(id: string) {
    const { data, error } = await supabase
      .from('cash_register_shifts')
      .select('*')
      .eq('business_id', id)
      .order('opened_at', { ascending: false })
      .limit(20)

    if (error) {
      setMessage(error.message)
      return
    }

    setShifts((data || []) as Shift[])
  }

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, total, payment_method, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as Sale[])
  }

  async function openRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId || !userId) return

    if (openShift) {
      setMessage('Une caisse est déjà ouverte.')
      return
    }

    setSaving(true)
    setMessage('')

    const cash = Number(openingCash || 0)

    const { error } = await supabase
      .from('cash_register_shifts')
      .insert({
        business_id: businessId,
        opened_by: userId,
        opening_cash: cash,
        expected_cash: cash,
        status: 'open'
      })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setOpeningCash('')
    await loadShifts(businessId)
    setMessage('Caisse ouverte avec succès.')
    setSaving(false)
  }

  async function closeRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId || !userId || !openShift) return

    setSaving(true)
    setMessage('')

    const actual = Number(actualCash || 0)
    const diff = actual - expectedCash

    const { error } = await supabase
      .from('cash_register_shifts')
      .update({
        closed_by: userId,
        cash_sales: openShiftCashSales,
        expected_cash: expectedCash,
        actual_cash: actual,
        difference: diff,
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', openShift.id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setActualCash('')
    await Promise.all([
      loadShifts(businessId),
      loadSales(businessId)
    ])
    setMessage('Caisse fermée avec succès.')
    setSaving(false)
  }

  async function refreshData() {
    if (!businessId) return
    await Promise.all([
      loadShifts(businessId),
      loadSales(businessId)
    ])
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement de la caisse journalière...</p>
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
              Ouverture / Fermeture caisse
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refreshData}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Actualiser
            </button>

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

        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <WalletCards className={openShift ? 'text-brand-600' : 'text-slate-400'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Statut</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {openShift ? 'Ouverte' : 'Fermée'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Banknote className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Fond de caisse</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {Number(openShift?.opening_cash || 0).toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Calculator className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Ventes cash</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {openShiftCashSales.toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Banknote className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Cash attendu</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {expectedCash.toLocaleString('fr-FR')} CFA
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!openShift ? (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                    <Unlock />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Ouvrir la caisse
                    </h2>
                    <p className="text-sm text-slate-500">
                      Entrez le fond de caisse du début de journée.
                    </p>
                  </div>
                </div>

                <form onSubmit={openRegister} className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Fond de caisse
                    </label>

                    <input
                      type="number"
                      min="0"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                      placeholder="Ex: 25000"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                    />
                  </div>

                  <button
                    disabled={saving}
                    className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {saving ? 'Ouverture...' : 'Ouvrir la caisse'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                    <Lock />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Fermer la caisse
                    </h2>
                    <p className="text-sm text-slate-500">
                      Comptez l’argent réel dans la caisse.
                    </p>
                  </div>
                </div>

                <form onSubmit={closeRegister} className="space-y-4">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-500">Cash attendu</p>
                      <p className="text-xl font-black text-slate-950">
                        {expectedCash.toLocaleString('fr-FR')} CFA
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Cash compté
                    </label>

                    <input
                      type="number"
                      min="0"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                      placeholder="Montant réel compté"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                    />
                  </div>

                  {actualCash && (
                    <div className={`rounded-3xl p-5 ${difference < 0 ? 'bg-red-50' : difference > 0 ? 'bg-yellow-50' : 'bg-brand-50'}`}>
                      <p className="text-sm font-bold text-slate-500">Différence</p>
                      <p className={`mt-1 text-3xl font-black ${difference < 0 ? 'text-red-700' : difference > 0 ? 'text-yellow-700' : 'text-brand-700'}`}>
                        {difference.toLocaleString('fr-FR')} CFA
                      </p>
                    </div>
                  )}

                  <button
                    disabled={saving}
                    className="w-full rounded-2xl bg-red-600 py-4 font-black text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {saving ? 'Fermeture...' : 'Fermer la caisse'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-950">
                Historique des caisses
              </h2>
              <p className="text-sm text-slate-500">
                Résumé des ouvertures et fermetures.
              </p>
            </div>

            {shifts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <WalletCards className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun shift
                </h3>
                <p className="mt-2 text-slate-500">
                  Les caisses ouvertes apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {shifts.map((shift) => {
                  const opened = new Date(shift.opened_at)
                  const closed = shift.closed_at ? new Date(shift.closed_at) : null
                  const diff = Number(shift.difference || 0)

                  return (
                    <div key={shift.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-black text-slate-950">
                            {opened.toLocaleDateString('fr-FR')} à {opened.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            Statut: {shift.status === 'open' ? 'Ouverte' : 'Fermée'}
                            {closed ? ` • Fermée à ${closed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                            <p className="text-xs font-bold text-slate-500">Départ</p>
                            <p className="font-black text-slate-950">
                              {Number(shift.opening_cash || 0).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                            <p className="text-xs font-bold text-slate-500">Cash</p>
                            <p className="font-black text-slate-950">
                              {Number(shift.cash_sales || 0).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                            <p className="text-xs font-bold text-slate-500">Attendu</p>
                            <p className="font-black text-slate-950">
                              {Number(shift.expected_cash || 0).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          <div className={`rounded-2xl px-4 py-3 text-center ${diff < 0 ? 'bg-red-50' : diff > 0 ? 'bg-yellow-50' : 'bg-brand-50'}`}>
                            <p className="text-xs font-bold text-slate-500">Diff</p>
                            <p className={`font-black ${diff < 0 ? 'text-red-700' : diff > 0 ? 'text-yellow-700' : 'text-brand-700'}`}>
                              {diff.toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
