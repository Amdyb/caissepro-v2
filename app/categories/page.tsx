'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useMemo, useState } from 'react'
import { Edit, FolderTree, Plus, Save, Search, Tag, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Category = { id: string; business_id: string; name: string; created_at: string }
type Product = { id: string; name: string; category: string | null }

export default function CategoriesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('Ma Boutique')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim()
    return !q ? categories : categories.filter((category) => category.name.toLowerCase().includes(q))
  }, [categories, search])

  function productCount(categoryName: string) {
    return products.filter((product) => product.category === categoryName).length
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      await Promise.all([loadCategories(member.business_id), loadProducts(member.business_id)])
      setLoading(false)
    }
    init()
  }, [])

  async function loadCategories(id: string) {
    const { data, error } = await supabase.from('product_categories').select('*').eq('business_id', id).order('name')
    if (error) {
      setMessage(error.message)
      return
    }
    setCategories((data || []) as Category[])
  }

  async function loadProducts(id: string) {
    const { data } = await supabase.from('products').select('id,name,category').eq('business_id', id)
    setProducts((data || []) as Product[])
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    const cleanName = name.trim()
    if (!cleanName) return setMessage('Entrez un nom de catégorie.')
    if (categories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase())) return setMessage('Cette catégorie existe déjà.')

    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('product_categories').insert({ business_id: businessId, name: cleanName })
    setSaving(false)
    if (error) return setMessage(error.message)
    setName('')
    await loadCategories(businessId)
    setMessage('Catégorie ajoutée.')
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setEditingName(category.name)
    setMessage('')
  }

  async function saveCategory(category: Category) {
    if (!businessId) return
    const oldName = category.name
    const newName = editingName.trim()

    if (!newName) return setMessage('Le nom de catégorie ne peut pas être vide.')
    if (newName.toLowerCase() !== oldName.toLowerCase() && categories.some((item) => item.id !== category.id && item.name.toLowerCase() === newName.toLowerCase())) {
      return setMessage('Une catégorie avec ce nom existe déjà.')
    }

    setSaving(true)
    setMessage('')

    const { error: categoryError } = await supabase
      .from('product_categories')
      .update({ name: newName })
      .eq('id', category.id)

    if (categoryError) {
      setSaving(false)
      return setMessage(categoryError.message)
    }

    const { error: productsError } = await supabase
      .from('products')
      .update({ category: newName })
      .eq('business_id', businessId)
      .eq('category', oldName)

    setSaving(false)

    if (productsError) return setMessage(productsError.message)

    setEditingId('')
    setEditingName('')
    await Promise.all([loadCategories(businessId), loadProducts(businessId)])
    setMessage('Catégorie mise à jour. Les produits liés ont été synchronisés.')
  }

  async function deleteCategory(category: Category) {
    if (!businessId) return
    const count = productCount(category.name)
    if (count > 0) return setMessage(`Impossible de supprimer: ${count} produit(s) utilisent cette catégorie.`)
    if (!confirm('Supprimer cette catégorie ?')) return

    const { error } = await supabase.from('product_categories').delete().eq('id', category.id)
    if (error) return setMessage(error.message)
    await loadCategories(businessId)
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="font-bold text-slate-600">Chargement des catégories...</p></main>

  return (
    <AppShell title="Catégories produits" subtitle={businessName}>
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><FolderTree className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Catégories</p><p className="mt-2 text-3xl font-black text-slate-950">{categories.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Tag className="text-emerald-600" /><p className="mt-5 text-sm font-bold text-slate-500">Produits catégorisés</p><p className="mt-2 text-3xl font-black text-slate-950">{products.filter((product) => product.category).length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Tag className="text-red-600" /><p className="mt-5 text-sm font-bold text-slate-500">Sans catégorie</p><p className="mt-2 text-3xl font-black text-red-700">{products.filter((product) => !product.category).length}</p></div>
        </div>

        {message && <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Plus /></div><div><h2 className="text-2xl font-black text-slate-950">Ajouter catégorie</h2><p className="text-sm text-slate-500">Exemple: Vapes, Accessoires, Boissons.</p></div></div>
            <form onSubmit={addCategory} className="space-y-4"><input required className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" placeholder="Ex: Accessoires" value={name} onChange={(e) => setName(e.target.value)} /><button disabled={saving} className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white disabled:opacity-60">{saving ? 'Ajout...' : 'Ajouter catégorie'}</button></form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-black text-slate-950">Liste catégories</h2><p className="text-sm text-slate-500">Cliquez sur modifier pour renommer.</p></div><div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-emerald-600 md:w-72" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

            {filteredCategories.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><FolderTree className="mx-auto text-slate-400" size={42} /><h3 className="mt-4 text-xl font-black text-slate-950">Aucune catégorie</h3></div> : <div className="space-y-4">{filteredCategories.map((category) => {
              const count = productCount(category.name)
              const isEditing = editingId === category.id
              return <div key={category.id} className="rounded-3xl border border-slate-200 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex-1">{isEditing ? <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="w-full rounded-2xl border border-emerald-300 px-4 py-3 text-lg font-black outline-none" autoFocus /> : <p className="text-lg font-black text-slate-950">{category.name}</p>}<p className="mt-1 text-sm font-semibold text-slate-500">{count} produit(s)</p></div><div className="flex gap-2">{isEditing ? <><button onClick={() => saveCategory(category)} disabled={saving} className="rounded-2xl bg-emerald-600 p-3 text-white"><Save size={18} /></button><button onClick={() => { setEditingId(''); setEditingName('') }} className="rounded-2xl bg-slate-100 p-3 text-slate-600"><X size={18} /></button></> : <button onClick={() => startEdit(category)} className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Edit size={18} /></button>}<button onClick={() => deleteCategory(category)} className="rounded-2xl p-3 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={18} /></button></div></div></div>
            })}</div>}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
