export default function CaisseProLogo({ small = false }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-${small ? '2' : '3'}`}>
      <img
        src="/icons/caissepro-icon.svg"
        alt="CaissePro"
        className={`${small ? 'h-10 w-10' : 'h-14 w-14'} rounded-2xl object-cover shadow-xl shadow-emerald-600/10`}
      />

      <div>
        <p className={`${small ? 'text-lg' : 'text-2xl'} font-black tracking-tight text-slate-950`}>
          Caisse<span className="text-emerald-600">Pro</span>
        </p>

        {!small && (
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Commerce OS Africa
          </p>
        )}
      </div>
    </div>
  )
}
