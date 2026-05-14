'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { BellRing, CheckCircle, MessageCircle, Plus, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Reminder = {
  id: string
  reminder_type: string | null
  customer_name: string | null
  customer_phone: string | null
  amount: number | null
  message: string | null
  due_date: string | null
  status: string | null
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function AutomationRemindersPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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
      await loadReminders(membership.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadReminders(id: string) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('business_id', id)
      .order('due_date', { ascending: true })
      .limit(300)

    if (error) {
      setMessage(error.message)
      return
    }

    setReminders((data || []) as Reminder[])
  }

  async function generateDebtReminders() {
    if (!businessId) return
    setLoading(true)
    setMessage('')

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, debt_balance')
      .eq('business_id', businessId)
      .gt('debt_balance', 0)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const rows = (customers || []).map((customer: any) => ({
      business_id: businessId,
      reminder_type: 'debt',
      reference_id: customer.id,
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      amount: Number(customer.debt_balance || 0),
      due_date: new Date().toISOString().slice(0, 10),
      status: 'pending',
      message: `Bonjour ${customer.full_name}, rappel: vous avez un solde impayé de ${cfa(Number(customer.debt_balance || 0))}. Merci de régler dès que possible.`
    }))

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('reminders').insert(rows)
      if (insertError) setMessage(insertError.message)
      else setMessage(`${rows.length} rappel(s) Client Doit généré(s).`)
    } else {
      setMessage('Aucun client avec dette trouvé.')
    }

    await loadReminders(businessId)
    setLoading(false)
  }

  async function markSent(id: string) {
    if (!businessId) return
    await supabase.from('reminders').update({ status: 'sent' }).eq('id', id)
    await loadReminders(businessId)
  }

  function openWhatsApp(reminder: Reminder) {
    const phone = (reminder.customer_phone || '').replace(/\D/g, '')
    const text = encodeURIComponent(reminder.message || '')
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  const stats = useMemo(() => ({
    total: reminders.length,
    pending: reminders.filter((r) => (r.status || 'pending') === 'pending').length,
    sent: reminders.filter((r) => r.status === 'sent').length,
    amount: reminders.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  }), [reminders])

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement automatisations...</p></main>
  }

  return (
    <AppShell title="Automatisation rappels" subtitle="File de relance WhatsApp pour dettes, loyers et tontines.">
      <div className="mx-auto max-w-[1300px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><BellRing className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Total</p><p className="mt-2 text-3xl font-black text-slate-950">{stats.total}</p></div>
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm"><BellRing className="text-amber-600" /><p className="mt-5 text-sm font-bold text-slate-500">En attente</p><p className="mt-2 text-3xl font-black text-amber-600">{stats.pending}</p></div>
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm"><CheckCircle className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Envoyés</p><p className="mt-2 text-3xl font-black text-emerald-600">{stats.sent}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><BellRing className="text-slate-700" /><p className="mt-5 text-sm font-bold text-slate-500">Montant</p><p className="mt-2 text-2xl font-black text-slate-950">{cfa(stats.amount)}</p></div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <button onClick={generateDebtReminders} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700"><Plus size={18}/>Générer Client Doit</button>
          <button onClick={() => businessId && loadReminders(businessId)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"><RefreshCcw size={18}/>Actualiser</button>
        </div>

        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{reminder.reminder_type || 'rappel'} • {reminder.status || 'pending'}</span>
                  <h3 className="mt-3 text-xl font-black text-slate-950">{reminder.customer_name || 'Client'}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{reminder.customer_phone || 'Sans téléphone'} • {reminder.due_date || 'Sans date'}</p>
                  <p className="mt-2 text-lg font-black text-red-600">{cfa(Number(reminder.amount || 0))}</p>
                  <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">{reminder.message}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => openWhatsApp(reminder)} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white hover:bg-green-700"><MessageCircle size={18}/>WhatsApp</button>
                  <button onClick={() => markSent(reminder.id)} className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Marquer envoyé</button>
                </div>
              </div>
            </div>
          ))}

          {reminders.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><BellRing className="mx-auto text-slate-300" size={54}/><h3 className="mt-4 text-2xl font-black text-slate-950">Aucun rappel</h3><p className="mt-2 text-sm font-semibold text-slate-500">Générez des rappels pour commencer.</p></div>}
        </div>
      </div>
    </AppShell>
  )
}
