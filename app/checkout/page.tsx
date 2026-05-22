'use client'

import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { CreditCard, MessageCircle, ShoppingCart, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const paymentMethods = [
  { id: 'cash', label: 'Cash' },
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

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white">
              <CreditCard size={20} />Confirmer la vente
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
