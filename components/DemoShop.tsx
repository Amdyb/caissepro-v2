import ProductCard from './ProductCard'

const products = [
  {
    name: 'T-shirt Premium Dakar',
    price: '7 500 CFA',
    category: 'Mode',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Sac élégant femme',
    price: '12 000 CFA',
    category: 'Accessoires',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Écouteurs Bluetooth',
    price: '15 000 CFA',
    category: 'Électronique',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Parfum Signature',
    price: '10 000 CFA',
    category: 'Beauté',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Montre moderne',
    price: '20 000 CFA',
    category: 'Accessoires',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Sneakers urbaines',
    price: '25 000 CFA',
    category: 'Chaussures',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80'
  }
]

export default function DemoShop() {
  return (
    <section id="demo" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-wide text-brand-600">Boutique démo</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Une vitrine partageable comme une vraie boutique en ligne</h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">Montrez vos produits, affichez les prix en CFA, recevez les commandes, puis suivez le stock dans le même système.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <strong className="text-slate-950">Boutique Démo Dakar</strong><br />Lien client: caissepro.app/boutique/demo
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.name} product={product} />)}
        </div>
      </div>
    </section>
  )
}
