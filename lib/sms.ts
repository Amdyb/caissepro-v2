import twilio from 'twilio'

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set')
  }
  return twilio(accountSid, authToken)
}

function getFrom(): string {
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) throw new Error('TWILIO_PHONE_NUMBER must be set')
  return from
}

function normalizePhone(raw: string): string {
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('221')) return `+${digits}`
  if (digits.length <= 9) return `+221${digits}`
  return `+${digits}`
}

function cfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export async function sendSaleNotification(
  phone: string,
  shopName: string,
  amount: number,
  product: string
): Promise<void> {
  const to = normalizePhone(phone)
  const body = `[${shopName}] Nouvelle vente : ${product} — ${cfa(amount)}. Merci !`
  const msg = await getClient().messages.create({ from: getFrom(), to, body })
  console.log(`[SMS] sale notification sent to ${to} — SID: ${msg.sid}`)
}

export async function sendOTP(phone: string, otp: string): Promise<void> {
  const to = normalizePhone(phone)
  const body = `Votre code de verification CaissePro est : ${otp}. Il expire dans 10 minutes. Ne le partagez pas.`
  const msg = await getClient().messages.create({ from: getFrom(), to, body })
  console.log(`[SMS] OTP sent to ${to} — SID: ${msg.sid}`)
}

export async function sendLowStockAlert(
  phone: string,
  productName: string,
  quantity: number
): Promise<void> {
  const to = normalizePhone(phone)
  const body = `[CaissePro] Stock faible : "${productName}" — il reste ${quantity} unite${quantity > 1 ? 's' : ''}. Pensez a reapprovisionner.`
  const msg = await getClient().messages.create({ from: getFrom(), to, body })
  console.log(`[SMS] low stock alert sent to ${to} — SID: ${msg.sid}`)
}
