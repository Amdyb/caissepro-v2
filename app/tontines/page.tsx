'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CalendarClock, Crown, HandCoins, MessageCircle, Plus, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type TontineGroup = {
  id: string
  name: string
  contribution_amount: number | null
  frequency: string | null
  current_round: number | null
  status: string | null
}

type Participant = {
  id: string
  group_id: string
  full_name: string
  phone: string | null
  position: number | null
  has_won: boolean | null
  status: string | null
  tontine_groups?: { name: string | null } | null
}

type Contribution = {
  id: string
  group_id: string
  participant_id: string
  round_number: number | null
  amount: number | null
  due_date: string | null
  paid_date: string | null
  status: string | null
  tontine_participants?: { full_name: string | null; phone: string | null } | null
  tontine_groups?: { name: string | null } | null
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function TontinesPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [groups, setGroups] = useState<TontineGroup[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [groupForm, setGroupForm] = useState({
    name: '',
    contribution_amount: '',
    frequency: 'monthly',
    start_date: ''
  })

  const [participantForm, setParticipantForm] = useState({
    group_id: '',
    full_name: '',
    phone: '',
    position: ''
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
        .single()

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
    const [groupsResult, participantsResult, contributionsResult] = await Promise.all([
      supabase.from('tontine_groups').select('*').eq('business_id', id).order('created_at', { ascending: false }),
      supabase.from('tontine_participants').select('*, tontine_groups(name)').eq('business_id', id).order('created_at', { ascending: false }),
      supabase.from('tontine_contributions').select('*, tontine_participants(full_name, phone), tontine_groups(name)').eq('business_id', id).order('due_date', { ascending: true }).limit(300)
    ])

    if (groupsResult.error) setMessage(groupsResult.error.message)
    if (participantsResult.error) setMessage(participantsResult.error.message)
    if (contributionsResult.error) setMessage(contributionsResult.error.message)

    setGroups((groupsResult.data || []) as TontineGroup[])
    setParticipants((participantsResult.data || []) as unknown as Participant[])
    setContributions((contributionsResult.data || []) as unknown as Contribution[])
  }

  const stats = useMemo(() => {
    const unpaid = contributions.filter((item) => (item.status || 'unpaid') === 'unpaid')
    const paid = contributions.filter((item) => item.status === 'paid')
    const totalExpected = contributions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalPaid = paid.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return { unpaid, paid, totalExpected, totalPaid }
  }, [contributions])

  const filteredContributions = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contributions.filter((item) => {
      const groupOk = !selectedGroupId || item.group_id === selectedGroupId
      const searchOk = !q ||
        (item.tontine_participants?.full_name || '').toLowerCase().includes(q) ||
        (item.tontine_participants?.phone || '').toLowerCase().includes(q) ||
        (item.tontine_groups?.name || '').toLowerCase().includes(q)
      return groupOk && searchOk
    })
  }, [contributions, search, selectedGroupId])

  async function addGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('tontine_groups').insert({
      business_id: businessId,
      name: groupForm.name,
      contribution_amount: Number(groupForm.contribution_amount || 0),
      frequency: groupForm.frequency,
      start_date: groupForm.start_date || null,
      status: 'active'
    })

    if (error) setMessage(error.message)
    else {
      setGroupForm({ name: '', contribution_amount: '', frequency: 'monthly', start_date: '' })
      await loadData(businessId)
      setMessage('Groupe tontine créé.')
    }

    setSaving(false)
  }

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setMessage('')

    const group = groups.find((item) => item.id === participantForm.group_id)
    const amount = Number(group?.contribution_amount || 0)

    const { data: participant, error } = await supabase.from('tontine_participants').insert({
      business_id: businessId,
      group_id: participantForm.group_id,
      full_name: participantForm.full_name,
      phone: participantForm.phone || null,
      position: Number(participantForm.position || 0) || null,
      status: 'active'
    }).select('id').single()

    if (error || !participant) {
      setMessage(error?.message || 'Impossible d’ajouter le participant.')
      setSaving(false)
      return
    }

    const due = new Date()
    due.setDate(5)
    if (due < new Date()) due.setMonth(due.getMonth() + 1)

    await supabase.from('tontine_contributions').insert({
      business_id: businessId,
      group_id: participantForm.group_id,
      participant_id: participant.id,
      round_number: group?.current_round || 1,
      amount,
      due_date: due.toISOString().slice(0, 10),
      status: 'unpaid'
    })

    setParticipantForm({ group_id: '', full_name: '', phone: '', position: '' })
    await loadData(businessId)
    setMessage('Participant ajouté avec contribution à payer.')
    setSaving(false)
  }

  async function markPaid(contribution: Contribution) {
    if (!businessId) return
    const { error } = await supabase.from('tontine_contributions').update({
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10)
    }).eq('id', contribution.id)

    if (error) setMessage(error.message)
    else await loadData(businessId)
  }

  async function markWinner(participantId: string, groupId: string) {
    if (!businessId) return
    const group = groups.find((item) => item.id === groupId)
    const confirmed = confirm('Marquer ce participant comme gagnant de ce tour ?')
    if (!confirmed) return

    const { error } = await supabase.from('tontine_winners').insert({
      business_id: businessId,
      group_id: groupId,
      participant_id: participantId,
      round_number: group?.current_round || 1,
      amount_received: Number(group?.contribution_amount || 0) * participants.filter((p) => p.group_id === groupId).length
    })

    if (error) {
      setMessage(error.message)
      return
    }

    await supabase.from('tontine_participants').update({ has_won: true }).eq('id', participantId)
    await loadData(businessId)
    setMessage('Gagnant enregistré.')
  }

  function sendReminder(contribution: Contribution) {
    const phone = (contribution.tontine_participants?.phone || '').replace(/\D/g, '')
    const text = `Bonjour ${contribution.tontine_participants?.full_name || ''}, rappel tontine: votre cotisation de ${cfa(Number(contribution.amount || 0))} pour ${contribution.tontine_groups?.name || 'la tontine'} est due le ${contribution.due_date || ''}. Merci.`
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-700">Chargement tontines...</p></main>
  }

  return (
    <AppShell title="Tontines" subtitle="Groupes, participants, cotisations, gagnants et rappels WhatsApp.">
      <div className="mx-auto max-w-[1500px]">
        {message && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Groupes</p><p className="mt-2 text-3xl font-black text-slate-950">{groups.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Participants</p><p className="mt-2 text-3xl font-black text-slate-950">{participants.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><HandCoins className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Payé</p><p className="mt-2 text-3xl font-black text-emerald-700">{cfa(stats.totalPaid)}</p></div>
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm"><CalendarClock className="text-red-600" /><p className="mt-5 text-sm font-bold text-slate-500">Impayés</p><p className="mt-2 text-3xl font-black text-red-600">{stats.unpaid.length}</p></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={addGroup} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Créer un groupe</h3>
            <div className="space-y-4">
              <input required placeholder="Nom du groupe" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input type="number" required placeholder="Montant cotisation" value={groupForm.contribution_amount} onChange={(e) => setGroupForm({ ...groupForm, contribution_amount: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <select value={groupForm.frequency} onChange={(e) => setGroupForm({ ...groupForm, frequency: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="weekly">Hebdomadaire</option><option value="monthly">Mensuelle</option><option value="daily">Journalière</option></select>
              <input type="date" value={groupForm.start_date} onChange={(e) => setGroupForm({ ...groupForm, start_date: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white"><Plus size={18}/>Créer groupe</button>
            </div>
          </form>

          <form onSubmit={addParticipant} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-black text-slate-950">Ajouter participant</h3>
            <div className="space-y-4">
              <select required value={participantForm.group_id} onChange={(e) => setParticipantForm({ ...participantForm, group_id: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="">Choisir un groupe</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} — {cfa(Number(group.contribution_amount || 0))}</option>)}</select>
              <input required placeholder="Nom complet" value={participantForm.full_name} onChange={(e) => setParticipantForm({ ...participantForm, full_name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input placeholder="Téléphone WhatsApp" value={participantForm.phone} onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <input type="number" placeholder="Position / ordre" value={participantForm.position} onChange={(e) => setParticipantForm({ ...participantForm, position: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none" />
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white"><Plus size={18}/>Ajouter participant</button>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h3 className="text-xl font-black text-slate-950">Cotisations</h3><p className="text-sm font-semibold text-slate-500">Suivi des paiements et gagnants.</p></div>
            <div className="flex flex-col gap-3 md:flex-row">
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black outline-none"><option value="">Tous les groupes</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 text-sm font-semibold outline-none md:w-80"/></div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredContributions.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{item.tontine_participants?.full_name || 'Participant'}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{item.tontine_groups?.name || 'Groupe'} • Tour {item.round_number || 1} • Dû: {item.due_date || 'Non défini'}</p>
                    <p className="mt-2 text-sm font-black text-slate-900">Montant: {cfa(Number(item.amount || 0))}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(item.status || 'unpaid') !== 'paid' ? <button onClick={() => markPaid(item)} className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Marquer payé</button> : <span className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Payé</span>}
                    <button onClick={() => sendReminder(item)} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white"><MessageCircle size={18}/>Rappel</button>
                    <button onClick={() => markWinner(item.participant_id, item.group_id)} className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-5 py-3 text-sm font-black text-amber-700"><Crown size={18}/>Gagnant</button>
                  </div>
                </div>
              </div>
            ))}
            {filteredContributions.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Users className="mx-auto text-slate-300" size={48}/><p className="mt-4 font-black text-slate-950">Aucune cotisation</p></div>}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
