import { Star } from 'lucide-react'
import Reveal from '@/components/Reveal'

// Représentatifs — à remplacer par de vrais témoignages avant le lancement.
const TEMOIGNAGES = [
  {
    initial: 'F',
    name: 'Fatou Ndiaye',
    role: 'Boutique · Dakar',
    quote:
      'Avant je notais tout sur un cahier. Maintenant je vois mes ventes en direct et mes clients reçoivent leur reçu sur WhatsApp.',
  },
  {
    initial: 'I',
    name: 'Ibrahima Sow',
    role: 'Restaurant · Thiès',
    quote:
      "Wave et Orange Money intégrés à la caisse, sans commission. Ça change tout pour mon chiffre d'affaires.",
  },
  {
    initial: 'A',
    name: 'Awa Diallo',
    role: 'Pharmacie · Saint-Louis',
    quote: "La gestion de stock m'alerte avant la rupture. Je ne perds plus de ventes faute de produits.",
  },
]

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-[1240px] px-[18px] py-12 md:px-9 md:py-20">
      <Reveal>
        <div className="mx-auto mb-9 max-w-[600px] text-center md:mb-[50px]">
          <p className="mb-3.5 text-[0.8rem] font-black uppercase tracking-[0.16em] text-[#22c55e]">
            Ils nous font confiance
          </p>
          <h2 className="font-sora text-4xl font-black leading-[1.06] tracking-[-0.02em] text-[#f2f5f3] md:text-5xl">
            Les commerçants adoptent CaissePro
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        {TEMOIGNAGES.map((t, i) => (
          <Reveal key={t.name} delay={i * 80} className="h-full">
            <div className="h-full rounded-[26px] border border-white/[0.08] bg-[#101613]/60 p-7">
              <div className="mb-4 flex gap-[3px]">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} className="fill-[#fbbf24] text-[#fbbf24]" />
                ))}
              </div>
              <p className="mb-[22px] text-[1rem] leading-[1.6] text-[#dde4e0]">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-gradient-to-br from-[#16a34a] to-[#0f7a37] font-sora font-black text-white">
                  {t.initial}
                </div>
                <div>
                  <div className="text-[0.95rem] font-bold text-[#f2f5f3]">{t.name}</div>
                  <div className="text-[0.82rem] font-semibold text-[#8a9a92]">{t.role}</div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
