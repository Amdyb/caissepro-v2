'use client'

import AppShell from '@/components/AppShell'
import { Copy, Gift, Send, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

function randomCode() {
  return `BETA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

export default function BetaInvitesPage() {
  const [code, setCode] = useState(randomCode())
  const inviteLink = useMemo(() => `https://caissepro.app/register?invite=${code}`, [code])

  const whatsappText = encodeURIComponent(
    `Salam 👋\n\nJe t’invite à tester CaissePro Beta Privée.\n\n🎁 30 jours Business gratuits\n✅ Boutique en ligne\n✅ POS\n✅ Rapports\n✅ Gestion clients\n\nInscription:\n${inviteLink}`
  )

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    alert('Copié')
  }

  return (
    <AppShell title="Invitations Beta" subtitle="Programme Fondateur CaissePro">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-[#071B2F] via-slate-900 to-emerald-950 p-8 text-white shadow-2xl">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-300">
                <Sparkles size={14} />
                Founding Beta Program
              </div>

              <h1 className="text-5xl font-black tracking-tight">
                Invitez des commerçants.
              </h1>

              <p className="mt-5 text-lg font-semibold leading-8 text-white/75">
                Offrez 30 jours Business gratuits et développez la communauté CaissePro.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur lg:w-[360px]">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                Code Beta
              </p>

              <div className="mt-3 rounded-2xl bg-black/20 p-4 text-xl font-black tracking-wider">
                {code}
              </div>

              <div className="mt-5 grid gap-3">
                <button onClick={() => setCode(randomCode())} className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black transition hover:bg-white/20">
                  Générer nouveau code
                </button>

                <button onClick={() => copy(inviteLink)} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700">
                  <Copy size={18} />
                  Copier le lien
                </button>

                <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-black text-white transition hover:bg-green-700">
                  <Send size={18} />
                  Envoyer WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Gift className="text-amber-500" size={30} />
            <h3 className="mt-4 text-2xl font-black">30 jours offerts</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Accès Business complet pendant la beta.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Sparkles className="text-emerald-600" size={30} />
            <h3 className="mt-4 text-2xl font-black">Fondateur Beta</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Les premiers utilisateurs obtiennent des avantages spéciaux.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Send className="text-sky-500" size={30} />
            <h3 className="mt-4 text-2xl font-black">Croissance virale</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Partage WhatsApp ultra simple pour les commerçants.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
