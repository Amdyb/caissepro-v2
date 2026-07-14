'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useRef, useState } from 'react'

type Cat = { id: string; name: string }

const NEW_SENTINEL = '__new__'

export default function CategoryPicker({
  businessId,
  value,
  onChange,
  selectClassName,
}: {
  businessId: string | null
  value: string
  onChange: (name: string) => void
  selectClassName?: string
}) {
  const [cats, setCats] = useState<Cat[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!businessId) return
    supabase
      .from('product_categories')
      .select('id, name')
      .eq('business_id', businessId)
      .order('name')
      .then(({ data }) => setCats((data || []) as Cat[]))
  }, [businessId])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  async function handleAdd() {
    if (!businessId || !newName.trim()) return
    const trimmed = newName.trim()

    // If a category already exists with the same name (case-insensitive, trimmed),
    // select the canonical version rather than creating a duplicate.
    const existing = cats.find(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (existing) {
      onChange(existing.name)
      setAdding(false)
      setNewName('')
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from('product_categories')
      .insert({ business_id: businessId, name: trimmed })
      .select('id, name')
      .single()
    setSaving(false)
    if (error || !data) return

    const added = data as Cat
    setCats((prev) =>
      [...prev, added].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    )
    onChange(added.name)
    setAdding(false)
    setNewName('')
  }

  const base = selectClassName ??
    'w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none focus:border-emerald-500'

  return (
    <div className="space-y-2">
      <select
        value={value || ''}
        onChange={(e) => {
          if (e.target.value === NEW_SENTINEL) {
            setAdding(true)
          } else {
            onChange(e.target.value)
            setAdding(false)
          }
        }}
        className={base}
      >
        <option value="">— Catégorie (optionnel) —</option>
        {cats.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
        <option value={NEW_SENTINEL}>+ Nouvelle catégorie</option>
      </select>

      {adding && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            placeholder="Nom de la catégorie"
            className="flex-1 rounded-2xl border border-emerald-300 px-4 py-3 font-bold outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? '...' : 'Ajouter'}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName('') }}
            className="rounded-2xl border border-slate-300 px-4 py-3 font-black text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}
