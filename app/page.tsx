'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          
          <div className="flex items-center gap-3">
            <Image
              src="/caissepro-logo.png"
              alt="CaissePro Logo"
              width={64}
              height={64}
              priority
              className="h-12 w-12 rounded-2xl object-cover"
            />

            <div>
              <p className="text-lg font-black text-slate-950">
                CaissePro
              </p>

              <p className="text-xs font-medium text-slate-500">
                POS & commerce pour l’Afrique
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Fonctionnalités
            </a>

            <a
              href="#demo"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Démo
            </a>

            <a
              href="#pricing"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Tarifs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Connexion
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
            Gratuit pour commencer • CFA ready
          </div>

          <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
            Gérez votre boutique plus simplement.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            CaissePro aide les commerces en Afrique de l’Ouest à gérer la caisse,
            le stock, les vendeurs, les rapports et une boutique en ligne partageable.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="rounded-2xl bg-brand-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700"
            >
              Essayer gratuitement
            </Link>

            <a
              href="#demo"
              className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-base font-black text-slate-700 hover:bg-slate-100"
            >
              Voir la démo
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-6 text-sm font-semibold text-slate-500">
            <div>✓ POS simple</div>
            <div>✓ Stock en temps réel</div>
            <div>✓ Multi-utilisateurs</div>
            <div>✓ Paiements Mobile Money</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200">
          
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Aujourd’hui</p>

                <h2 className="mt-2 text-5xl font-black">
                  185 000 CFA
                </h2>
              </div>

              <div className="rounded-2xl bg-brand-600/20 p-4">
                📊
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-400">Ventes</p>

                <p className="mt-2 text-3xl font-black">
                  42
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-400">Stock bas</p>

                <p className="mt-2 text-3xl font-black">
                  7
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-400">Clients</p>

                <p className="mt-2 text-3xl font-black">
                  18
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-white p-6 text-slate-950">
              
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black">
                  Caisse rapide
                </h3>

                <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                  Ouverte
                </span>
              </div>

              <div className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    T-shirt Premium
                  </p>

                  <p className="font-black">
                    7 500 CFA
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    Écouteurs Bluetooth
                  </p>

                  <p className="font-black">
                    15 000 CFA
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    Parfum Signature
                  </p>

                  <p className="font-black">
                    10 000 CFA
                  </p>
                </div>
              </div>

              <button className="mt-8 w-full rounded-2xl bg-brand-600 py-4 text-lg font-black text-white hover:bg-brand-700">
                Encaisser
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
