import Image from 'next/image'
import {
  Bell,
  Boxes,
  Building2,
  Check,
  Globe,
  LifeBuoy,
  Lock,
  MessageCircle,
  ScanBarcode,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Users,
  WifiOff,
} from 'lucide-react'
import Reveal from '@/components/Reveal'

const EXTRAS = [
  { icon: ScanBarcode, name: 'Scanner code-barres' },
  { icon: Bell, name: 'Notifications push' },
  { icon: WifiOff, name: 'Mode hors-ligne (PWA)' },
  { icon: Building2, name: 'Multi-boutique' },
  { icon: Users, name: "Gestion d'équipe" },
  { icon: LifeBuoy, name: 'Support 7j/7' },
]

export default function Features() {
  return (
    <section id="fonctionnalites" className="mx-auto max-w-[1240px] px-[18px] py-16 md:px-9 md:py-[100px]">
      <Reveal>
        <div className="mx-auto mb-10 max-w-[680px] text-center md:mb-[60px]">
          <p className="mb-3.5 text-[0.8rem] font-black uppercase tracking-[0.16em] text-[#22c55e]">Tout-en-un</p>
          <h2 className="font-sora text-4xl font-black leading-[1.06] tracking-[-0.02em] text-[#f2f5f3] md:text-5xl">
            Tout votre commerce, dans une seule app
          </h2>
          <p className="mt-4 text-[1.1rem] leading-[1.6] text-[#9fb0a8]">
            De la vente au rapport, en passant par le stock et la boutique en ligne. Conçu pour les commerçants
            d&apos;Afrique.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        {/* POS — spans 2 */}
        <Reveal className="md:col-span-2">
          <div className="flex h-full flex-wrap items-center gap-6 overflow-hidden rounded-[2rem] border border-[#22c55e]/[0.22] bg-gradient-to-b from-[#16a34a]/[0.14] to-[#101613]/70 p-6 md:gap-10 md:p-9">
            <div className="relative z-[2] min-w-[240px] flex-1 basis-[280px]">
              <div className="mb-[18px] grid h-12 w-12 place-items-center rounded-[14px] border border-[#22c55e]/30 bg-[#22c55e]/[0.18] text-[#22c55e]">
                <ShoppingCart size={24} />
              </div>
              <h3 className="mb-2.5 font-sora text-[1.5rem] font-black text-[#f2f5f3]">Caisse &amp; encaissement rapide</h3>
              <p className="max-w-[440px] leading-[1.6] text-[#9fb0a8]">
                Recherchez vos produits, scannez les codes-barres et encaissez en quelques secondes. Alertes de stock
                en temps réel.
              </p>
            </div>
            {/* product grid phone */}
            <div className="relative z-[2] mx-auto shrink-0">
              <div className="absolute -inset-x-[16%] -inset-y-[12%] rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,.3),transparent_72%)] blur-[14px]" />
              <div className="relative w-[clamp(200px,22vw,250px)] rounded-[36px] bg-gradient-to-b from-[#191d1b] to-[#0a0c0b] p-2 shadow-[0_30px_60px_rgba(0,0,0,.5),0_0_0_1px_rgba(255,255,255,.05)]">
                <div className="relative aspect-[986/1830] overflow-hidden rounded-[29px] bg-[#0d1310]">
                  <Image
                    src="/produit-page.png"
                    alt="CaissePro — point de vente, grille de produits"
                    fill
                    sizes="250px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Mobile Money */}
        <Reveal>
          <div className="flex h-full flex-col rounded-[2rem] border border-white/[0.08] bg-[#101613]/60 p-6 md:p-[30px]">
            <div className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-[#1a8cff]/30 bg-[#1a8cff]/[0.16] text-[#4ba6ff]">
              <Smartphone size={23} />
            </div>
            <h3 className="mb-2 font-sora text-[1.25rem] font-black text-[#f2f5f3]">Mobile Money</h3>
            <p className="mb-4 text-[0.95rem] leading-[1.55] text-[#9fb0a8]">
              Wave, Orange Money &amp; PayDunya intégrés directement à la caisse.
            </p>
            <div className="mt-auto flex items-baseline gap-2">
              <span className="font-sora text-[2.6rem] font-black leading-none text-[#22c55e]">0%</span>
              <span className="text-[0.9rem] font-semibold text-[#9fb0a8]">de commission</span>
            </div>
          </div>
        </Reveal>

        {/* WhatsApp receipts */}
        <Reveal>
          <div className="h-full rounded-[2rem] border border-white/[0.08] bg-[#101613]/60 p-6 md:p-[30px]">
            <div className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-[#25D366]/30 bg-[#25D366]/[0.16] text-[#25D366]">
              <MessageCircle size={23} />
            </div>
            <h3 className="mb-2 font-sora text-[1.25rem] font-black text-[#f2f5f3]">Reçus WhatsApp</h3>
            <p className="text-[0.95rem] leading-[1.55] text-[#9fb0a8]">
              Envoyez automatiquement le reçu de chaque vente à vos clients sur WhatsApp.
            </p>
            <div className="mt-[18px] flex items-center gap-2.5 rounded-[14px] border border-white/[0.07] bg-[#0c100e] px-3 py-2.5">
              <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[#25D366] text-white">
                <Check size={16} />
              </div>
              <div>
                <div className="text-[0.78rem] font-bold text-[#f2f5f3]">Reçu N°000123</div>
                <div className="text-[0.68rem] text-[#8a9a92]">Livré · 9 300 FCFA</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Online store — spans 2 */}
        <Reveal className="md:col-span-2">
          <div className="flex h-full flex-wrap items-center gap-6 rounded-[2rem] border border-[#f97316]/20 bg-gradient-to-b from-[#f97316]/[0.1] to-[#101613]/70 p-6 md:p-8">
            <div className="flex-1 basis-[240px]">
              <div className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-[#f97316]/30 bg-[#f97316]/[0.16] text-[#fb923c]">
                <Globe size={23} />
              </div>
              <h3 className="mb-2 font-sora text-[1.4rem] font-black text-[#f2f5f3]">Boutique en ligne gratuite</h3>
              <p className="text-[0.98rem] leading-[1.55] text-[#9fb0a8]">
                Une vitrine en ligne façon Netflix pour vos produits — partagez le lien, vendez 24h/24.
              </p>
            </div>
            {/* browser frame */}
            <div className="min-w-[220px] flex-1 basis-[240px]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c100e] shadow-[0_24px_50px_rgba(0,0,0,.45)]">
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#141916] px-3.5 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-[7px] bg-white/[0.06] px-2.5 py-1 text-[0.66rem] font-semibold text-[#8a9a92]">
                    <Lock size={11} /> dakarvapes.caissepro.app
                  </div>
                </div>
                <div className="relative h-[340px] w-full">
                  <Image
                    src="/online-store.png"
                    alt="Boutique en ligne DakarVapes propulsée par CaissePro"
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stock */}
        <Reveal>
          <div className="h-full rounded-[2rem] border border-white/[0.08] bg-[#101613]/60 p-6 md:p-[30px]">
            <div className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-[#8b5cf6]/30 bg-[#8b5cf6]/[0.16] text-[#a78bfa]">
              <Boxes size={23} />
            </div>
            <h3 className="mb-2 font-sora text-[1.25rem] font-black text-[#f2f5f3]">Stock &amp; code-barres</h3>
            <p className="text-[0.95rem] leading-[1.55] text-[#9fb0a8]">
              Suivez vos quantités en temps réel et soyez alerté avant la rupture.
            </p>
          </div>
        </Reveal>

        {/* Coach IA — spans 2 */}
        <Reveal className="md:col-span-2">
          <div className="flex h-full flex-wrap items-center gap-5 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16a34a]/[0.16] to-[#8b5cf6]/[0.12] p-6 md:p-8">
            <div className="grid h-[54px] w-[54px] place-items-center rounded-2xl border border-[#22c55e]/35 bg-[#22c55e]/20 text-[#22c55e]">
              <Sparkles size={27} />
            </div>
            <div className="flex-1 basis-[220px]">
              <div className="mb-3 inline-flex items-center rounded-full border border-[#22c55e]/30 bg-[#22c55e]/[0.18] px-[11px] py-1">
                <span className="text-[0.66rem] font-black tracking-[0.06em] text-[#7fe6a3]">PREMIUM</span>
              </div>
              <h3 className="mb-2 font-sora text-[1.4rem] font-black text-[#f2f5f3]">Coach Entrepreneur IA</h3>
              <p className="text-[0.98rem] leading-[1.55] text-[#b7c2bc]">
                Un conseiller commercial intelligent qui analyse vos ventes et vous dit quoi commander, quand et à
                quel prix.
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* secondary feature chips */}
      <Reveal>
        <div className="mt-[18px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {EXTRAS.map(({ icon: Icon, name }) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-[20px] border border-white/[0.07] bg-white/[0.03] px-5 py-[18px]"
            >
              <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[#22c55e]/[0.12] text-[#22c55e]">
                <Icon size={19} />
              </div>
              <span className="text-[0.96rem] font-bold text-[#dde4e0]">{name}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
