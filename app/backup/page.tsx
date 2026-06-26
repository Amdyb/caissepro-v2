'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { Archive, FileSpreadsheet, Download, Mail, ShieldCheck, Users, Receipt, Package } from 'lucide-react'
import { useEffect, useState } from 'react'

type Row = Record<string, string | number | null>

const DATASETS = [
  { key: 'products', title: 'Produits', description: 'Inventaire, prix et stock.', icon: Package },
  { key: 'sales', title: 'Ventes', description: 'Reçus, montants et paiements.', icon: Receipt },
  { key: 'customers', title: 'Clients', description: 'Contacts, dettes et historique.', icon: Users },
  { key: 'expenses', title: 'Dépenses', description: 'Charges et catégories.', icon: FileSpreadsheet },
] as const

type DatasetKey = (typeof DATASETS)[number]['key']

export default function BackupPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setMessage(''); setTimeout(() => setError(''), 6000) }
    else { setMessage(msg); setError(''); setTimeout(() => setMessage(''), 6000) }
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setLoading(false); return }
      setUserEmail(userData.user.email || '')

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) { flash('Aucune boutique trouvée pour ce compte.', true); setLoading(false); return }
      setBusinessId(membership.business_id)
      setBusinessName(((membership.businesses as any)?.name as string) || '')
      setLoading(false)
    }
    init()
  }, [])

  async function fetchRows(key: DatasetKey, bId: string): Promise<Row[]> {
    if (key === 'products') {
      const { data } = await supabase.from('products')
        .select('name, category, barcode, stock, cost_price, sell_price, created_at')
        .eq('business_id', bId).is('deleted_at', null).order('name')
      return (data || []).map((p: any) => ({
        Produit: p.name, Categorie: p.category ?? '', 'Code-barres': p.barcode ?? '',
        Stock: p.stock ?? 0, 'Prix achat': p.cost_price ?? 0, 'Prix vente': p.sell_price ?? 0,
        'Créé le': p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '',
      }))
    }
    if (key === 'sales') {
      const { data } = await supabase.from('sales')
        .select('receipt_number, total, paid_amount, remaining_amount, payment_method, status, created_at')
        .eq('business_id', bId).order('created_at', { ascending: false })
      return (data || []).map((s: any) => ({
        Reçu: s.receipt_number ?? '', Total: s.total ?? 0, Payé: s.paid_amount ?? 0,
        Restant: s.remaining_amount ?? 0, Paiement: s.payment_method ?? '', Statut: s.status ?? '',
        Date: s.created_at ? new Date(s.created_at).toLocaleString('fr-FR') : '',
      }))
    }
    if (key === 'customers') {
      const { data } = await supabase.from('customers')
        .select('full_name, phone, email, total_spent, debt_balance, created_at')
        .eq('business_id', bId).order('full_name')
      return (data || []).map((c: any) => ({
        Nom: c.full_name ?? '', Téléphone: c.phone ?? '', Email: c.email ?? '',
        'Total dépensé': c.total_spent ?? 0, Dette: c.debt_balance ?? 0,
        'Créé le': c.created_at ? new Date(c.created_at).toLocaleString('fr-FR') : '',
      }))
    }
    // expenses
    const { data } = await supabase.from('expenses')
      .select('title, category, amount, note, expense_date, created_at')
      .eq('business_id', bId).order('created_at', { ascending: false })
    return (data || []).map((e: any) => ({
      Titre: e.title ?? '', Categorie: e.category ?? '', Montant: e.amount ?? 0,
      Note: e.note ?? '', 'Date dépense': e.expense_date ?? '',
      'Créé le': e.created_at ? new Date(e.created_at).toLocaleString('fr-FR') : '',
    }))
  }

  // Lazy-load papaparse only when an export is actually requested.
  async function csvFor(rows: Row[]): Promise<string> {
    const Papa = (await import('papaparse')).default
    return Papa.unparse(rows.length ? rows : [{ info: 'Aucune donnée' }])
  }

  function triggerDownload(filename: string, content: BlobPart, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const slug = (businessName || 'caissepro').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'boutique'
  const stamp = new Date().toISOString().slice(0, 10)

  async function downloadOne(key: DatasetKey) {
    if (!businessId) return
    setBusy(key)
    try {
      const rows = await fetchRows(key, businessId)
      triggerDownload(`${slug}-${key}-${stamp}.csv`, '﻿' + (await csvFor(rows)), 'text/csv;charset=utf-8;')
      flash(`Export ${key} téléchargé (${rows.length} ligne${rows.length > 1 ? 's' : ''}).`)
    } catch (e: any) {
      flash(e?.message || 'Erreur export', true)
    } finally {
      setBusy(null)
    }
  }

  async function buildAllCsvs(): Promise<{ filename: string; content: string }[]> {
    if (!businessId) return []
    const out: { filename: string; content: string }[] = []
    for (const d of DATASETS) {
      const rows = await fetchRows(d.key, businessId)
      out.push({ filename: `${slug}-${d.key}-${stamp}.csv`, content: '﻿' + (await csvFor(rows)) })
    }
    return out
  }

  async function downloadZip() {
    if (!businessId) return
    setBusy('zip')
    try {
      const files = await buildAllCsvs()
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      files.forEach((f) => zip.file(f.filename, f.content))
      const blob = await zip.generateAsync({ type: 'blob' })
      triggerDownload(`${slug}-export-complet-${stamp}.zip`, blob, 'application/zip')
      flash('Export complet (ZIP) téléchargé.')
    } catch (e: any) {
      flash(e?.message || 'Erreur ZIP', true)
    } finally {
      setBusy(null)
    }
  }

  async function emailExport() {
    if (!businessId || !userEmail) return
    setBusy('email')
    try {
      const files = await buildAllCsvs()
      const payload = files.map((f) => ({
        filename: f.filename,
        contentBase64: typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(f.content))) : '',
      }))
      const res = await fetch('/api/backup/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: userEmail, businessName, files: payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Échec envoi email')
      flash(`Export envoyé à ${userEmail}.`)
    } catch (e: any) {
      flash(e?.message || 'Erreur envoi email', true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <AppShell title="Sauvegarde & Export" subtitle="Téléchargez ou recevez par email une copie de vos données.">
      <div className="mx-auto max-w-5xl">
        {message && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{message}</div>}
        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{error}</div>}

        <div className="mb-6 flex items-start gap-3 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h2 className="font-black text-slate-900 dark:text-white">Téléchargez mes données</h2>
            <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
              Exportez vos données au format CSV (Excel / Google Sheets). Gardez toujours une copie de sauvegarde.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[2rem] bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {DATASETS.map((d) => {
                const Icon = d.icon
                return (
                  <div key={d.key} className="flex items-center justify-between gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-emerald-600" /><p className="font-black text-slate-900 dark:text-white">{d.title}</p></div>
                      <p className="mt-1 text-xs font-bold text-slate-400">{d.description}</p>
                    </div>
                    <button
                      onClick={() => downloadOne(d.key)}
                      disabled={!!busy}
                      className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" /> {busy === d.key ? '...' : 'CSV'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={downloadZip}
                disabled={!!busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
              >
                <Archive className="h-5 w-5" /> {busy === 'zip' ? 'Préparation...' : 'Tout exporter (ZIP)'}
              </button>
              <button
                onClick={emailExport}
                disabled={!!busy || !userEmail}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-900 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <Mail className="h-5 w-5 text-emerald-600" /> {busy === 'email' ? 'Envoi...' : `Envoyer par email${userEmail ? ` (${userEmail})` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
