import Image from 'next/image'
import Link from 'next/link'

const SUPPORT_WHATSAPP = 'https://wa.me/221784581111'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#070b09]/60">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-9 px-[18px] pb-[30px] pt-10 md:px-9 md:pt-16">
        <div className="max-w-[340px] flex-1 basis-[280px]">
          <div className="mb-4 flex items-center gap-[11px]">
            <span className="grid h-[38px] w-[38px] place-items-center overflow-hidden rounded-[11px] bg-white shadow-[0_0_0_1px_rgba(255,255,255,.1)]">
              <Image src="/logo-mark.png" alt="CaissePro" width={38} height={38} className="h-full w-full object-cover" />
            </span>
            <span className="font-sora text-[1.2rem] font-black text-[#f2f5f3]">
              Caisse<span className="text-[#22c55e]">Pro</span>
            </span>
          </div>
          <p className="text-[0.92rem] leading-[1.6] text-[#8a9a92]">
            La caisse enregistreuse intelligente de l&apos;Afrique. Vendez, encaissez et grandissez.
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          <div>
            <div className="mb-3.5 text-[0.82rem] font-black uppercase tracking-[0.1em] text-[#6f7e77]">Produit</div>
            <div className="flex flex-col gap-2.5">
              <a href="#fonctionnalites" className="text-[0.92rem] text-[#b0bcb6] transition-colors hover:text-white">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="text-[0.92rem] text-[#b0bcb6] transition-colors hover:text-white">
                Tarifs
              </a>
              <a href="#metiers" className="text-[0.92rem] text-[#b0bcb6] transition-colors hover:text-white">
                Métiers
              </a>
            </div>
          </div>
          <div>
            <div className="mb-3.5 text-[0.82rem] font-black uppercase tracking-[0.1em] text-[#6f7e77]">Entreprise</div>
            <div className="flex flex-col gap-2.5">
              <a href="#agent" className="text-[0.92rem] text-[#b0bcb6] transition-colors hover:text-white">
                Programme Agent
              </a>
              <Link href="/help" className="text-[0.92rem] text-[#b0bcb6] transition-colors hover:text-white">
                Support
              </Link>
              <a
                href={SUPPORT_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.92rem] text-[#b0bcb6] transition-colors hover:text-white"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3.5 border-t border-white/[0.06] px-[18px] py-[22px] md:px-9">
        <span className="text-[0.85rem] text-[#6f7e77]">© 2026 CaissePro. Tous droits réservés.</span>
        <span className="inline-flex items-center gap-2 text-[0.85rem] font-bold text-[#8a9a92]">
          Propulsé par <span className="tracking-[0.04em] text-[#22c55e]">AMDY LABS</span>
        </span>
      </div>
    </footer>
  )
}
