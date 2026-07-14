'use client'

import AppShell from '@/components/AppShell'
import { savePendingSale } from '@/lib/offlineStore'
import { supabase } from '@/lib/supabaseClient'
import { formatPhone, sendReceipt } from '@/lib/whatsapp'
import { CreditCard, MessageCircle, ReceiptText, ShoppingCart, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const paymentMethods = [
  { id: 'cash', label: 'Espèces' },
  { id: 'wave', label: 'Wave' },
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'card', label: 'Carte' },
  { id: 'credit', label: 'Client Doit' }
]

export default function CheckoutPage() {
  const [cart, setCart] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [message, setMessage] = useState('')
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '' })
  const [business, setBusiness] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null)

  const total = useMemo(() => cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0), [cart])
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  useEffect(() => {
    const saved = localStorage.getItem('caissepro-pos-cart')
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch {}
    }

    async function loadCustomers() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.business_id) return

      const [customersResult, businessResult] = await Promise.all([
        supabase
          .from('customers')
          .select('id, full_name, phone')
          .eq('business_id', membership.business_id)
          .order('full_name'),
        supabase
          .from('businesses')
          .select('id, name, phone')
          .eq('id', membership.business_id)
          .maybeSingle()
      ])

      setCustomers(customersResult.data || [])
      setBusiness(businessResult.data)
    }

    loadCustomers()
  }, [])

  async function addCustomer() {
    const name = newCustomer.full_name.trim()
    if (!name) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle()

    if (!membership?.business_id) return

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: membership.business_id,
        full_name: name,
        phone: newCustomer.phone || null,
        points: 0,
        total_spent: 0,
        debt_balance: 0
      })
      .select('id, full_name, phone')
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
      setMessage('Client ajouté.')
    }
  }

  function sendWhatsAppReceipt() {
    const targetPhone = selectedCustomer?.phone || business?.phone

    if (!targetPhone) {
      setMessage('Aucun numéro disponible (client ou boutique).')
      return
    }

    const phone = String(targetPhone).replace(/\D/g, '')

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const businessName = business?.name || 'CaissePro'
    const customerLine = selectedCustomer?.full_name ? `👤 Client: ${selectedCustomer.full_name}` : '👤 Client: Vente comptoir'

    const itemLines = cart
      .map((item) => {
        const name = item.product?.name || item.name || 'Article'
        const qty = item.quantity || 1
        const price = (item.price || 0) * qty
        return `• ${name} x${qty} — ${price.toLocaleString('fr-FR')} CFA`
      })
      .join('\n')

    const paymentLabel: Record<string, string> = {
      cash: 'Espèces',
      wave: 'Wave',
      orange_money: 'Orange Money',
      card: 'Carte bancaire',
      credit: 'Client Doit'
    }

    const text = encodeURIComponent(
      `🧾 *REÇU DE VENTE*\n` +
      `📍 *${businessName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `N° ${receiptNumber}\n` +
      `📅 ${date}\n\n` +
      `${customerLine}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛍️ *ARTICLES*\n\n` +
      `${itemLines}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL: ${total.toLocaleString('fr-FR')} CFA*\n` +
      `💳 Paiement: ${paymentLabel[paymentMethod] || paymentMethod}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Merci pour votre confiance ! 🙏\n` +
      `Propulsé par *CaissePro*`
    )

    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  async function handleCheckout() {
    if (cart.length === 0) return
    setCheckoutLoading(true)
    setMessage('')

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setCheckoutLoading(false); return }

    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle()

    if (!membership?.business_id) {
      setMessage('Aucune boutique trouvée.')
      setCheckoutLoading(false)
      return
    }

    // Offline fallback: save to IndexedDB and show confirmation
    if (!navigator.onLine) {
      const stockUpdates = cart
        .filter((item) => item.product?.id)
        .map((item) => ({
          product_id: item.product.id,
          new_stock: Math.max(0, Number(item.product.stock || 0) - Number(item.quantity || 0)),
        }))

      await savePendingSale({
        localId: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        business_id: membership.business_id,
        customer_id: selectedCustomerId || null,
        payment_method: paymentMethod,
        total,
        paid_amount: paymentMethod === 'credit' ? 0 : total,
        remaining_amount: paymentMethod === 'credit' ? total : 0,
        status: 'completed',
        created_at: new Date().toISOString(),
        items: cart.map((item) => ({
          product_id: item.product?.id || null,
          product_name: item.product?.name || item.name || '',
          product_image: item.product?.image || null,
          unit_price: item.price,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
        stock_updates: stockUpdates,
      })

      localStorage.removeItem('caissepro-pos-cart')
      setCart([])
      setMessage('Vente sauvegardée hors ligne. Elle sera synchronisée à la reconnexion.')
      setCheckoutLoading(false)
      return
    }

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        business_id: membership.business_id,
        customer_id: selectedCustomerId || null,
        payment_method: paymentMethod,
        total,
        paid_amount: paymentMethod === 'credit' ? 0 : total,
        remaining_amount: paymentMethod === 'credit' ? total : 0,
        status: 'completed'
      })
      .select()
      .maybeSingle()

    if (saleError || !saleData) {
      setMessage(saleError?.message || 'Erreur lors de la vente.')
      window.dispatchEvent(new Event('play-error'))
      setCheckoutLoading(false)
      return
    }

    const saleItems = cart.map((item) => ({
      sale_id: saleData.id,
      product_id: item.product?.id || null,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
      product_name: item.product?.name || item.name || null,
      product_image: item.product?.image || null,
      unit_price: item.price
    }))

    const { error: itemError } = await supabase.from('sale_items').insert(saleItems)
    if (itemError) {
      console.error('[Checkout] sale_items insert error:', itemError)
      // Roll back the orphaned sale row so the DB stays consistent.
      await supabase.from('sales').delete().eq('id', saleData.id)
      setMessage(`Erreur enregistrement produits: ${itemError.message}`)
      window.dispatchEvent(new Event('play-error'))
      setCheckoutLoading(false)
      return
    }

    for (const item of cart) {
      if (!item.product?.id) continue
      const newStock = Math.max(0, Number(item.product.stock || 0) - Number(item.quantity || 0))
      await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id)
    }

    localStorage.removeItem('caissepro-pos-cart')
    setCart([])
    setCompletedSaleId(saleData.id)
    window.dispatchEvent(new Event('play-sale'))
    setCheckoutLoading(false)

    // Auto-send WhatsApp receipt if customer has a phone number
    const customerPhone = selectedCustomer?.phone
    console.log('[Checkout] sale confirmed, customer phone:', customerPhone, '| business phone:', business?.phone)
    if (customerPhone) {
      const formattedPhone = formatPhone(customerPhone)
      console.log('[Checkout] sending WhatsApp receipt to:', formattedPhone)
      sendReceipt(
        formattedPhone,
        {
          id: saleData.id,
          total,
          payment_method: paymentMethod,
          items: saleItems.map((i: any) => ({
            product_name: i.product_name || '',
            quantity: i.quantity,
            price: i.unit_price,
            total: i.total,
          })),
          created_at: new Date().toISOString(),
        },
        { name: business?.name || 'CaissePro', phone: business?.phone }
      ).then(() => {
        console.log('[Checkout] WhatsApp receipt sent successfully')
      }).catch((err) => {
        console.error('[Checkout] WhatsApp receipt error:', err)
      })
    } else {
      console.log('[Checkout] no customer phone — skipping WhatsApp auto-send')
    }
  }

  if (completedSaleId) {
    return (
      <AppShell title="Paiement confirmé" subtitle="La vente a été enregistrée avec succès.">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <ReceiptText size={28} />
            </div>
            <h2 className="text-2xl font-black text-slate-950">Vente enregistrée !</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {selectedCustomer ? `Client : ${selectedCustomer.full_name}` : 'Vente comptoir'}
              {' · '}
              {total.toLocaleString('fr-FR')} CFA
            </p>
          </div>

          <Link
            href={`/sales/${completedSaleId}/receipt`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
          >
            <ReceiptText size={20} /> Voir le reçu premium
          </Link>

          <button
            onClick={sendWhatsAppReceipt}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-base font-black text-slate-700 hover:bg-slate-50"
          >
            <MessageCircle size={20} /> Partager sur WhatsApp
          </button>

          <Link
            href="/pos"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-base font-black text-white hover:bg-slate-800"
          >
            Nouvelle vente
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Paiement" subtitle="Finalisez la vente et envoyez le reçu WhatsApp.">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <ShoppingCart className="text-emerald-600" />
            <div>
              <h2 className="text-2xl font-black text-slate-950">Résumé panier</h2>
              <p className="text-sm font-semibold text-slate-500">{cart.length} article(s)</p>
            </div>
          </div>

          <div className="space-y-4">
            {cart.map((item, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-slate-950">{item.product?.name || item.name}</p>
                    <p className="text-sm font-semibold text-slate-500">Qté: {item.quantity}</p>
                  </div>
                  <p className="text-lg font-black text-emerald-600">{((item.price || 0) * (item.quantity || 0)).toLocaleString('fr-FR')} CFA</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">Client</h3>

            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold outline-none">
              <option value="">Vente sans client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.full_name} {customer.phone ? `• ${customer.phone}` : ''}</option>
              ))}
            </select>

            <div className="mt-4 grid gap-3">
              <input value={newCustomer.full_name} onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })} placeholder="Nouveau client" className="rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none" />
              <input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Téléphone WhatsApp" className="rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none" />
              <button onClick={addCustomer} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white"><UserPlus size={18} />Ajouter client</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl">
            <p className="text-sm font-bold text-slate-300">Total</p>
            <p className="mt-2 text-5xl font-black">{total.toLocaleString('fr-FR')} CFA</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${paymentMethod === method.id ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white'}`}>
                  {method.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || cart.length === 0}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white disabled:opacity-60"
            >
              <CreditCard size={20} />{checkoutLoading ? 'Validation...' : 'Confirmer la vente'}
            </button>

            <button onClick={sendWhatsAppReceipt} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-4 text-sm font-black text-white">
              <MessageCircle size={18} />Envoyer reçu WhatsApp
            </button>
          </div>

          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</div>}
        </aside>
      </div>
    </AppShell>
  )
}
