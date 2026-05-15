import { Store } from 'lucide-react'

export default function MerchantBrandHero({ business }: { business: any }) {
  if (!business) return null

  return (
    <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div
        className="h-48 bg-slate-950"
        style={{
          backgroundColor: business.secondary_color || '#0f172a',
          backgroundImage: business.banner_url ? `url(${business.banner_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="relative px-6 pb-6 pt-20">
        <div className="absolute -top-16 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-xl">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name || 'Logo'} className="h-full w-full object-contain" />
          ) : (
            <Store size={54} className="text-slate-400" />
          )}
        </div>
        <h2 className="text-4xl font-black text-slate-950">{business.name || 'Votre boutique'}</h2>
        <p className="mt-2 text-lg font-semibold text-slate-500">{business.slogan || 'Bienvenue sur votre espace commerce'}</p>
        <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
          {business.business_type || 'retail'}
        </div>
      </div>
    </div>
  )
}
