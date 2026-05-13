'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Minus,
  Package,
  PackagePlus,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  Users,
  Wallet,
  X,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Product = {
  id: string
  business_id: string
  name: string
  barcode: string | null
  category: string | null
  sell_price: number | null
  minimum_price: number | null
  stock: number | null
  image: string | null
}

type Customer = {
  id: string
  full_name: string
  phone: string | null
  points: number | null
  total_spent: number | null
  debt_balance?: number | null
}

type CartItem = {
  product: Product
  quantity: number
  price: number
}

function paymentLabel(method: string) {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'wave':
      return 'Wave'
    case 'orange_money':
      return 'Orange Money'
    case 'card':
      return 'Carte'
    case 'credit':
      return 'Client Doit'
    default:
      return method
  }
}

function paymentStyle(method: string) {
  switch (method) {
    case 'cash':
      return 'bg-emerald-600 text-white'
    case 'wave':
      return 'bg-sky-600 text-white'
    case 'orange_money':
      return 'bg-orange-500 text-white'
    case 'card':
      return 'bg-slate-950 text-white'
    case 'credit':
      return 'bg-red-600 text-white'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function POSPage() {
  const router = useRouter()
  const pathname = usePathname()
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [cashierId, setCashierId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('CaissePro')
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Caisse POS', href: '/pos', icon: ShoppingCart },
    { label: 'Produits', href: '/products', icon: Package },
    { label: 'Catégories', href: '/categories', icon: Boxes },
    { label: 'Ventes', href: '/sales', icon: ReceiptText },
    { label: 'Clients', href: '/customers', icon: Users },
    { label: 'Client Doit', href: '/debts', icon: HandCoins },
    { label: 'Fournisseurs', href: '/suppliers', icon: Truck },
    { label: 'Achats', href: '/purchases', icon: PackagePlus },
    { label: 'Dépenses', href: '/expenses', icon: Wallet },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Rapports', href: '/reports', icon: CreditCard },
    { label: 'Caisse jour', href: '/register-shifts', icon: CalendarClock },
    { label: 'Multi-boutiques', href: '/branches', icon: Building2 },
    { label: 'Paramètres', href: '/settings', icon: Settings }
  ]

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((product) => {
      if (product.category) set.add(product.category)
    })
    return Array.from(set).sort()
  }, [products])

  const [selectedCategory, setSelectedCategory] = useState('')

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()

    return products.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.category || '').toLowerCase().includes(q) ||
        (product.barcode || '').toLowerCase().includes(q)

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const earnedPoints = Math.floor(subtotal / 1000)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setCashierId(userData.user.id)

      const { data: membership, error } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(name, logo_url, currency)')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (error || !membership) {
        setMessage('Aucune boutique trouvée pour ce compte.')
        setLoading(false)
        return
      }

      const member: any = membership
      setBusinessId(member.business_id)
      setBusinessName(member.businesses?.name || 'Ma Boutique')
      setBusinessLogo(member.businesses?.logo_url || null)

      await Promise.all([
        loadProducts(member.business_id),
        loadCustomers(member.business_id)
      ])

      setLoading(false)

      setTimeout(() => barcodeInputRef.current?.focus(), 300)
    }

    init()
  }, [router])

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, business_id, name, barcode, category, sell_price, minimum_price, stock, image')
      .eq('business_id', id)
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data || []) as Product[])
  }

  async function loadCustomers(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, points, total_spent, debt_balance')
      .eq('business_id', id)
      .order('full_name')

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data || []) as Customer[])
  }

  function addToCart(product: Product) {
    setMessage('')

    if (Number(product.stock || 0) <= 0) {
      setMessage('Produit en rupture de stock.')
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)

      if (existing) {
        if (existing.quantity >= Number(product.stock || 0)) {
          setMessage('Stock insuffisant.')
          return current
        }

        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          price: Number(product.sell_price || 0)
        }
      ]
    })

    barcodeInputRef.current?.focus()
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = barcodeInput.trim()

    if (!code) return

    const exactBarcodeMatch = products.find((product) =>
      (product.barcode || '').trim().toLowerCase() === code.toLowerCase()
    )

    if (exactBarcodeMatch) {
      addToCart(exactBarcodeMatch)
      setBarcodeInput('')
      setSearch('')
      setMessage(`Produit ajouté: ${exactBarcodeMatch.name}`)
      return
    }

    const nameMatches = products.filter((product) =>
      product.name.toLowerCase().includes(code.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(code.toLowerCase())
    )

    if (nameMatches.length === 1) {
      addToCart(nameMatches[0])
      setBarcodeInput('')
      setSearch('')
      setMessage(`Produit ajouté: ${nameMatches[0].name}`)
      return
    }

    if (nameMatches.length > 1) {
      setSearch(code)
      setMessage(`${nameMatches.length} produits trouvés. Touchez le bon produit.`)
      return
    }

    setSearch(code)
    setMessage('Aucun produit trouvé avec ce code ou ce nom.')
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== productId))
      return
    }

    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) return item
        const maxStock = Number(item.product.stock || 0)
        return { ...item, quantity: Math.min(quantity, maxStock) }
      })
    )
  }

  function updatePrice(productId: string, price: number) {
    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) return item
        const minimum = Number(item.product.minimum_price || 0)
        return { ...item, price: Math.max(price, minimum) }
      })
    )
  }

  async function checkout() {
    if (!businessId || !cashierId) return

    if (cart.length === 0) {
      setMessage('Le panier est vide.')
      return
    }

    if (paymentMethod === 'credit' && !selectedCustomerId) {
      setMessage('Sélectionnez un client pour une vente Client Doit.')
      return
    }

    setCheckoutLoading(true)
    setMessage('')

    const customerId = selectedCustomerId || null

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        business_id: businessId,
        cashier_id: cashierId,
        customer_id: customerId,
        total: subtotal,
        paid_amount: paymentMethod === 'credit' ? 0 : subtotal,
        remaining_amount: paymentMethod === 'credit' ? subtotal : 0,
        payment_method: paymentMethod,
        status: paymentMethod === 'credit' ? 'pending' : 'completed'
      })
      .select()
      .single()

    if (saleError || !sale) {
      setMessage(saleError?.message || 'Erreur pendant la vente.')
      setCheckoutLoading(false)
      return
    }

    const saleItems = cart.map((item) => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

    if (itemsError) {
      setMessage(itemsError.message)
      setCheckoutLoading(false)
      return
    }

    for (const item of cart) {
      const newStock = Math.max(Number(item.product.stock || 0) - item.quantity, 0)

      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product.id)
    }

    if (customerId && selectedCustomer) {
      const newTotalSpent = Number(selectedCustomer.total_spent || 0) + subtotal
      const newPoints = Number(selectedCustomer.points || 0) + earnedPoints
      const currentDebt = Number(selectedCustomer.debt_balance || 0)
      const newDebt = paymentMethod === 'credit' ? currentDebt + subtotal : currentDebt

      await supabase
        .from('customers')
        .update({
          total_spent: newTotalSpent,
          points: newPoints,
          debt_balance: newDebt
        })
        .eq('id', customerId)
    }

    setCart([])
    setSelectedCustomerId('')
    setBarcodeInput('')
    setSearch('')
    await Promise.all([loadProducts(businessId), loadCustomers(businessId)])

    setMessage(`Vente enregistrée avec succès.${customerId ? ` ${earnedPoints} point(s) ajouté(s).` : ''}`)
    setCheckoutLoading(false)
    barcodeInputRef.current?.focus()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Chargement de la caisse...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-in-out lg:shadow-none ${
          sidebarOpen ? 'w-72' : 'w-24'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                {businessLogo ? (
                  <img src={businessLogo} alt={businessName} className="h-full w-full object-contain bg-white p-1" />
                ) : (
                  <Store size={24} />
                )}
              </div>

              {sidebarOpen && (
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black text-slate-950">CaissePro</h1>
                  <p className="truncate text-xs font-bold text-slate-500">{businessName}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:block"
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon size={21} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            {sidebarOpen ? (
              <button
                onClick={logout}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Déconnexion
              </button>
            ) : (
              <button
                onClick={logout}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"
              >
                X
              </button>
            )}
          </div>
        </div>
      </aside>

      <section className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Caisse POS</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Vente rapide, recherche produit et encaissement.
                </p>
              </div>
            </div>

            <Link
              href="/sales"
              className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 md:block"
            >
              Historique
            </Link>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-89px)] gap-0 xl:grid-cols-[1fr_420px]">
          <section className="p-5">
            {message && (
              <div className="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                {message}
              </div>
            )}

            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
                  <div className="relative flex-1">
                    <Zap className="absolute left-4 top-3.5 text-emerald-600" size={20} />
                    <input
                      ref={barcodeInputRef}
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base font-black outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                      placeholder="Scanner code-barres ou taper un nom..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                  </div>

                  <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow-lg shadow-emerald-600/20">
                    Ajouter
                  </button>
                </form>
              </div>

              <div className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <Search className="absolute left-8 top-7 text-slate-400" size={20} />
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                  placeholder="Filtrer produits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black shadow-sm ${
                  selectedCategory === ''
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                Tous
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-black shadow-sm ${
                    selectedCategory === category
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
                <Package className="mx-auto text-slate-400" size={46} />
                <h3 className="mt-4 text-2xl font-black">Aucun produit</h3>
                <p className="mt-2 text-slate-500">Aucun produit ne correspond à votre recherche.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock || 0)
                  const lowStock = stock <= 5
                  const outOfStock = stock <= 0

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group relative h-[300px] overflow-hidden rounded-3xl bg-slate-900 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl active:scale-[.98]"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                          <ImageIcon className="text-slate-400" size={48} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

                      <div className="absolute left-4 top-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black text-white ${
                          outOfStock ? 'bg-red-600' : lowStock ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}>
                          {outOfStock ? 'Rupture' : lowStock ? 'Stock faible' : 'En stock'}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-emerald-300">
                          {product.category || 'Produit'}
                        </p>

                        <h3 className="line-clamp-2 text-2xl font-black leading-tight">
                          {product.name}
                        </h3>

                        <div className="mt-4 rounded-3xl bg-white/10 p-4 backdrop-blur">
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-white/70">Prix</p>
                              <p className="text-2xl font-black text-emerald-300">
                                {Number(product.sell_price || 0).toLocaleString('fr-FR')} CFA
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-white/70">Stock</p>
                              <p className={`text-xl font-black ${outOfStock ? 'text-red-300' : lowStock ? 'text-amber-300' : 'text-white'}`}>
                                {stock}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <aside className="border-l border-slate-200 bg-white p-5 shadow-2xl xl:sticky xl:top-[89px] xl:h-[calc(100vh-89px)] xl:overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">Panier</h3>
                <p className="text-sm font-semibold text-slate-500">{totalItems} article(s)</p>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700"
                >
                  Vider
                </button>
              )}
            </div>

            <div className="mb-5 rounded-3xl bg-slate-50 p-4">
              <label className="text-sm font-black text-slate-700">Client</label>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-emerald-600"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Vente sans client</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name} {customer.phone ? `• ${customer.phone}` : ''}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="mt-3 rounded-2xl bg-white p-3 text-sm">
                  <p className="font-black text-slate-950">{selectedCustomer.full_name}</p>
                  <p className="font-semibold text-slate-500">
                    Points: {selectedCustomer.points || 0} • Dette: {Number(selectedCustomer.debt_balance || 0).toLocaleString('fr-FR')} CFA
                  </p>
                  <p className="mt-1 font-bold text-emerald-700">+{earnedPoints} point(s) sur cette vente.</p>
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <ShoppingCart className="mx-auto text-slate-400" size={42} />
                <h3 className="mt-4 text-xl font-black">Panier vide</h3>
                <p className="mt-2 text-sm text-slate-500">Scannez ou touchez un produit.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="text-slate-400" size={20} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="line-clamp-2 font-black text-slate-950">{item.product.name}</h4>
                            <p className="text-xs font-semibold text-slate-500">
                              Min: {Number(item.product.minimum_price || 0).toLocaleString('fr-FR')} CFA
                            </p>
                          </div>

                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
                          <input
                            type="number"
                            min={Number(item.product.minimum_price || 0)}
                            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-black outline-none focus:border-emerald-600"
                            value={item.price}
                            onChange={(e) => updatePrice(item.product.id, Number(e.target.value || 0))}
                          />

                          <div className="flex items-center rounded-2xl border border-slate-300 px-2">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2">
                              <Minus size={14} />
                            </button>
                            <span className="px-2 font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <p className="mt-3 text-right text-lg font-black text-slate-950">
                          {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold text-slate-300">Total</p>
              <p className="mt-1 text-4xl font-black">{subtotal.toLocaleString('fr-FR')} CFA</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {['cash', 'wave', 'orange_money', 'card', 'credit'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      paymentMethod === method
                        ? paymentStyle(method)
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {paymentLabel(method)}
                  </button>
                ))}
              </div>

              {paymentMethod === 'credit' && !selectedCustomer && (
                <div className="mt-4 rounded-2xl bg-red-500/15 p-3 text-sm font-bold text-red-200">
                  Sélectionnez un client pour Client Doit.
                </div>
              )}

              <button
                onClick={checkout}
                disabled={checkoutLoading || cart.length === 0}
                className="mt-5 w-full rounded-2xl bg-emerald-600 py-4 text-lg font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-40"
              >
                {checkoutLoading ? 'Enregistrement...' : 'Encaisser'}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
