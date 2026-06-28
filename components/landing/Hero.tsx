import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, MessageCircle, Play } from 'lucide-react'
import Reveal from '@/components/Reveal'

const TRUST = ['Sans engagement', '0% de commission', 'Mode hors-ligne']
const BARS = ['40%', '65%', '50%', '80%', '60%', '92%', '74%']

export default function Hero() {
  return (
    <header className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-10 px-[18px] py-12 md:gap-[60px] md:px-9 md:py-[90px]">
      {/* ── Copy ── */}
      <Reveal className="min-w-[300px] flex-1 basis-[460px]">
        <div className="mb-[26px] inline-flex items-center gap-[9px] rounded-full border border-[#16a34a]/30 bg-[#16a34a]/[0.12] px-3.5 py-[7px]">
          <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e]" />
          <span className="text-[0.78rem] font-bold tracking-[0.04em] text-[#7fe6a3]">
            La caisse #1 de l&apos;Afrique de l&apos;Ouest
          </span>
        </div>

        <h1 className="font-sora text-5xl font-black leading-[1.03] tracking-[-0.03em] text-[#f2f5f3] md:text-7xl">
          La caisse enregistreuse{' '}
          <span className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] bg-clip-text text-transparent">
            intelligente
          </span>{' '}
          de l&apos;Afrique
        </h1>

        <p className="mb-[34px] mt-[22px] max-w-[540px] text-[1.05rem] leading-[1.65] text-[#9fb0a8] md:text-[1.25rem]">
          Vendez, encaissez et gérez votre stock depuis votre{' '}
          <strong className="font-bold text-[#e7ece9]">tablette, ordinateur ou téléphone</strong>. Mobile Money à 0%
          de commission, reçus WhatsApp et boutique en ligne gratuite.
        </p>

        <div className="mb-[30px] flex flex-wrap gap-3.5">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#16a34a] px-7 py-4 text-[1.02rem] font-bold text-white shadow-[0_14px_36px_rgba(22,163,74,.42)] transition-colors hover:bg-[#15803d]"
          >
            Commencer gratuitement <ArrowRight size={19} />
          </Link>
          <Link
            href="/shop/demo"
            className="inline-flex items-center gap-[11px] rounded-2xl border border-white/[0.12] bg-white/[0.05] px-6 py-4 text-[1.02rem] font-bold text-[#f2f5f3] transition-colors hover:bg-white/[0.1]"
          >
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/[0.1]">
              <Play size={15} />
            </span>
            Voir la démo
          </Link>
        </div>

        <div className="flex flex-wrap gap-x-[22px] gap-y-3 text-[0.9rem] font-semibold text-[#8a9a92]">
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-[7px]">
              <CheckCircle2 size={17} className="text-[#22c55e]" /> {t}
            </span>
          ))}
        </div>
      </Reveal>

      {/* ── Visual cluster ── */}
      <Reveal delay={120} className="flex min-w-[300px] flex-1 basis-[380px] justify-center">
        <div className="relative w-[clamp(260px,30vw,330px)]">
          {/* glow */}
          <div className="absolute -inset-x-[22%] -inset-y-[16%] animate-pulse-glow rounded-full bg-[radial-gradient(closest-side,rgba(22,163,74,.42),transparent_72%)] blur-[14px]" />

          {/* phone */}
          <div className="animate-floaty relative rounded-[42px] bg-gradient-to-b from-[#191d1b] to-[#0a0c0b] p-[9px] shadow-[0_40px_90px_rgba(0,0,0,.6),0_0_0_1px_rgba(255,255,255,.05),inset_0_0_0_1px_rgba(255,255,255,.04)]">
            <div className="relative aspect-[1144/1830] overflow-hidden rounded-[34px] bg-[#0d1310]">
              <Image
                src="/check-out.png"
                alt="CaissePro — encaissement, paiement Wave et reçu WhatsApp"
                fill
                priority
                sizes="(max-width: 768px) 80vw, 330px"
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* fragment: Wave payment (top-right) */}
          <div className="animate-floaty2 absolute -right-[30%] top-[8%] hidden w-[230px] max-w-[60vw] rounded-[20px] border border-white/10 bg-[#101613]/[0.82] px-4 py-[15px] shadow-[0_20px_50px_rgba(0,0,0,.5)] backdrop-blur-md sm:block">
            <div className="flex items-center gap-[11px]">
              <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#1a8cff] font-sora text-[0.7rem] font-black text-white">
                Wave
              </div>
              <div className="flex-1">
                <div className="text-[0.72rem] font-semibold text-[#8a9a92]">Paiement reçu</div>
                <div className="font-sora text-[1rem] font-black text-[#f2f5f3]">+12 500 FCFA</div>
              </div>
              <CheckCircle2 size={22} className="text-[#22c55e]" />
            </div>
          </div>

          {/* fragment: WhatsApp receipt (mid-left) */}
          <div className="animate-floaty-slow absolute -left-[32%] top-[46%] hidden w-[210px] max-w-[58vw] rounded-[18px] border border-white/10 bg-[#101613]/[0.82] px-[15px] py-[13px] shadow-[0_20px_50px_rgba(0,0,0,.5)] backdrop-blur-md sm:block">
            <div className="flex items-center gap-2.5">
              <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[#25D366] text-white">
                <MessageCircle size={18} />
              </div>
              <div>
                <div className="text-[0.86rem] font-bold text-[#f2f5f3]">Reçu envoyé</div>
                <div className="text-[0.72rem] font-semibold text-[#8a9a92]">sur WhatsApp · maintenant</div>
              </div>
            </div>
          </div>

          {/* fragment: sales sparkline (bottom-right) */}
          <div className="animate-floaty2-slow absolute -bottom-[6%] -right-[26%] hidden w-[200px] max-w-[56vw] rounded-[18px] border border-white/10 bg-[#101613]/[0.82] px-4 py-[15px] shadow-[0_20px_50px_rgba(0,0,0,.5)] backdrop-blur-md sm:block">
            <div className="mb-[9px] flex items-center justify-between">
              <span className="text-[0.72rem] font-semibold text-[#8a9a92]">Ventes du jour</span>
              <span className="text-[0.72rem] font-black text-[#22c55e]">+27%</span>
            </div>
            <div className="mb-2.5 font-sora text-[1.15rem] font-black text-[#f2f5f3]">125 000 FCFA</div>
            <div className="flex h-[30px] items-end gap-1">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  style={{ height: h }}
                  className="animate-bar-rise flex-1 rounded-[3px] bg-gradient-to-b from-[#22c55e] to-[#16a34a]"
                />
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </header>
  )
}
