import { BUSINESS_TYPE_CONFIGS } from '@/lib/businessTypes'
import Reveal from '@/components/Reveal'

export default function Metiers() {
  return (
    <section id="metiers" className="mx-auto max-w-[1240px] px-[18px] py-12 md:px-9 md:py-20">
      <Reveal>
        <div className="mx-auto mb-9 max-w-[640px] text-center md:mb-[52px]">
          <p className="mb-3.5 text-[0.8rem] font-black uppercase tracking-[0.16em] text-[#22c55e]">
            Pour chaque métier
          </p>
          <h2 className="font-sora text-4xl font-black leading-[1.06] tracking-[-0.02em] text-[#f2f5f3] md:text-5xl">
            Conçu pour votre activité
          </h2>
        </div>
      </Reveal>

      <Reveal>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {BUSINESS_TYPE_CONFIGS.map(({ key, icon: Icon, label }) => (
            <div
              key={key}
              className="rounded-[22px] border border-white/[0.07] bg-[#101613]/60 px-[18px] py-[22px] text-center"
            >
              <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-[14px] border border-[#22c55e]/20 bg-[#22c55e]/[0.1] text-[#22c55e]">
                <Icon size={24} />
              </div>
              <div className="text-[0.98rem] font-bold text-[#e2e8e4]">{label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
