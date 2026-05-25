'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Plus, ReceiptText, Search, Trash2, Wallet } from 'lucide-react'
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

    const todayExpenses = expenses.filter((e) => e.expense_date === today)
    const monthExpenses = expenses.filter((e) => (e.expense_date || '') >= monthStart)
    const todaySales = sales.filter((s) => s.created_at.slice(0, 10) === today)
    const monthSales = sales.filter((s) => s.created_at.slice(0, 10) >= monthStart)

    const sumExp = (items: Expense[]) => items.reduce((s, e) => s + Number(e.amount || 0), 0)
    const sumSales = (items: Sale[]) => items.reduce((s, x) => s + Number(x.total || 0), 0)

    const todayExpenseTotal = sumExp(todayExpenses)
    const monthExpenseTotal = sumExp(monthExpenses)
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
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      setBusinessId(membership.business_id)
      await Promise.all([loadExpenses(membership.business_id), loadSales(membership.business_id)])
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

    if (error) { setMessage(error.message); return }
    setExpenses((data || []) as Expense[])
  }

  async function loadSales(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, total, created_at')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) { setMessage(error.message); return }
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

    if (error) { setMessage(error.message); setSaving(false); return }

    setForm({ title: '', category: 'Transport', amount: '', note: '', expense_date: todayISO() })
    await loadExpenses(businessId)
    setMessage('Dépense ajoutée avec succès.')
    setSaving(false)
  }

  async function deleteExpense(id: string) {
    if (!businessId || !window.confirm('Supprimer cette dépense ?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { setMessage(error.message); return }
    await loadExpenses(businessId)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-bold text-slate-600 dark:text-slate-400">Chargement des dépenses...</p>
      </main>
    )
  }

  return (
    <AppShell title="Dépenses" subtitle="Suivez vos charges et calculez votre profit net.">
      <div className="mx-auto max-w-7xl">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <ReceiptText className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Dépenses aujourd'hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{analytics.todayExpenseTotal.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <CalendarDays className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Dépenses du mois</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{analytics.monthExpenseTotal.toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Wallet className={analytics.monthNet >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">Net du mois</p>
            <p className={`mt-2 text-3xl font-black ${analytics.monthNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {analytics.monthNet.toLocaleString('fr-FR')} CFA
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">ventes - dépenses</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Plus />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Ajouter une dépense</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Transport, salaire, fournisseur...</p>
              </div>
            </div>

            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Titre</label>
                <input
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                  placeholder="Ex: Achat marchandise"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Catégorie</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Transport">Transport</option>
                    <option value="Fournisseur">Fournisseur</option>
                    <option value="Salaire">Salaire</option>
                    <option value="Loyer">Loyer</option>
                    <option value="Electricite">Electricité</option>
                    <option value="Internet">Internet</option>
                    <option value="Publicite">Publicité</option>
                    <option value="Reparation">Réparation</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Montant (CFA)</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Ex: 10000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                  placeholder="Optionnel"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <button disabled={saving} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'Ajout...' : 'Ajouter la dépense'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Liste des dépenses</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{expenses.length} dépense(s)</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400 md:w-72"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-600 dark:bg-slate-700/50">
                <ReceiptText className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Aucune dépense</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Les dépenses ajoutées apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="rounded-3xl border border-slate-200 p-5 dark:border-slate-700">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-950 dark:text-white">{expense.title}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {expense.category || 'Autre'} · {expense.expense_date || ''}
                          {expense.note ? ` · ${expense.note}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-red-50 px-5 py-4 text-center dark:bg-red-900/30">
                          <p className="text-xs font-bold text-red-600">Montant</p>
                          <p className="text-xl font-black text-red-700">{Number(expense.amount || 0).toLocaleString('fr-FR')} CFA</p>
                        </div>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="rounded-2xl p-3 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
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
      </div>
    </AppShell>
  )
}
