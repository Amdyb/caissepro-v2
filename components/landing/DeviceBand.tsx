import Image from 'next/image'
import Reveal from '@/components/Reveal'

export default function DeviceBand() {
  return (
    <Reveal>
      <section className="mx-auto max-w-[1240px] px-[18px] py-12 text-center md:px-9 md:py-20">
        <p className="mb-3.5 text-[0.8rem] font-black uppercase tracking-[0.16em] text-[#22c55e]">
          Compatible partout
        </p>
        <h2 className="font-sora text-4xl font-black leading-[1.06] tracking-[-0.02em] text-[#f2f5f3] md:text-5xl">
          Une seule app, tous vos appareils
        </h2>
        <p className="mx-auto mt-4 max-w-[600px] text-[1.1rem] leading-[1.6] text-[#9fb0a8]">
          Tablette de comptoir, ordinateur, smartphone ou imprimante de reçus — CaissePro s&apos;adapte à tout votre
          matériel, en ligne comme hors-ligne.
        </p>

        <div className="relative mx-auto mt-7 max-w-[940px] md:mt-12">
          {/* glow */}
          <div className="absolute left-1/2 top-[46%] h-[62%] w-[78%] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow-slow rounded-full bg-[radial-gradient(closest-side,rgba(22,163,74,.32),transparent_72%)] blur-[22px]" />

          <div className="animate-floaty-slow relative aspect-[1010/595] w-full">
            <Image
              src="/device-family.png"
              alt="CaissePro sur tablette, ordinateur et imprimante de reçus"
              fill
              sizes="(max-width: 940px) 100vw, 940px"
              className="object-contain drop-shadow-[0_38px_55px_rgba(0,0,0,.5)]"
            />

            {/* lockup overlay — terminal screen */}
            <div className="absolute left-[42.2%] top-[6.8%] flex h-[10.8%] w-[17.6%] items-center justify-center rounded-[9px] bg-[#080b0a] shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
              <Image src="/lockup-badge.png" alt="CaissePro" width={160} height={40} className="w-[90%] object-contain" />
            </div>
            {/* lockup overlay — receipt printer */}
            <div className="absolute left-[76.3%] top-[84.2%] flex h-[8%] w-[13.4%] items-center justify-center rounded-[7px] bg-[#0b0907]">
              <Image src="/lockup-badge.png" alt="CaissePro" width={120} height={30} className="w-[90%] object-contain" />
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}
