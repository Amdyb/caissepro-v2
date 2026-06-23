'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // <-- FIX: use this repo's actual Supabase browser client
import { Delete, Check, Loader2, Banknote, Smartphone, ArrowRight, Plus } from 'lucide-react';

type PaymentMethod = 'especes' | 'wave' | 'orange_money' | 'free_money';
interface VenteRapideProps { businessId: string; cashierId: string; onComplete?: (amount: number) => void; dashboardHref?: string; }

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'especes', label: 'Espèces', icon: Banknote },
  { value: 'wave', label: 'Wave', icon: Smartphone },
  { value: 'orange_money', label: 'Orange Money', icon: Smartphone },
  { value: 'free_money', label: 'Free Money', icon: Smartphone },
];
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export default function VenteRapide({ businessId, cashierId, onComplete, dashboardHref = '/dashboard' }: VenteRapideProps) {
  const [digits, setDigits] = useState('');
  const [label, setLabel] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('especes');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: number; firstEver: boolean } | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [isFirstEver, setIsFirstEver] = useState(false);
  const amount = digits ? parseInt(digits, 10) : 0;

  const loadContext = useCallback(async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data: today } = await supabase.from('sales').select('total').eq('business_id', businessId).gte('created_at', start.toISOString());
    setTodayTotal((today ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0));
    const { count } = await supabase.from('sales').select('id', { count: 'exact', head: true }).eq('business_id', businessId);
    setIsFirstEver((count ?? 0) === 0);
  }, [businessId]);
  useEffect(() => { loadContext(); }, [loadContext]);

  const press = (d: string) => { setError(null); setDigits((cur) => { if (d === '00' && !cur) return cur; const next = (cur + d).replace(/^0+(?=\d)/, ''); return next.length > 12 ? cur : next; }); };
  const backspace = () => setDigits((c) => c.slice(0, -1));
  const clear = () => setDigits('');

  const save = async () => {
    if (amount <= 0 || saving) return;
    setSaving(true); setError(null);
    const firstEver = isFirstEver;
    try {
      const { data: sale, error: saleErr } = await supabase.from('sales').insert({
        business_id: businessId, cashier_id: cashierId, total: amount, paid_amount: amount,
        remaining_amount: 0, payment_method: method, status: 'completed', notes: 'Vente rapide',
      }).select('id').single();
      if (saleErr || !sale) throw saleErr ?? new Error('insert failed');
      await supabase.from('sale_items').insert({
        sale_id: sale.id, product_id: null, product_name: label.trim() || 'Vente rapide',
        quantity: 1, price: amount, unit_price: amount, total: amount,
      });
      setDone({ amount, firstEver }); setTodayTotal((t) => t + amount); setIsFirstEver(false); onComplete?.(amount);
    } catch (e) { console.error(e); setError("La vente n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez."); }
    finally { setSaving(false); }
  };
  const newSale = () => { setDone(null); setDigits(''); setLabel(''); setMethod('especes'); };

  if (done) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"><Check className="h-10 w-10 text-emerald-600" strokeWidth={3} /></div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">{done.firstEver ? 'Bravo, votre première vente !' : 'Vente enregistrée'}</h2>
        <p className="mt-2 text-lg font-semibold text-emerald-600">{fmt(done.amount)} FCFA</p>
        {done.firstEver && <p className="mt-3 text-sm text-gray-500">Vous venez de démarrer sur CaissePro. Continuez : chaque vente est suivie automatiquement.</p>}
        <div className="mt-6 w-full rounded-xl bg-gray-50 px-4 py-3"><span className="text-sm text-gray-500">Total du jour</span><p className="text-xl font-bold text-gray-900">{fmt(todayTotal)} FCFA</p></div>
        <button onClick={newSale} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white active:bg-emerald-700"><Plus className="h-5 w-5" /> Nouvelle vente</button>
        <a href={dashboardHref} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-4 text-base font-semibold text-gray-700 active:bg-gray-50">Voir mon tableau de bord <ArrowRight className="h-5 w-5" /></a>
      </div>
    );
  }

  const keys = ['1','2','3','4','5','6','7','8','9','00','0','del'];
  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col px-5 pb-6">
      <div className="pt-6"><h1 className="text-xl font-bold text-gray-900">Vente rapide</h1><p className="text-sm text-gray-500">Encaissez en 30 secondes, sans configurer votre catalogue.</p></div>
      <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-7 text-center"><span className="text-sm text-gray-400">Montant</span><div className="mt-1 text-4xl font-bold tracking-tight text-gray-900">{fmt(amount)} <span className="text-2xl font-semibold text-gray-400">FCFA</span></div></div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Article (optionnel)" className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-emerald-500" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {PAYMENT_OPTIONS.map(({ value, label: l, icon: Icon }) => { const active = method === value; return (
          <button key={value} onClick={() => setMethod(value)} className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 active:bg-gray-50'}`}><Icon className="h-5 w-5" />{l}</button>
        ); })}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {keys.map((k) => k === 'del' ? (
          <button key={k} onClick={backspace} onDoubleClick={clear} className="flex items-center justify-center rounded-xl bg-gray-100 py-5 text-gray-700 active:bg-gray-200" aria-label="Effacer"><Delete className="h-6 w-6" /></button>
        ) : (
          <button key={k} onClick={() => press(k)} className="rounded-xl bg-gray-100 py-5 text-2xl font-semibold text-gray-900 active:bg-gray-200">{k}</button>
        ))}
      </div>
      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      <button onClick={save} disabled={amount <= 0 || saving} className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-bold text-white transition active:bg-emerald-700 disabled:bg-gray-300">
        {saving ? (<><Loader2 className="h-5 w-5 animate-spin" /> Enregistrement…</>) : (<><Check className="h-5 w-5" /> Enregistrer la vente</>)}
      </button>
    </div>
  );
}
