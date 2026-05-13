'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FolderTree, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  business_id: string
  name: string
  created_at: string
}

type Product = {
  id: string
  name: string
  category: string | null
}

export default function CategoriesPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return categories

    return categories.filter((category) =>
      category.name.toLowerCase().includes(q)
    )
  }, [categories, search])

  function productCount(categoryName: string) {
    return products.filter((product) => product.category === categoryName).length
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadCategories(member.business_id),
        loadProducts(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadCategories(id: string) {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('business_id', id)
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setCategories((data || []) as Category[])
  }

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category')
      .eq('business_id', id)

    if (error) return

    setProducts((data || []) as Product[])
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId) return

    const cleanName = name.trim()

    if (!cleanName) {
      setMessage('Entrez un nom de catégorie.')
      return
    }

    const duplicate = categories.find(
      (category) => category.name.toLowerCase() === cleanName.toLowerCase()
    )

    if (duplicate) {
      setMessage('Cette catégorie existe déjà.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('product_categories')
      .insert({
        business_id: businessId,
        name: cleanName
      })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setName('')
    await loadCategories(businessId)
    setMessage('Catégorie ajoutée.')
    setSaving(false)
  }

  async function deleteCategory(category: Category) {
    if (!businessId) return

    const count = productCount(category.name)

    if (count > 0) {
      setMessage(`Impossible de supprimer: ${count} produit(s) utilisent cette catégorie.`)
      return
    }

    if (!confirm('Supprimer cette catégorie ?')) return

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadCategories(businessId)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des catégories...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700">
              <ArrowLeft size={16} />
              Tableau de bord
            </Link>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Catégories produits
            </h1>

            <p className="text-sm font-semibold text-slate-500">
              {businessName}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <FolderTree className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Catégories</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{categories.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Tag className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Produits catégorisés</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {products.filter((product) => product.category).length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Tag className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Sans catégorie</p>
            <p className="mt-2 text-3xl font-black text-red-700">
              {products.filter((product) => !product.category).length}
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-700">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Plus />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Ajouter catégorie
                </h2>
                <p className="text-sm text-slate-500">
                  Exemple: Vapes, Accessoires, Boissons, Cosmétiques.
                </p>
              </div>
            </div>

            <form onSubmit={addCategory} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Nom catégorie</label>
                <input
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: Accessoires"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? 'Ajout...' : 'Ajouter catégorie'}
              </button>
            </form>

            <div className="mt-8 rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-950">Étape suivante</h3>
              <p className="mt-2 text-sm text-slate-600">
                Après création, utilisez ces catégories dans la page Produits pour garder votre inventaire propre.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Liste catégories</h2>
                <p className="text-sm text-slate-500">{categories.length} catégorie(s)</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-brand-600 md:w-72"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <FolderTree className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">Aucune catégorie</h3>
                <p className="mt-2 text-slate-500">Les catégories ajoutées apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => {
                  const count = productCount(category.name)

                  return (
                    <div key={category.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-black text-slate-950">{category.name}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {count} produit(s)
                          </p>
                        </div>

                        <button
                          onClick={() => deleteCategory(category)}
                          className="rounded-2xl p-3 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
