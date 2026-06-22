'use client'

import AppShell from '@/components/AppShell'
import ShopSwitcher from '@/components/ShopSwitcher'
import { supabase } from '@/lib/supabaseClient'
import { resolveSelectedBusiness, setSelectedBusinessId, ShopOption } from '@/lib/storefront'
import { Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'

type PayInfo = {
  id: string
  wave_number: string | null
  orange_number: string | null
}

const INPUT = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition'
const BTN = 'w-full rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60 transition hover:bg-emerald-700'

export default function PaymentSettingsPage() {
  const [shops, setShops] = useState<ShopOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [info, setInfo] = useState<PayInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  async function loadBusiness(id: string) {
    const { data } = await supabase.from('businesses').select('id, wave_number, orange_number').eq('id', id).maybeSingle()
    if (data) setInfo(data as PayInfo)
  }

  useEffect(() => {
    async function init() {
      const { businessId, shops } = await resolveSelectedBusiness()
      setShops(shops)
      setSelectedId(businessId)
      if (businessId) await loadBusiness(businessId)
      setLoading(false)
    }
    init()
  }, [])

  async function switchShop(id: string) {
    setSelectedBusinessId(id)
    setSelectedId(id)
    setInfo(null)
    await loadBusiness(id)
  }

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(''), 3000)
  }

  async function save() {
    if (!info) return
    setSaving(true)
    const { error } = await supabase
      .from('businesses')
      .update({ wave_number: info.wave_number, orange_number: info.orange_number })
      .eq('id', info.id)
    setSaving(false)
    if (error) showFlash(error.message)
    else showFlash('Numéros enregistrés !')
  }

  if (loading) {
    return (
      <AppShell title="Paramètres paiement" subtitle="Numéros Wave et Orange Money de votre boutique.">
        <div className="mx-auto max-w-2xl"><p className="font-black text-slate-600">Chargement...</p></div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Paramètres paiement" subtitle="Numéros Wave et Orange Money de votre boutique.">
      <div className="mx-auto max-w-2xl space-y-4">
        <ShopSwitcher shops={shops} selectedId={selectedId} onChange={switchShop} />

        {flash && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
            {flash}
          </div>
        )}

        {info && (
          <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Ces numéros s&apos;affichent à vos clients pour régler leurs commandes en ligne. Ils sont propres à cette boutique.
            </p>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                <Smartphone size={15} className="text-blue-600" /> Numéro Wave
              </label>
              <input
                value={info.wave_number || ''}
                onChange={(e) => setInfo({ ...info, wave_number: e.target.value })}
                className={INPUT}
                placeholder="77 000 0000"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                <Smartphone size={15} className="text-orange-600" /> Numéro Orange Money
              </label>
              <input
                value={info.orange_number || ''}
                onChange={(e) => setInfo({ ...info, orange_number: e.target.value })}
                className={INPUT}
                placeholder="77 000 0000"
              />
            </div>

            <button onClick={save} disabled={saving} className={BTN}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder les numéros'}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
