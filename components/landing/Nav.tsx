import Image from 'next/image'
import Link from 'next/link'

const LINKS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#metiers', label: 'Métiers' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#agent', label: 'Agents' },
]

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070b09]/[0.72] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-[18px] py-3.5 md:gap-[18px] md:px-9">
        {/* Brand */}
        <Link href="/" className="mr-auto flex items-center gap-[11px]">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(22,163,74,.28),0_0_0_1px_rgba(255,255,255,.1)]">
            <Image src="/logo-mark.png" alt="CaissePro" width={40} height={40} className="h-full w-full object-cover" />
          </span>
          <span className="font-sora text-[1.28rem] font-black tracking-[-0.02em] text-[#f2f5f3]">
            Caisse<span className="text-[#22c55e]">Pro</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-[26px] lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.95rem] font-semibold text-[#c4cec9] transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          className="hidden px-2 py-2 text-[0.95rem] font-bold text-[#e7ece9] transition-colors hover:text-white sm:inline-flex"
        >
          Connexion
        </Link>
        <Link
          href="/register"
          className="whitespace-nowrap rounded-xl bg-[#16a34a] px-[18px] py-[11px] text-[0.92rem] font-bold text-white shadow-[0_8px_22px_rgba(22,163,74,.4)] transition-colors hover:bg-[#15803d]"
        >
          Commencer
        </Link>
      </div>
    </nav>
  )
}
