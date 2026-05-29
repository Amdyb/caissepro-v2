import Link from 'next/link'
import { Store } from 'lucide-react'

export default function ShopNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white">
      <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <Store className="text-white/50" size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Boutique introuvable</h1>
          <p className="mt-3 text-sm font-semibold text-white/50">
            Cette boutique n&apos;existe pas ou le lien est incorrect.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
