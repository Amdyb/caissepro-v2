import Link from 'next/link'
import { ArrowRight, Handshake } from 'lucide-react'
import Reveal from '@/components/Reveal'

export default function AgentProgram() {
  return (
    <section id="agent" className="mx-auto max-w-[1240px] px-[18px] py-12 md:px-9 md:py-20">
      <Reveal>
        <div className="flex flex-wrap items-center gap-8 rounded-[36px] border border-[#8b5cf6]/25 bg-gradient-to-br from-[#8b5cf6]/[0.16] to-[#101613]/75 p-7 md:p-14">
          <div className="flex-1 basis-[320px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/[0.32] bg-[#8b5cf6]/[0.18] px-3.5 py-1.5">
              <Handshake size={16} className="text-[#a78bfa]" />
              <span className="text-[0.76rem] font-black tracking-[0.04em] text-[#c4b5fd]">PROGRAMME AGENT</span>
            </div>
            <h2 className="mb-3.5 font-sora text-3xl font-black leading-[1.08] tracking-[-0.02em] text-[#f2f5f3] md:text-[2.7rem]">
              Gagnez en équipant les commerçants de votre quartier
            </h2>
            <p className="mb-[26px] max-w-[480px] text-[1.05rem] leading-[1.6] text-[#b0bcb6]">
              Devenez agent revendeur CaissePro. Installez la caisse chez les commerçants autour de vous et touchez des
              revenus récurrents chaque mois.
            </p>
            <Link
              href="/agents"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#8b5cf6] px-[26px] py-[15px] text-[1rem] font-bold text-white shadow-[0_14px_34px_rgba(139,92,246,.4)] transition-colors hover:bg-[#7c3aed]"
            >
              Devenir agent <ArrowRight size={18} />
            </Link>
          </div>

          <div className="min-w-[220px] flex-1 basis-[240px]">
            <div className="rounded-3xl border border-white/10 bg-[#0c100e]/70 p-[30px] text-center">
              <div className="mb-2 text-[0.85rem] font-bold text-[#8a9a92]">Revenus potentiels</div>
              <div className="mb-1.5 flex items-baseline justify-center gap-1.5">
                <span className="font-sora text-[2.4rem] font-black leading-none text-[#a78bfa] md:text-[3.4rem]">
                  50 000
                </span>
                <span className="font-bold text-[#9fb0a8]">FCFA</span>
              </div>
              <div className="text-[0.85rem] font-semibold text-[#8a9a92]">par mois et plus</div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
