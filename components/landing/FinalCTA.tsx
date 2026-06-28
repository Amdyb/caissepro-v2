import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Reveal from '@/components/Reveal'

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1100px] px-[18px] py-12 pb-16 md:px-9 md:py-20 md:pb-[100px]">
      <Reveal>
        <div className="relative overflow-hidden rounded-[40px] border border-[#22c55e]/[0.28] bg-gradient-to-br from-[#16a34a]/[0.22] to-[#101613]/[0.85] p-10 text-center md:p-[72px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,rgba(34,197,94,.25),transparent_70%)]" />
          <div className="relative">
            <h2 className="mb-[18px] font-sora text-4xl font-black leading-[1.05] tracking-[-0.02em] text-[#f2f5f3] md:text-[3.5rem]">
              Prêt à moderniser votre commerce&nbsp;?
            </h2>
            <p className="mx-auto mb-8 max-w-[520px] text-[1.15rem] leading-[1.6] text-[#b7c2bc]">
              Rejoignez les commerçants d&apos;Afrique qui vendent plus, plus vite, avec CaissePro. Gratuit pour
              commencer.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-[11px] rounded-[18px] bg-[#16a34a] px-[34px] py-[18px] text-[1.08rem] font-bold text-white shadow-[0_16px_40px_rgba(22,163,74,.5)] transition-colors hover:bg-[#15803d]"
            >
              Commencer gratuitement <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
