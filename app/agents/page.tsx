'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

const AFRICAN_COUNTRIES = [
  'Sénégal',
  "Côte d'Ivoire",
  'Mali',
  'Burkina Faso',
  'Guinée',
  'Cameroun',
  'Togo',
  'Bénin',
  'Niger',
  'Mauritanie',
  'Gambie',
  'Sierra Leone',
  'Ghana',
  'Nigeria',
  'Kenya',
  'Rwanda',
  'Tanzanie',
  'Ouganda',
  'RDC',
  'Maroc',
  'Tunisie',
  'Algérie',
  'Égypte',
  'Autre',
]

export default function AgentsPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    country: 'Sénégal',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: dbError } = await supabase.from('agents').insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        city: form.city || null,
        country: form.country,
        status: 'pending',
      })

      if (dbError) {
        if (dbError.code === '23505') {
          setError('Cet email est déjà enregistré. Connectez-vous à votre espace agent.')
        } else {
          setError(dbError.message)
        }
        setLoading(false)
        return
      }

      // Notify admin
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '+221784581111',
          body: `*Nouvelle demande agent CaissePro!*\n\nNom: ${form.full_name}\nEmail: ${form.email}\nTéléphone: ${form.phone || 'Non renseigné'}\nPays: ${form.country}\nVille: ${form.city || 'Non renseignée'}`,
        }),
      }).catch(() => null)

      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/caissepro-logo.png" alt="CaissePro" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/careers"
              className="hidden text-sm font-bold text-slate-500 hover:text-slate-700 sm:inline"
            >
              En savoir plus
            </Link>
            <Link
              href="/agents/login"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Déjà agent ? Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 to-white px-5 pb-12 pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
            <Briefcase size={14} /> Programme Agents
          </div>
          <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
            Devenez Agent
            <span className="block text-emerald-600">CaissePro</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-semibold leading-relaxed text-slate-500">
            Recrutez des commerçants. Gagnez{' '}
            <strong className="text-slate-950">50 000 XOF</strong> chaque mois dès 20 abonnés payants.
          </p>
        </div>
      </section>

      {/* Benefit chips */}
      <section className="mx-auto max-w-4xl px-5 pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Wallet,    label: '50 000 XOF / mois',    sub: 'Pour 20 abonnés payants',           color: 'bg-emerald-50 text-emerald-700' },
            { icon: TrendingUp, label: 'Revenus récurrents',  sub: 'Chaque mois tant que vous recrutez', color: 'bg-blue-50 text-blue-700' },
            { icon: Users,      label: "Toute l'Afrique",     sub: 'Recrutez partout sur le continent',  color: 'bg-violet-50 text-violet-700' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="font-black text-slate-950">{label}</p>
                <p className="text-xs font-semibold text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Application form */}
      <section className="mx-auto max-w-xl px-5 pb-24">
        {done ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-8 py-12 text-center shadow-xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/30">
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-950">Demande envoyée !</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              Merci pour votre candidature. Vous serez contacté sous{' '}
              <strong className="text-slate-950">24h via WhatsApp</strong> pour la suite de votre inscription.
            </p>
            <div className="mt-6 rounded-2xl bg-white p-4">
              <p className="text-sm font-bold text-slate-500">
                En attendant, découvrez CaissePro →{' '}
                <Link href="/" className="font-black text-emerald-700 hover:underline">
                  caissepro.app
                </Link>
              </p>
            </div>
            <Link
              href="/careers"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:underline"
            >
              En savoir plus sur le programme <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-black text-slate-950">Candidature agent</h2>
            <p className="mt-1.5 text-sm font-semibold text-slate-500">
              Remplissez le formulaire ci-dessous. Gratuit, sans engagement.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Full name */}
              <div>
                <label className="text-sm font-black text-slate-700">Nom complet *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  placeholder="Amadou Diallo"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-black text-slate-700">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="votre@email.com"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Phone + WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-black text-slate-700">Téléphone *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-slate-700">WhatsApp</label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => set('whatsapp', e.target.value)}
                    placeholder="Si différent"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* City + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-black text-slate-700">Ville</label>
                  <input
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Dakar"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-slate-700">Pays *</label>
                  <select
                    required
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {AFRICAN_COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Envoi en cours...
                  </span>
                ) : (
                  'Envoyer ma candidature'
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs font-semibold text-slate-400">
              Déjà agent ?{' '}
              <Link href="/agents/login" className="font-black text-emerald-700 hover:underline">
                Se connecter
              </Link>
              {' '}·{' '}
              <Link href="/careers" className="hover:text-slate-600">
                En savoir plus
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">C</div>
            <span className="font-black text-slate-950">CaissePro</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-5 text-sm font-bold text-slate-400">
            <Link href="/" className="hover:text-slate-700">Accueil</Link>
            <Link href="/careers" className="hover:text-slate-700">Carrières</Link>
            <Link href="/agents/login" className="hover:text-slate-700">Espace agent</Link>
            <Link href="/legal" className="hover:text-slate-700">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
