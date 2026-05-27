import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  WifiOff,
} from 'lucide-react'

const DEMO_PRODUCTS = [
  { name: 'Boubou Brode Homme',    price: '25 000', image: 'https://images.unsplash.com/photo-1696962678565-bee84e6b9cb6?w=400&q=80' },
  { name: 'Robe Wax Femme',         price: '18 000', image: 'https://images.unsplash.com/photo-1681545290284-679e6291c440?w=400&q=80' },
  { name: 'Tissu Bazin Riche',      price: '35 000', image: 'https://images.unsplash.com/photo-1552710307-537199cd41c0?w=400&q=80' },
  { name: 'Sandales Cuir Teinte',   price: '12 000', image: 'https://images.unsplash.com/photo-1645944235766-54aade0e09bf?w=400&q=80' },
  { name: 'Sac Raphia Tresse',      price: '8 500',  image: 'https://images.unsplash.com/photo-1688241319063-8668606f2fd1?w=400&q=80' },
  { name: 'Parfum Oud Thiouraye',   price: '15 000', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80' },
  { name: 'Collier Wax Perles',     price: '6 500',  image: 'https://images.unsplash.com/photo-1757140448494-ad45016d456a?w=400&q=80' },
  { name: 'Caftan Femme Brode',     price: '22 000', image: 'https://images.unsplash.com/photo-1757140447782-8503452b2204?w=400&q=80' },
]

const STATS = [
  { value: '8',         label: 'Produits en ligne',     icon: Package },
  { value: 'WhatsApp',  label: 'Reçus automatiques',    icon: MessageCircle },
  { value: 'Boutique',  label: 'En ligne publique',     icon: Store },
  { value: 'Offline',   label: 'Mode hors ligne',       icon: WifiOff },
]

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">C</div>
            <span className="text-xl font-black text-slate-950">CaissePro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/register" className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">
              Creer ma boutique
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50/60 to-white px-5 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
            <Sparkles size={14} /> Boutique demo — Dakar Style
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            Voici ce que CaissePro<br />
            <span className="text-emerald-600">peut faire pour vous</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-semibold text-slate-500">
            Explorez la boutique en ligne et la caisse de demonstration de "Boutique Dakar Style" — une vraie boutique de mode africaine.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/shop/demo"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <Store size={18} /> Voir la boutique en ligne
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-700 hover:bg-slate-50"
            >
              Creer ma boutique <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <Icon className="mx-auto text-emerald-600" size={22} />
              <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product grid preview */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">CATALOGUE</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">8 produits en boutique</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Mode et accessoires africains authentiques</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {DEMO_PRODUCTS.map((p) => (
            <div key={p.name} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
              <div className="aspect-square overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-sm font-black text-slate-950 leading-tight">{p.name}</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">{p.price} CFA</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/shop/demo"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 font-black text-white hover:bg-slate-800"
          >
            <ShoppingBag size={18} /> Ouvrir la boutique complete
          </Link>
        </div>
      </section>

      {/* Features showcase */}
      <section className="bg-slate-950 px-5 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">CE QUE VOUS OBTENEZ</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Tout ca, pour votre boutique aussi</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Boutique en ligne publique',   desc: 'Partagez votre lien et vos clients peuvent commander directement depuis leur telephone.' },
              { title: 'Reçus WhatsApp automatiques',  desc: 'Chaque vente envoie automatiquement un reçu au client sur WhatsApp. Zero effort.' },
              { title: 'Caisse POS mobile',             desc: 'Vendez rapidement depuis votre telephone. Ajoutez des produits, encaissez, imprimez.' },
              { title: 'Gestion de stock en temps reel', desc: 'Votre stock se met a jour a chaque vente. Recevez des alertes quand il est bas.' },
              { title: 'Mode hors ligne',               desc: 'Pas de connexion ? CaissePro continue de fonctionner. Synchronisation automatique.' },
              { title: 'Rapports et statistiques',      desc: 'Suivez vos ventes, produits les plus vendus et revenus depuis votre tableau de bord.' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18} />
                <div>
                  <p className="font-black text-white">{title}</p>
                  <p className="mt-1 text-sm font-semibold text-white/60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 text-center">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] bg-emerald-600 px-8 py-14 shadow-2xl shadow-emerald-600/20">
          <Sparkles className="mx-auto text-white/70" size={36} />
          <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">
            Pret a lancer votre boutique ?
          </h2>
          <p className="mt-3 text-base font-semibold text-white/70">
            Creer votre boutique en 2 minutes. Gratuit pour commencer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-black text-emerald-700 shadow-xl hover:bg-emerald-50"
            >
              Creer ma boutique gratuitement <ArrowRight size={18} />
            </Link>
            <Link
              href="/shop/demo"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-8 py-4 text-base font-black text-white hover:bg-white/10"
            >
              <Store size={18} /> Voir la demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-5 py-8 text-center">
        <p className="text-xs font-semibold text-slate-400">
          © {new Date().getFullYear()} CaissePro par Amdy Labs ·{' '}
          <Link href="/" className="hover:text-slate-600">Accueil</Link>
          {' · '}
          <Link href="/legal" className="hover:text-slate-600">Mentions legales</Link>
        </p>
      </footer>
    </main>
  )
}
