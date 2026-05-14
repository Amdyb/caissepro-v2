'use client'

import { Crown, Gift, Sparkles, Users } from 'lucide-react'

export default function FoundingBetaBanner() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-[#071B2F] via-slate-900 to-emerald-950 p-7 text-white shadow-2xl">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-300 backdrop-blur">
            <Sparkles size={14} />
            Programme Fondateur Beta
          </div>

          <h2 className="text-4xl font-black tracking-tight">
            Toutes les fonctionnalités Business sont débloquées.
          </h2>

          <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-white/75">
            Vous faites partie des premiers commerçants qui construisent
            l’avenir du commerce africain avec CaissePro.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
                Beta restante
              </p>
              <p className="mt-1 text-3xl font-black">27 jours</p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
                Invitations
              </p>
              <p className="mt-1 text-3xl font-black">3 / 5</p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
                Statut
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black">
                <Crown className="text-amber-400" size={18} />
                Founding Member
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur lg:w-[320px]">
          <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4">
            <Gift className="mt-1 text-amber-300" size={22} />
            <div>
              <p className="font-black">Invitez 5 commerçants</p>
              <p className="mt-1 text-sm font-semibold text-white/70">
                Gagnez 30 jours Business supplémentaires.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4">
            <Users className="mt-1 text-emerald-300" size={22} />
            <div>
              <p className="font-black">Accès premium complet</p>
              <p className="mt-1 text-sm font-semibold text-white/70">
                Rapports, automatisations et boutique avancée inclus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
