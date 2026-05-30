export interface SaleItem {
  product_name: string
  quantity: number
  price: number
  total: number
}

export interface SaleData {
  id: string
  total: number
  payment_method: string
  items: SaleItem[]
  created_at?: string
  customer_name?: string
}

export interface BusinessData {
  name: string
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
}

export interface OrderData {
  id: string
  customer_name: string
  customer_phone?: string | null
  product_name: string
  quantity: number
  total: number
  business_name?: string
}

// Normalize any phone to +221XXXXXXXXX (Senegal default country code)
export function formatPhone(raw: string): string {
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('221')) return `+${digits}`
  if (digits.length <= 9) return `+221${digits}`
  return `+${digits}`
}

function cfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Especes',
    wave: 'Wave',
    orange_money: 'Orange Money',
    card: 'Carte bancaire',
    credit: 'Credit client',
  }
  return map[method] || method
}

interface SendOptions {
  body: string
  template?: string
  variables?: Record<string, string>
}

async function send(to: string, opts: SendOptions): Promise<void> {
  const phone = formatPhone(to)
  console.log('[WhatsApp] send() called — to:', phone, '| template:', opts.template || 'none')
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, body: opts.body, template: opts.template, variables: opts.variables }),
    })
    const data = await res.json()
    console.log('[WhatsApp] send() response:', data)
    if (data.method === 'fallback' && data.url && typeof window !== 'undefined') {
      console.log('[WhatsApp] opening wa.me fallback:', data.url)
      window.open(data.url, '_blank')
    }
  } catch (err) {
    console.error('[WhatsApp] send() error:', err)
    if (typeof window !== 'undefined') {
      const fallbackUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(opts.body)}`
      console.log('[WhatsApp] catch fallback wa.me:', fallbackUrl)
      window.open(fallbackUrl, '_blank')
    }
  }
}

export async function sendReceipt(
  phone: string,
  saleData: SaleData,
  businessData: BusinessData
): Promise<void> {
  const date = new Date(saleData.created_at || Date.now()).toLocaleDateString('fr-FR')
  const receiptNumber = `REC-${saleData.id.slice(-6).toUpperCase()}`
  const lines = saleData.items
    .map((i) => `  - ${i.product_name} x${i.quantity}  ${cfa(i.total)}`)
    .join('\n')

  const body = [
    `*Recu — ${businessData.name}*`,
    `Date : ${date}`,
    ``,
    lines,
    ``,
    `*Total : ${cfa(saleData.total)}*`,
    `Paiement : ${paymentLabel(saleData.payment_method)}`,
    ``,
    `Merci de votre confiance !`,
  ].join('\n')

  await send(phone, {
    body,
    template: 'receipt',
    variables: {
      '1': saleData.customer_name || 'Client',
      '2': businessData.name,
      '3': receiptNumber,
      '4': cfa(saleData.total),
      '5': paymentLabel(saleData.payment_method),
      '6': date,
    },
  })
}

// Sends payment confirmation to admin number +221784581111
export async function sendPaymentConfirmation(
  businessName: string,
  plan: string,
  amount: number,
  email: string,
): Promise<void> {
  const date = new Date().toLocaleDateString('fr-FR')
  const adminPhone = '+221784581111'

  const body = [
    `*Confirmation de paiement CaissePro*`,
    ``,
    `Boutique : ${businessName}`,
    `Plan : ${plan}`,
    `Montant : ${cfa(amount)}`,
    `Email : ${email}`,
    `Date : ${date}`,
    ``,
    `Paiement recu. Abonnement actif.`,
  ].join('\n')

  await send(adminPhone, {
    body,
    template: 'payment',
    variables: {
      '1': businessName,
      '2': plan,
      '3': cfa(amount),
      '4': email,
      '5': date,
    },
  })
}

export async function sendSubscriptionReminder(
  phone: string,
  merchantName: string,
  planName: string,
  daysLeft: number,
): Promise<void> {
  const urgency =
    daysLeft <= 0
      ? `Votre abonnement a expire.`
      : `Votre abonnement expire dans *${daysLeft} jour${daysLeft > 1 ? 's' : ''}*.`

  const body = [
    `*Rappel abonnement CaissePro*`,
    ``,
    `Bonjour ${merchantName},`,
    ``,
    urgency,
    ``,
    `Renouvelez maintenant : https://caissepro.app/upgrade`,
  ].join('\n')

  await send(phone, {
    body,
    template: 'reminder',
    variables: {
      '1': merchantName,
      '2': planName,
      '3': String(daysLeft),
    },
  })
}

export async function sendOrderNotification(
  phone: string,
  orderData: OrderData
): Promise<void> {
  const date = new Date().toLocaleDateString('fr-FR')

  const body = [
    `*Nouvelle commande en ligne*`,
    ``,
    `Client : ${orderData.customer_name}`,
    orderData.customer_phone ? `Tel : ${orderData.customer_phone}` : null,
    ``,
    `Produit : ${orderData.product_name}`,
    `Quantite : ${orderData.quantity}`,
    `Total : ${cfa(orderData.total)}`,
    ``,
    `Connectez-vous sur CaissePro pour traiter cette commande.`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  await send(phone, {
    body,
    template: 'order',
    variables: {
      '1': orderData.business_name || 'Ma boutique',
      '2': orderData.customer_name,
      '3': orderData.customer_phone || 'N/A',
      '4': cfa(orderData.total),
      '5': date,
    },
  })
}
