export default function CaisseProLogo({ small = false }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-${small ? '2' : '3'}`}>
      <div className={`relative flex ${small ? 'h-10 w-10' : 'h-14 w-14'} items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.35),transparent_55%)]" />
        <span className={`${small ? 'text-xl' : 'text-3xl'} relative font-black tracking-tight`}>C</span>
      </div>

      <div>
        <p className={`${small ? 'text-lg' : 'text-2xl'} font-black tracking-tight text-slate-950`}>
          Caisse<span className="text-emerald-600">Pro</span>
        </p>
        {!small && <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Commerce OS Africa</p>}
      </div>
    </div>
  )
}
