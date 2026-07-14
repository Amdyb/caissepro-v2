'use client'

import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'
import { FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function ProductBulkImporter({ businessId, onImported }: { businessId: string; onImported?: () => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleFile(file: File) {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    setRows(json as any[])
    setMessage(`${json.length} produits detectes.`)
  }

  async function importProducts() {
    if (!rows.length) return

    setLoading(true)
    setMessage('')

    // Load existing categories and build a canonical name lookup
    // (trimmed, lowercased key → canonical name stored in product_categories).
    const { data: existingCats } = await supabase
      .from('product_categories')
      .select('name')
      .eq('business_id', businessId)
    const canonicalMap = new Map<string, string>()
    for (const c of existingCats || []) {
      canonicalMap.set(c.name.trim().toLowerCase(), c.name)
    }

    // Collect unique raw category names from the import that have no match.
    const rawCategoryNames = Array.from(
      new Set(
        rows
          .map((row) => (row.category || row.categorie || '').toString().trim())
          .filter(Boolean)
          .filter((name) => !canonicalMap.has(name.toLowerCase()))
      )
    )

    // Create missing categories one by one (small sets in practice).
    for (const name of rawCategoryNames) {
      const { data } = await supabase
        .from('product_categories')
        .insert({ business_id: businessId, name })
        .select('name')
        .single()
      if (data) canonicalMap.set(name.toLowerCase(), data.name)
    }

    const payload = rows.map((row) => {
      const rawCat = (row.category || row.categorie || '').toString().trim()
      const category = rawCat ? (canonicalMap.get(rawCat.toLowerCase()) ?? rawCat) : null
      return {
        business_id: businessId,
        name: row.name || row.nom || row.produit || 'Produit',
        category,
        barcode: row.barcode || row.codebarre || row.code_barre || null,
        cost_price: Number(row.cost_price || row.cout || row.prix_achat || 0),
        sell_price: Number(row.sell_price || row.price || row.prix || row.prix_vente || 0),
        minimum_price: Number(row.minimum_price || row.prix_minimum || row.minimum || 0),
        stock: Number(row.stock || row.quantite || row.quantity || 0),
        image: row.image || row.image_url || null,
      }
    })

    const { error } = await supabase.from('products').insert(payload)

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setRows([])
    setMessage('Produits importes avec succes.')
    onImported?.()
  }

  return (
    <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FileSpreadsheet /></div>
        <div>
          <h3 className="text-2xl font-black text-slate-950">Import produits</h3>
          <p className="text-sm font-semibold text-slate-500">Importez un fichier Excel ou CSV: name/nom, prix, stock, categorie, barcode.</p>
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
        <Upload size={36} className="text-slate-400" />
        <p className="mt-4 text-lg font-black text-slate-800">Importer un fichier</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">CSV, XLSX, XLS</p>
        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }} />
      </label>

      {rows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left font-black">Nom</th><th className="px-4 py-3 text-left font-black">Prix vente</th><th className="px-4 py-3 text-left font-black">Stock</th><th className="px-4 py-3 text-left font-black">Categorie</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.slice(0, 10).map((row, i) => <tr key={i}><td className="px-4 py-3 font-bold">{row.name || row.nom || row.produit}</td><td className="px-4 py-3">{row.sell_price || row.price || row.prix || row.prix_vente}</td><td className="px-4 py-3">{row.stock || row.quantite || row.quantity}</td><td className="px-4 py-3">{row.category || row.categorie}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-4"><button onClick={importProducts} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white disabled:opacity-60"><CheckCircle2 size={18} />{loading ? 'Importation...' : `Importer ${rows.length} produits`}</button></div>
        </div>
      )}

      {message && <div className={`mt-5 rounded-2xl p-4 text-sm font-black ${message.includes('succes') || message.includes('detectes') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}
    </div>
  )
}
