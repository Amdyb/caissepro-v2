'use client'

import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'
import { FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function ProductBulkImporter({ businessId }: { businessId: string }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleFile(file: File) {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    setRows(json as any[])
    setMessage(`${json.length} produits détectés.`)
  }

  async function importProducts() {
    if (!rows.length) return

    setLoading(true)
    setMessage('')

    const payload = rows.map((row) => ({
      business_id: businessId,
      name: row.name || row.nom || 'Produit',
      price: Number(row.price || row.prix || 0),
      stock_quantity: Number(row.stock || row.quantite || 0),
      barcode: row.barcode || row.codebarre || null,
      category: row.category || row.categorie || null
    }))

    const { error } = await supabase
      .from('products')
      .insert(payload)

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setRows([])
    setMessage('Produits importés avec succès.')
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          <FileSpreadsheet />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-950">Import produits</h3>
          <p className="text-sm font-semibold text-slate-500">Importez un fichier Excel ou CSV.</p>
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
        <Upload size={40} className="text-slate-400" />
        <p className="mt-4 text-lg font-black text-slate-800">Importer un fichier</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">CSV, XLSX</p>
        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }} />
      </label>

      {rows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-black">Nom</th>
                  <th className="px-4 py-3 text-left font-black">Prix</th>
                  <th className="px-4 py-3 text-left font-black">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-bold">{row.name || row.nom}</td>
                    <td className="px-4 py-3">{row.price || row.prix}</td>
                    <td className="px-4 py-3">{row.stock || row.quantite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <button onClick={importProducts} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white disabled:opacity-60">
              <CheckCircle2 size={18} />
              {loading ? 'Importation...' : `Importer ${rows.length} produits`}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
          {message}
        </div>
      )}
    </div>
  )
}
