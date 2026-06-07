'use client'

import { CreditCard, MessageCircle, ReceiptText, X } from 'lucide-react'
import Link from 'next/link'

export default function POSCheckoutDrawer({
  open,
  onClose,
  total,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  newCustomer,
  setNewCustomer,
  addCustomer,
  paymentMethod,
  setPaymentMethod,
  checkout,
  checkoutLoading,
  sendWhatsAppReceipt,
  completedSaleId,
  drawerMessage,
}: any) {
  if (!open) return null

  if (completedSaleId) {
    const customer = customers.find((c: any) => c.id === selectedCustomerId)
    return (
      <>
        <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed right-0 top-0 z-[999] flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-black text-slate-950">Vente confirmée</h2>
            <button onClick={onClose} className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
              <ReceiptText size={36} />
            </div>

            <div>
              <p className="text-3xl font-black text-slate-950">
                {Number(total || 0).toLocaleString('fr-FR')} CFA
              </p>
              {customer && (
                <p className="mt-1 text-sm font-bold text-slate-500">{customer.full_name}</p>
              )}
            </div>

            <div className="w-full space-y-3">
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
                <MessageCircle size={20} /> Envoyer sur WhatsApp
              </button>

              <button
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-950 py-4 text-base font-black text-white hover:bg-slate-800"
              >
                Nouvelle vente
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const paymentMethods = [
    { id: 'cash', label: 'Espèces' },
    { id: 'wave', label: 'Wave' },
    { id: 'orange_money', label: 'Orange Money' },
    { id: 'card', label: 'Carte' },
    { id: 'credit', label: 'Client Doit' }
  ]

  return (
    <>
      <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 z-[999] h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-3xl font-black text-slate-950">Checkout</h2>
            <p className="text-sm font-semibold text-slate-500">Finaliser la vente</p>
          </div>

          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {drawerMessage && (
            <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-black ${drawerMessage.includes('succès') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {drawerMessage}
            </div>
          )}

          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl">
            <p className="text-sm font-bold text-slate-300">Total</p>
            <p className="mt-2 text-5xl font-black">{Number(total || 0).toLocaleString('fr-FR')} CFA</p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Client</h3>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold outline-none"
            >
              <option value="">Vente sans client</option>
              {customers.map((customer: any) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} {customer.phone ? `• ${customer.phone}` : ''}
                </option>
              ))}
            </select>

            <div className="mt-4 grid gap-3">
              <input
                value={newCustomer.full_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                placeholder="Nouveau client"
                className="rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none"
              />

              <input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Téléphone WhatsApp"
                className="rounded-2xl border border-slate-300 px-4 py-4 font-bold outline-none"
              />

              <button
                type="button"
                onClick={addCustomer}
                className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white"
              >
                Ajouter client
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Paiement</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-2xl px-4 py-4 text-sm font-black transition ${paymentMethod === method.id ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={checkout}
            disabled={checkoutLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white shadow-2xl shadow-emerald-200 disabled:opacity-40"
          >
            <CreditCard size={20} />
            {checkoutLoading ? 'Validation...' : 'Confirmer la vente'}
          </button>

          <button
            onClick={sendWhatsAppReceipt}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-700"
          >
            <MessageCircle size={18} />
            Envoyer reçu WhatsApp
          </button>
        </div>
      </div>
    </>
  )
}
