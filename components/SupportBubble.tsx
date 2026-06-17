'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { HelpCircle, MessageCircle, X } from 'lucide-react'

const SUPPORT_WHATSAPP = '15863442378'
const SUPPORT_TEXT = "Bonjour, j'ai besoin d'aide avec CaissePro:"

// Routes where the bubble must NOT appear (public storefront).
const HIDDEN_PREFIXES = ['/shop/']

export default function SupportBubble() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const waUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(SUPPORT_TEXT)}`

  return (
    <div className="fixed bottom-5 right-5 z-[600] print:hidden">
      {open ? (
        <div className="w-72 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="text-sm font-black">Besoin d&apos;aide ?</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-1 text-white/80 hover:bg-white/10">
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            <p className="text-sm font-semibold text-slate-600">
              Problème de connexion ou autre question ? Notre équipe vous répond rapidement.
            </p>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              <MessageCircle size={16} /> Contacter le support sur WhatsApp
            </a>

            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <HelpCircle size={16} /> Voir la page d&apos;aide
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Support"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 transition hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
          <MessageCircle size={24} className="relative" />
        </button>
      )}
    </div>
  )
}
