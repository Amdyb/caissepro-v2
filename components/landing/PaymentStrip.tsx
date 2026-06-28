const PAIEMENTS = [
  { name: 'Wave', color: '#1a8cff' },
  { name: 'Orange Money', color: '#ff7900' },
  { name: 'PayDunya', color: '#22c55e' },
  { name: 'Visa', color: '#1a1f71' },
  { name: 'Mastercard', color: '#eb001b' },
]

export default function PaymentStrip() {
  return (
    <div className="mx-auto max-w-[1240px] px-[18px] pb-12 pt-2 md:px-9 md:pb-16">
      <p className="mb-5 text-center text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[#6f7e77]">
        Encaissez par tous les moyens de paiement
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {PAIEMENTS.map((p) => (
          <div
            key={p.name}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-[18px] py-2.5"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[0.95rem] font-bold text-[#d8e0dc]">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
