'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle2, Circle, Loader2, MessageCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

const SUPER_ADMIN_EMAIL = 'infos@dakarvapes.com'

type Status = 'idle' | 'running' | 'ok' | 'fail'

type Check = {
  id: string
  label: string
  detail: string
}

const CHECKS: Check[] = [
  { id: 'auth', label: 'Authentification Supabase', detail: 'Vérifie que l'utilisateur courant est connecté et autorisé.' },
  { id: 'businesses', label: 'Lecture des boutiques', detail: 'Lit les 5 premières boutiques depuis la table businesses.' },
  { id: 'sale_create', label: 'Création d'une vente test', detail: 'Insère une vente de test dans la table sales (montant 0).' },
  { id: 'sale_read', label: 'Relecture de la vente', detail: 'Relit la vente créée pour confirmer la persistance.' },
  { id: 'whatsapp', label: 'Lien WhatsApp', detail: 'Génère un lien wa.me avec un message encodé correctement.' },
]

export default function TestPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [details, setDetails] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [createdSaleId, setCreatedSaleId] = useState<string | null>(null)

  function setCheck(id: string, status: Status, detail?: string) {
    setStatuses((prev) => ({ ...prev, [id]: status }))
    if (detail !== undefined) setDetails((prev) => ({ ...prev, [id]: detail }))
  }

  async function runChecks() {
    setRunning(true)
    setStatuses({})
    setDetails({})
    setWhatsappUrl(null)
    setCreatedSaleId(null)

    // 1. Auth
    setCheck('auth', 'running')
    const { data: userData } = await supabase.auth.getUser()
    const email = userData.user?.email || ''
    if (!userData.user) {
      setCheck('auth', 'fail', 'Aucun utilisateur connecté.')
      setAuthorized(false)
      setRunning(false)
      return
    }
    if (email !== SUPER_ADMIN_EMAIL) {
      setCheck('auth', 'fail', `Accès refusé. Connecté en tant que: ${email}`)
      setAuthorized(false)
      setRunning(false)
      return
    }
    setAuthorized(true)
    setCheck('auth', 'ok', `Connecté: ${email}`)

    // 2. Read businesses
    setCheck('businesses', 'running')
    const { data: businesses, error: bizError } = await supabase.from('businesses').select('id,name').limit(5)
    if (bizError) {
      setCheck('businesses', 'fail', bizError.message)
    } else {
      const names = (businesses || []).map((b: any) => b.name).join(', ')
      const firstId = businesses?.[0]?.id || null
      setBusinessId(firstId)
      setCheck('businesses', 'ok', `${businesses?.length || 0} boutique(s): ${names || 'aucune'}`)
    }

    // 3. Create test sale
    setCheck('sale_create', 'running')
    const bid = businessId || businesses?.[0]?.id
    if (!bid) {
      setCheck('sale_create', 'fail', 'Aucun business_id disponible.')
    } else {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: bid,
          total: 0,
          paid_amount: 0,
          remaining_amount: 0,
          payment_method: 'test',
          status: 'test',
        })
        .select('id')
        .single()

      if (saleError) {
        setCheck('sale_create', 'fail', saleError.message)
      } else {
        setCreatedSaleId(saleData.id)
        setCheck('sale_create', 'ok', `Vente créée: ${saleData.id}`)
      }
    }

    // 4. Read back sale
    setCheck('sale_read', 'running')
    const sid = createdSaleId
    if (!sid) {
      setCheck('sale_read', 'fail', 'Pas d'ID de vente à relire.')
    } else {
      const { data: saleRead, error: readError } = await supabase.from('sales').select('id,total,status').eq('id', sid).single()
      if (readError) {
        setCheck('sale_read', 'fail', readError.message)
      } else {
        setCheck('sale_read', 'ok', `total=${saleRead.total}, status=${saleRead.status}`)
        // Clean up test sale
        await supabase.from('sales').delete().eq('id', sid).eq('status', 'test')
      }
    }

    // 5. WhatsApp link
    setCheck('whatsapp', 'running')
    try {
      const text = encodeURIComponent('Test CaissePro ✅ Lien WhatsApp fonctionnel.')
      const url = `https://wa.me/221700000000?text=${text}`
      setWhatsappUrl(url)
      const decoded = decodeURIComponent(text)
      setCheck('whatsapp', 'ok', `Lien généré. Message: "${decoded}"`)
    } catch (e: any) {
      setCheck('whatsapp', 'fail', e?.message || 'Erreur génération lien')
    }

    setRunning(false)
  }

  function icon(status: Status) {
    if (status === 'running') return <Loader2 size={20} className="animate-spin text-slate-500" />
    if (status === 'ok') return <CheckCircle2 size={20} className="text-emerald-600" />
    if (status === 'fail') return <XCircle size={20} className="text-red-600" />
    return <Circle size={20} className="text-slate-300" />
  }

  const allDone = CHECKS.every((c) => statuses[c.id] === 'ok' || statuses[c.id] === 'fail')
  const allOk = CHECKS.every((c) => statuses[c.id] === 'ok')

  return (
    <AppShell title="Page de test" subtitle="Diagnostic end-to-end — super admin uniquement.">
      <div className="mx-auto max-w-2xl">
        {authorized === false && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Accès refusé. Cette page est réservée à <strong>{SUPER_ADMIN_EMAIL}</strong>.
          </div>
        )}

        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-black text-slate-950">Checklist end-to-end</h2>
          <p className="mb-6 text-sm font-bold text-slate-500">Vérifie la connexion Supabase, lecture/écriture base de données et génération de liens WhatsApp.</p>

          <div className="space-y-4">
            {CHECKS.map((check) => {
              const status = statuses[check.id] || 'idle'
              const detail = details[check.id]
              return (
                <div key={check.id} className={`rounded-2xl border p-4 transition ${status === 'ok' ? 'border-emerald-200 bg-emerald-50' : status === 'fail' ? 'border-red-200 bg-red-50' : status === 'running' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    {icon(status)}
                    <div className="flex-1">
                      <p className="font-black text-slate-900">{check.label}</p>
                      <p className="text-xs font-bold text-slate-400">{check.detail}</p>
                      {detail && <p className={`mt-1 text-xs font-bold ${status === 'fail' ? 'text-red-600' : 'text-emerald-700'}`}>{detail}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {whatsappUrl && statuses['whatsapp'] === 'ok' && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-black text-white"
            >
              <MessageCircle size={18} /> Tester le lien WhatsApp
            </a>
          )}
        </div>

        {allDone && (
          <div className={`mb-6 rounded-2xl border p-4 text-center font-black ${allOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {allOk ? '✅ Tous les tests réussis — CaissePro fonctionne correctement.' : '⚠️ Certains tests ont échoué. Vérifiez les détails ci-dessus.'}
          </div>
        )}

        <button
          onClick={runChecks}
          disabled={running}
          className="w-full rounded-2xl bg-slate-950 py-4 text-base font-black text-white shadow-xl disabled:opacity-60"
        >
          {running ? 'Tests en cours...' : 'Lancer les tests'}
        </button>
      </div>
    </AppShell>
  )
}
