import Image from 'next/image'
import { memo } from 'react'

type Product = {
  name: string
  price: string
  category: string
  image: string
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-44 w-full bg-slate-100">
        <Image src={product.image} alt={product.name} fill className="object-cover" />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{product.category}</p>
        <h3 className="mt-1 text-base font-bold text-slate-900">{product.name}</h3>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-black text-slate-950">{product.price}</span>
          <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700">Ajouter</button>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
