'use client'

import AppShell from '@/components/AppShell'
import Link from 'next/link'
import {
  BarChart3,
  CalendarClock,
  HandCoins,
  Package,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet
} from 'lucide-react'

export default function DashboardPage() {
  const cards = [
    { title: 'Caisse POS', text: 'Ouvrir la caisse et vendre.', href: '/pos', icon: ShoppingCart, primary: true },
    { title: 'Produits', text: 'Inventaire, photos, prix et stock.', href: '/products', icon: Package },
    { title: 'Ventes', text: 'Historique, reçus et factures.', href: '/sales', icon: ReceiptText },
    { title: 'Clients', text: 'Fidélité, contacts et achats.', href: '/customers', icon: Users },
    { title: 'Client Doit', text: 'Dettes clients et remboursements.', href: '/debts', icon: HandCoins },
    { title: 'Fournisseurs', text: 'Contacts et soldes fournisseurs.', href: '/suppliers', icon: Truck },
    { title: 'Achats / Réassort', text: 'Réapprovisionnement du stock.', href: '/purchases', icon: PackagePlus },
    { title: 'Dépenses', text: 'Charges et profits réels.', href: '/expenses', icon: Wallet },
    { title: 'Analytics', text: 'Performance commerciale.', href: '/analytics', icon: BarChart3 },
    { title: 'Ouverture caisse', text: 'Cash journalier et fermeture.', href: '/register-shifts', icon: CalendarClock },
    { title: 'Paramètres', text: 'Branding, logo et informations.', href: '/settings', icon: Settings }
  ]

  return (
    <AppShell
      title="Centre de contrôle"
      subtitle="Tous les modules CaissePro dans une interface premium."
      action={
        <Link
          href="/pos"
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Ouvrir la caisse
        </Link>
      }
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Aujourd’hui</p>
            <p className="mt-2 text-3xl font-black text-slate-950">0 CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Cette semaine</p>
            <p className="mt-2 text-3xl font-black text-slate-950">0 CFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Stock bas</p>
            <p className="mt-2 text-3xl font-black text-amber-600">0</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Client Doit</p>
            <p className="mt-2 text-3xl font-black text-red-600">0 CFA</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  card.primary
                    ? 'border-emerald-200 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-950'
                }`}
              >
                <div className={`mb-6 inline-flex rounded-2xl p-4 ${
                  card.primary ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <Icon size={26} />
                </div>

                <h3 className="text-2xl font-black">{card.title}</h3>
                <p className={`mt-2 text-sm font-semibold ${
                  card.primary ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {card.text}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
