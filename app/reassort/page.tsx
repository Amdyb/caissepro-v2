'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Boxes, MessageCircle, Package, PackagePlus, Search, TrendingDown, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const LOW_STOCK_THRESHOLD = 5

type Product = {
  id: string
  name: string
  stock: number | null
  sell_price: number | null
  cost_price: number | null
  category: string | null
}

type Supplier = { id: string; name: string; phone: string | null }

export default function ReassortPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [message, setMessage] = useState('')

  const [target, setTarget] = useState<Product | null>(null)
  const [form, setForm] = useState({ supplier_id: '', quantity: '', expected_date: '', notify: true })
  const [submitting, setSubmitting] = useState(false)

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership) { setMessage('Aucune boutique trouvée.'); setLoading(false); return }

      setBusinessId(membership.business_id)
      setBusinessName(((membership.businesses as any)?.name as string) || '')

      const [{ data: prods }, { data: sups }] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, stock, sell_price, cost_price, category')
          .eq('business_id', membership.business_id)
          .is('deleted_at', null)
          .order('stock', { ascending: true }),
        supabase
          .from('suppliers')
          .select('id, name, phone')
          .eq('business_id', membership.business_id)
          .order('name', { ascending: true }),
      ])

      setProducts((prods || []) as Product[])
      setSuppliers((sups || []) as Supplier[])
      setLoading(false)
    }
    init()
  }, [router])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((p) => {
      if (onlyLow && Number(p.stock ?? 0) > LOW_STOCK_THRESHOLD) return false
      if (!q) return true
      return p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    })
  }, [products, search, onlyLow])

  const lowCount = useMemo(
    () => products.filter((p) => Number(p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length,
    [products]
  )

  function openReorder(p: Product) {
    setForm({
      supplier_id: suppliers[0]?.id || '',
      quantity: '',
      expected_date: '',
      notify: true,
    })
    setTarget(p)
  }

  async function submitReorder() {
    if (!target || !businessId) return
    const qty = Number(form.quantity)
    if (!qty || qty <= 0) { flash('Entrez une quantité valide.'); return }

    const supplier = suppliers.find((s) => s.id === form.supplier_id) || null

    setSubmitting(true)
    const { error } = await supabase.from('restock_orders').insert({
      business_id: businessId,
      supplier_id: supplier?.id || null,
      supplier_name: supplier?.name || null,
      product_id: target.id,
      product_name: target.name,
      quantity: qty,
      expected_date: form.expected_date || null,
      status: 'pending',
    })
    setSubmitting(false)

    if (error) { flash(`Erreur: ${error.message}`); return }

    const productName = target.name
    const supplierName = supplier?.name
    const supplierPhone = supplier?.phone
    const wantsNotify = form.notify
    setTarget(null)
    flash(`Commande de réassort créée : ${productName} x${qty}${supplierName ? ` chez ${supplierName}` : ''}.`)

    if (wantsNotify && supplierPhone) {
      const phone = supplierPhone.replace(/\D/g, '')
      const text = encodeURIComponent(
        `Bonjour ${supplierName},\n\nNouvelle commande de réassort de ${businessName} :\n- ${productName} : ${qty} unité${qty > 1 ? 's' : ''}` +
          (form.expected_date ? `\n- Date souhaitée : ${form.expected_date}` : '') +
          `\n\nMerci de confirmer la disponibilité.`
      )
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
    }
  }

  return (
    <AppShell title="Réassort" subtitle="Surveillez vos stocks et commandez auprès de vos fournisseurs.">
      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Boxes className="h-4 w-4" /><span className="text-xs font-black uppercase">Produits</span></div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{products.length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-amber-500"><TrendingDown className="h-4 w-4" /><span className="text-xs font-black uppercase">Stock faible</span></div>
          <p className="mt-2 text-2xl font-black text-amber-600">{lowCount}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Package className="h-4 w-4" /><span className="text-xs font-black uppercase">Fournisseurs</span></div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{suppliers.length}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => setOnlyLow((v) => !v)}
          className={`rounded-2xl px-5 py-3 text-sm font-black transition ${onlyLow ? 'bg-amber-500 text-white' : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
        >
          Stock faible uniquement
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[2rem] bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
          <Package className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 font-black text-slate-600 dark:text-slate-300">Aucun produit à afficher.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const stock = Number(p.stock ?? 0)
            const low = stock <= LOW_STOCK_THRESHOLD
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-900 dark:text-white">{p.name}</p>
                  {p.category && <p className="truncate text-xs font-bold text-slate-400">{p.category}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${low ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>
                    {low && <AlertTriangle className="h-3.5 w-3.5" />}
                    {stock} en stock
                  </div>
                  <button
                    onClick={() => openReorder(p)}
                    className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <PackagePlus className="h-4 w-4" /> Réassort
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {target && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setTarget(null)}>
          <div
            className="w-full max-w-md rounded-t-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Commander : {target.name}</h3>
              <button onClick={() => setTarget(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>

            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Fournisseur</label>
            {suppliers.length === 0 ? (
              <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">Ajoutez d'abord un fournisseur dans la page Fournisseurs.</p>
            ) : (
              <select
                value={form.supplier_id}
                onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.phone ? '' : ' (sans téléphone)'}</option>
                ))}
              </select>
            )}

            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Quantité à commander</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="Ex: 20"
              className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <label className="mb-1 block text-xs font-black uppercase text-slate-500">Date souhaitée (optionnel)</label>
            <input
              type="date"
              value={form.expected_date}
              onChange={(e) => setForm((f) => ({ ...f, expected_date: e.target.value }))}
              className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <label className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={form.notify} onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))} className="h-4 w-4 accent-emerald-600" />
              <MessageCircle className="h-4 w-4 text-emerald-600" /> Notifier le fournisseur par WhatsApp
            </label>

            <button
              onClick={submitReorder}
              disabled={submitting}
              className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Création...' : 'Créer la commande de réassort'}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
