'use client'

import AppShell from '@/components/AppShell'
import POSCheckoutDrawer from '@/components/POSCheckoutDrawer'
import { supabase } from '@/lib/supabaseClient'
import { ImageIcon, Package, Search, ShoppingCart, Trash2, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

type Product = {
  id: string
  business_id: string
  name: string
  category: string | null
  barcode: string | null
  sell_price: number | null
  minimum_price: number | null
  stock: number | null
  image: string | null
}

export default function POSPage() {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((product) => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q) || (product.category || '').toLowerCase().includes(q) || (product.barcode || '').toLowerCase().includes(q)
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) return

      setBusinessId(membership.business_id)

      const { data: productData } = await supabase
        .from('products')
        .select('id,business_id,name,category,barcode,sell_price,minimum_price,stock,image')
        .eq('business_id', membership.business_id)
        .order('name')

      const { data: customerData } = await supabase
        .from('customers')
        .select('id,full_name,phone')
        .eq('business_id', membership.business_id)
        .order('full_name')

      setProducts((productData || []) as Product[])
      setCustomers(customerData || [])

      const savedCart = localStorage.getItem('caissepro-pos-cart')
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch {}
      }
    }

    init()
  }, [])

  useEffect(() => {
    localStorage.setItem('caissepro-pos-cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product: Product) {
    if (Number(product.stock || 0) <= 0) {
      setMessage('Produit en rupture de stock.')
      return
    }

    setCart((current: any[]) => {
      const existing = current.find((item) => item.product.id === product.id)

      if (existing) {
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }

      return [...current, {
        product,
        quantity: 1,
        price: Number(product.sell_price || 0)
      }]
    })

    barcodeInputRef.current?.focus()
  }

  function removeItem(productId: string) {
    setCart((current: any[]) => current.filter((item) => item.product.id !== productId))
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()

    const code = barcodeInput.trim()
    if (!code) return

    const match = products.find((product) =>
      (product.barcode || '').toLowerCase() === code.toLowerCase()
    ) || products.find((product) =>
      product.name.toLowerCase().includes(code.toLowerCase())
    )

    if (!match) {
      setMessage('Produit introuvable.')
      return
    }

    addToCart(match)
    setBarcodeInput('')
  }

  async function addCustomer() {
    if (!businessId || !newCustomer.full_name.trim()) return

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        full_name: newCustomer.full_name.trim(),
        phone: newCustomer.phone || null,
        points: 0,
        total_spent: 0,
        debt_balance: 0
      })
      .select('id,full_name,phone')
      .limit(1)

    if (error) {
      setMessage(error.message)
      return
    }

    const created = data?.[0]

    if (created) {
      setCustomers((prev) => [created, ...prev])
      setSelectedCustomerId(created.id)
      setNewCustomer({ full_name: '', phone: '' })
    }
  }

  async function checkout() {
    if (!businessId || cart.length === 0) return

    setCheckoutLoading(true)

    try {
      const salePayload = {
        business_id: businessId,
        total,
        customer_id: selectedCustomerId || null,
        payment_method: paymentMethod
      }

      const { error: saleError } = await supabase
        .from('sales')
        .insert(salePayload)

      if (saleError) {
        throw saleError
      }

      for (const item of cart) {
        const currentStock = Number(item.product.stock || 0)
        const newStock = Math.max(0, currentStock - Number(item.quantity || 0))

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id)
      }

      setProducts((prev) =>
        prev.map((product) => {
          const soldItem = cart.find((item: any) => item.product.id === product.id)

          if (!soldItem) return product

          return {
            ...product,
            stock: Math.max(0, Number(product.stock || 0) - Number(soldItem.quantity || 0))
          }
        })
      )

      setCheckoutLoading(false)
      setCheckoutOpen(false)
      setCart([])
      localStorage.removeItem('caissepro-pos-cart')
      setMessage('Vente enregistrée avec succès.')
    } catch (err: any) {
      setCheckoutLoading(false)
      setMessage(err?.message || 'Erreur lors de l’enregistrement de la vente.')
    }
  }

  function sendWhatsAppReceipt() {
    const customer = customers.find((c) => c.id === selectedCustomerId)

    if (!customer?.phone) {
      setMessage('Numéro client requis.')
      return
    }

    const phone = customer.phone.replace(/\D/g, '')

    const text = encodeURIComponent(
      `Bonjour ${customer.full_name},\n\nMerci pour votre achat.\n\nMontant: ${total.toLocaleString('fr-FR')} CFA\nPaiement: ${paymentMethod}\n\nMerci pour votre confiance.`
    )

    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  return <div />
}
