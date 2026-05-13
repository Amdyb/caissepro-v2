'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Plus, ReceiptText, Search, Trash2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Expense = {
  id: string
  business_id: string
  created_by: string | null
  title: string
  category: string | null
  amount: number | null
  note: string | null
  expense_date: string | null
  created_at: string
}

type Sale = {
  id: string
  total: number | null
  created_at: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default function ExpensesPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    title: '',
    category: 'Transport',
    amount: '',
    note: '',
    expense_date: todayISO()
  })

  const filteredExpenses = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return expenses
    return expenses.filter((expense) =>
      expense.title.toLowerCase().includes(q) ||
      (expense.category || '').toLowerCase().includes(q) ||
      (expense.note || '').toLowerCase().includes(q)
    )
  }, [expenses, search])

  const analytics = useMemo(() => {
    const today = todayISO()
    const monthStart = startOfMonthISO()

    const todayExpenses = expenses.filter((expense) => expense.expense_date === today)
    const monthExpenses = expenses.filter((expense) => (expense.expense_date || '') >= monthStart)
    const todaySales = sales.filter((sale) => sale.created_at.slice(0, 10) === today)
    const monthSales = sales.filter((sale) => sale.created_at.slice(0, 10) >= monthStart)

    const sumExpenses = (items: Expense[]) => items.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const sumSales = (items: Sale[]) => items.reduce((sum, sale) => sum + Number(sale.total || 0), 0)

    const todayExpenseTotal = sumExpenses(todayExpenses)
    const monthExpenseTotal = sumExpenses(monthExpenses)
    const todayRevenue = sumSales(todaySales)
    const monthRevenue = sumSales(monthSales)

    return {
      todayExpenseTotal,
      monthExpenseTotal,
      todayRevenue,
      monthRevenue,
      todayNet: todayRevenue - todayExpenseTotal,
      monthNet: monthRevenue - monthExpenseTotal
    }
  }, [expenses, sales])

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
        loadExpenses(member.business_id),
        loadSales(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadExpenses(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setExpenses((data || []) as Expense[])
  }

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, total, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      setMessage(error.message)
      return
    }

    setSales((data || []) as Sale[])
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId || !userId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('expenses').insert({
      business_id: businessId,
      created_by: userId,
      title: form.title,
      category: form.category,
      amount: Number(form.amount || 0),
      note: form.note || null,
      expense_date: form.expense_date
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setForm({
      title: '',
      category: 'Transport',
      amount: '',
      note: '',
      expense_date: todayISO()
    })

    await loadExpenses(businessId)
    setMessage('Dépense ajoutée avec succès.')
    setSaving(false)
  }

  async function deleteExpense(id: string) {
    if (!businessId) return
    if (!confirm('Supprimer cette dépense ?')) return

    const { error } = await supabase.from('expenses').delete().eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadExpenses(businessId)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des dépenses...</p>
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
            <h1 className="mt-1 text-2xl font-black text-slate-950">Dépenses & profits</h1>
            <p className="text-sm font-semibold text-slate-500">{businessName}</p>
          </div>

          <button onClick={logout} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Déconnexion
          </button>
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
            <ReceiptText className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dépenses aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.todayExpenseTotal.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <CalendarDays className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Dépenses du mois</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{analytics.monthExpenseTotal.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Wallet className={analytics.monthNet >= 0 ? 'text-brand-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500">Net du mois</p>
            <p className={`mt-2 text-3xl font-black ${analytics.monthNet >= 0 ? 'text-slate-950' : 'text-red-700'}`}>
              {analytics.monthNet.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">ventes - dépenses</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Plus />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Ajouter une dépense</h2>
                <p className="text-sm text-slate-500">Transport, salaire, fournisseur, électricité...</p>
              </div>
            </div>

            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Titre</label>
                <input
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: Achat marchandise"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Catégorie</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Transport">Transport</option>
                    <option value="Fournisseur">Fournisseur</option>
                    <option value="Salaire">Salaire</option>
                    <option value="Loyer">Loyer</option>
                    <option value="Électricité">Électricité</option>
                    <option value="Internet">Internet</option>
                    <option value="Publicité">Publicité</option>
                    <option value="Réparation">Réparation</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Montant</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: 10000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Optionnel"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <button disabled={saving} className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
                {saving ? 'Ajout...' : 'Ajouter la dépense'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Liste des dépenses</h2>
                <p className="text-sm text-slate-500">{expenses.length} dépense(s)</p>
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

            {filteredExpenses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <ReceiptText className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucune dépense</h3>
                <p className="mt-2 text-slate-500">Les dépenses ajoutées apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-950">{expense.title}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {expense.category || 'Autre'} • {expense.expense_date || ''}
                          {expense.note ? ` • ${expense.note}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-red-50 px-5 py-4 text-center">
                          <p className="text-xs font-bold text-red-600">Montant</p>
                          <p className="text-xl font-black text-red-700">
                            {Number(expense.amount || 0).toLocaleString('fr-FR')} CFA
                          </p>
                        </div>

                        <button
                          onClick={() => deleteExpense(expense.id)}
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
