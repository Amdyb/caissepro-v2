'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Mail, MapPin, Phone, Save, Settings, WalletCards } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  currency: string | null
  receipt_footer: string | null
  whatsapp: string | null
  public_slug: string | null
}

export default function SettingsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    currency: 'CFA',
    receipt_footer: 'Merci pour votre achat.',
    whatsapp: '',
    public_slug: ''
  })

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id')
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
      await loadBusiness(member.business_id)
      setLoading(false)
    }

    init()
  }, [router])

  async function loadBusiness(id: string) {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, phone, email, address, currency, receipt_footer, whatsapp, public_slug')
      .eq('id', id)
      .single()

    if (error) {
      setMessage(error.message)
      return
    }

    const b = data as Business
    setBusiness(b)
    setForm({
      name: b.name || '',
      phone: b.phone || '',
      email: b.email || '',
      address: b.address || '',
      currency: b.currency || 'CFA',
      receipt_footer: b.receipt_footer || 'Merci pour votre achat.',
      whatsapp: b.whatsapp || '',
      public_slug: b.public_slug || ''
    })
  }

  function cleanSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        currency: form.currency || 'CFA',
        receipt_footer: form.receipt_footer || null,
        whatsapp: form.whatsapp || null,
        public_slug: form.public_slug ? cleanSlug(form.public_slug) : null
      })
      .eq('id', businessId)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    await loadBusiness(businessId)
    setMessage('Paramètres enregistrés avec succès.')
    setSaving(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des paramètres...</p>
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
              Paramètres boutique
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              Profil, reçus et informations publiques
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Settings />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Informations boutique
              </h2>
              <p className="text-sm text-slate-500">
                Ces informations apparaîtront sur les reçus et rapports.
              </p>
            </div>
          </div>

          <form onSubmit={saveSettings} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Nom de la boutique</label>
              <input
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Téléphone</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="78 000 00 00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">WhatsApp</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="221780000000"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Email</label>
              <input
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                placeholder="contact@boutique.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Adresse</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                placeholder="Dakar, Sénégal"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Devise</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="CFA">CFA</option>
                  <option value="XOF">XOF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GNF">GNF</option>
                  <option value="GMD">GMD</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Lien public</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="ma-boutique"
                  value={form.public_slug}
                  onChange={(e) => setForm({ ...form, public_slug: cleanSlug(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Message bas de reçu</label>
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                value={form.receipt_footer}
                onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
              />
            </div>

            {message && (
              <div className="rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-700">
                {message}
              </div>
            )}

            <button
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Enregistrement...' : 'Enregistrer paramètres'}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Building2 />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Aperçu reçu
                </h2>
                <p className="text-sm text-slate-500">
                  Aperçu des informations visibles sur les reçus.
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-slate-50 p-6 font-mono">
              <div className="text-center">
                <h3 className="text-xl font-black uppercase text-slate-950">
                  {form.name || 'Ma Boutique'}
                </h3>
                {form.address && (
                  <p className="mt-1 text-xs font-bold text-slate-600">{form.address}</p>
                )}
                <p className="mt-1 text-xs font-bold text-slate-600">
                  {form.phone || 'Téléphone'} {form.email ? `• ${form.email}` : ''}
                </p>
              </div>

              <div className="my-4 border-t border-dashed border-slate-400" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Produit Démo</span>
                  <span>5 000 {form.currency}</span>
                </div>
                <div className="flex justify-between font-black">
                  <span>TOTAL</span>
                  <span>5 000 {form.currency}</span>
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-slate-400" />

              <p className="text-center text-xs font-bold text-slate-600">
                {form.receipt_footer || 'Merci pour votre achat.'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Résumé
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <Phone className="text-brand-600" />
                <div>
                  <p className="text-sm font-bold text-slate-500">Téléphone</p>
                  <p className="font-black text-slate-950">{form.phone || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <Mail className="text-brand-600" />
                <div>
                  <p className="text-sm font-bold text-slate-500">Email</p>
                  <p className="font-black text-slate-950">{form.email || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <MapPin className="text-brand-600" />
                <div>
                  <p className="text-sm font-bold text-slate-500">Adresse</p>
                  <p className="font-black text-slate-950">{form.address || 'Non renseignée'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <WalletCards className="text-brand-600" />
                <div>
                  <p className="text-sm font-bold text-slate-500">Devise</p>
                  <p className="font-black text-slate-950">{form.currency}</p>
                </div>
              </div>
            </div>

            {form.public_slug && (
              <div className="mt-6 rounded-2xl bg-brand-50 p-4">
                <p className="text-sm font-bold text-brand-700">Futur lien boutique</p>
                <p className="mt-1 font-black text-slate-950">
                  caissepro.app/shop/{form.public_slug}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
