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
}

export interface BusinessData {
  name: string
  phone?: string | null
  whatsapp?: string | null
}

export interface OrderData {
  id: string
  customer_name: string
  customer_phone?: string | null
  product_name: string
  quantity: number
  total: number
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

async function send(to: string, message: string): Promise<void> {
  const phone = formatPhone(to)
  console.log('[WhatsApp] send() called — to:', phone)
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, message }),
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
      const fallbackUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`
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
  const lines = saleData.items
    .map((i) => `  - ${i.product_name} x${i.quantity}  ${cfa(i.total)}`)
    .join('\n')

  const message = [
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

  await send(phone, message)
}

export async function sendPaymentConfirmation(
  phone: string,
  plan: string,
  amount: number
): Promise<void> {
  const message = [
    `*Confirmation de paiement CaissePro*`,
    ``,
    `Plan : ${plan}`,
    `Montant : ${cfa(amount)}`,
    ``,
    `Paiement recu. Votre abonnement sera active sous peu.`,
    `Merci !`,
  ].join('\n')

  await send(phone, message)
}

export async function sendSubscriptionReminder(
  phone: string,
  businessName: string,
  daysLeft: number
): Promise<void> {
  const urgency =
    daysLeft <= 0
      ? `Votre abonnement a expire.`
      : `Votre abonnement expire dans *${daysLeft} jour${daysLeft > 1 ? 's' : ''}*.`

  const message = [
    `*Rappel abonnement CaissePro*`,
    ``,
    `Bonjour ${businessName},`,
    ``,
    urgency,
    ``,
    `Renouvelez maintenant : https://caissepro.app/upgrade`,
  ].join('\n')

  await send(phone, message)
}

export async function sendOrderNotification(
  phone: string,
  orderData: OrderData
): Promise<void> {
  const message = [
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

  await send(phone, message)
}
