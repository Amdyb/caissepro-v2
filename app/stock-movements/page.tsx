'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, History, Package, Plus, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Product = {
  id: string
  name: string
  stock: number | null
}

type StockMovement = {
  id: string
  business_id: string
  product_id: string | null
  created_by: string | null
  movement_type: string
  quantity: number
  previous_stock: number | null
  new_stock: number | null
  note: string | null
  created_at: string
  products?: {
    name: string
  } | null
}

function movementLabel(type: string) {
  switch (type) {
    case 'adjustment':
      return 'Ajustement'
    case 'restock':
      return 'Réassort'
    case 'loss':
      return 'Perte / casse'
    case 'return':
      return 'Retour'
    case 'correction':
      return 'Correction'
    default:
      return type
  }
}

export default function StockMovementsPage() {
  const router = useRouter()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [productId, setProductId] = useState('')
  const [movementType, setMovementType] = useState('adjustment')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selectedProduct = products.find((product) => product.id === productId) || null

  const filteredMovements = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return movements

    return movements.filter((movement) =>
      (movement.products?.name || '').toLowerCase().includes(q) ||
      movement.movement_type.toLowerCase().includes(q) ||
      (movement.note || '').toLowerCase().includes(q)
    )
  }, [movements, search])

  const totalIn = movements
    .filter((movement) => movement.quantity > 0)
    .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0)

  const totalOut = movements
    .filter((movement) => movement.quantity < 0)
    .reduce((sum, movement) => sum + Math.abs(Number(movement.quantity || 0)), 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setUserId(userData.user.id)

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, businesses(name)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')

      await Promise.all([
        loadProducts(member.business_id),
        loadMovements(member.business_id)
      ])

      setLoading(false)
    }

    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('business_id', id)
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function loadMovements(id: string) {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id,
        business_id,
        product_id,
        created_by,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        note,
        created_at,
        products (
          name
        )
      `)
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setMessage(error.message)
      return
    }

    setMovements((data || []) as unknown as StockMovement[])
  }

  function signedQuantity() {
    const q = Number(quantity || 0)

    if (movementType === 'loss') return -Math.abs(q)
    if (movementType === 'correction') return q
    return q
  }

  async function createMovement(e: React.FormEvent) {
    e.preventDefault()

    if (!businessId || !userId || !selectedProduct) return

    const change = signedQuantity()

    if (change === 0) {
      setMessage('Entrez une quantité valide.')
      return
    }

    const previousStock = Number(selectedProduct.stock || 0)
    const newStock = Math.max(previousStock + change, 0)

    setSaving(true)
    setMessage('')

    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        business_id: businessId,
        product_id: selectedProduct.id,
        created_by: userId,
        movement_type: movementType,
        quantity: change,
        previous_stock: previousStock,
        new_stock: newStock,
        note: note || null
      })

    if (movementError) {
      setMessage(movementError.message)
      setSaving(false)
      return
    }

    const { error: productError } = await supabase
      .from('products')
      .update({
        stock: newStock
      })
      .eq('id', selectedProduct.id)

    if (productError) {
      setMessage(productError.message)
      setSaving(false)
      return
    }

    setProductId('')
    setMovementType('adjustment')
    setQuantity('')
    setNote('')

    await Promise.all([
      loadProducts(businessId),
      loadMovements(businessId)
    ])

    setMessage('Mouvement de stock enregistré.')
    setSaving(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement des mouvements...</p>
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
              Mouvements de stock
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
        {message && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Package className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Produits suivis</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{products.length}</p>
          </div>

          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-sm">
            <TrendingUp className="text-brand-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Entrées stock</p>
            <p className="mt-2 text-3xl font-black text-brand-700">{totalIn}</p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <TrendingDown className="text-red-600" />
            <p className="mt-5 text-sm font-bold text-slate-500">Sorties stock</p>
            <p className="mt-2 text-3xl font-black text-red-700">{totalOut}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                <Plus />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Ajouter mouvement
                </h2>

                <p className="text-sm text-slate-500">
                  Correction, perte, retour ou ajustement manuel.
                </p>
              </div>
            </div>

            <form onSubmit={createMovement} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Produit</label>
                <select
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Choisir produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — stock {product.stock || 0}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">Stock actuel</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {selectedProduct.stock || 0}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-slate-700">Type</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-brand-600"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                >
                  <option value="adjustment">Ajustement +</option>
                  <option value="loss">Perte / casse -</option>
                  <option value="return">Retour +</option>
                  <option value="correction">Correction directe +/-</option>
                  <option value="restock">Réassort manuel +</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Quantité</label>
                <input
                  type="number"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Note</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600"
                  placeholder="Ex: produit cassé, correction inventaire..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-brand-600 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer mouvement'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Historique stock
                </h2>

                <p className="text-sm text-slate-500">
                  {movements.length} mouvement(s)
                </p>
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

            {filteredMovements.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <History className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Aucun mouvement
                </h3>
                <p className="mt-2 text-slate-500">
                  Les corrections de stock apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMovements.map((movement) => {
                  const date = new Date(movement.created_at)
                  const isPositive = Number(movement.quantity || 0) >= 0

                  return (
                    <div key={movement.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-black text-slate-950">
                            {movement.products?.name || 'Produit supprimé'}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {movementLabel(movement.movement_type)} • {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>

                          {movement.note && (
                            <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                              {movement.note}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-bold text-slate-500">Avant</p>
                            <p className="font-black text-slate-950">{movement.previous_stock || 0}</p>
                          </div>

                          <div className={`rounded-2xl px-4 py-3 ${isPositive ? 'bg-brand-50' : 'bg-red-50'}`}>
                            <p className="text-xs font-bold text-slate-500">Mouv.</p>
                            <p className={`font-black ${isPositive ? 'text-brand-700' : 'text-red-700'}`}>
                              {isPositive ? '+' : ''}{movement.quantity}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-bold text-slate-500">Après</p>
                            <p className="font-black text-slate-950">{movement.new_stock || 0}</p>
                          </div>
                        </div>
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
