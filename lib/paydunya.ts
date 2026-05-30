// eslint-disable-next-line @typescript-eslint/no-require-imports
const paydunya = require('paydunya')

const setup = new paydunya.Setup({
  masterKey: process.env.PAYDUNYA_MASTER_KEY || '',
  privateKey: process.env.PAYDUNYA_PRIVATE_KEY || '',
  publicKey:  process.env.PAYDUNYA_PUBLIC_KEY  || '',
  token:      process.env.PAYDUNYA_TOKEN       || '',
  mode:       process.env.PAYDUNYA_MODE        || 'test',
})

const store = new paydunya.Store({
  name:          'CaissePro',
  tagline:       "La caisse enregistreuse de l'Afrique",
  phoneNumber:   '+221784581111',
  postalAddress: 'Dakar, Sénégal',
  websiteURL:    'https://caissepro.app',
  logoURL:       'https://caissepro.app/caissepro-logo.png',
  callbackURL:   `${process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'}/api/paydunya/webhook`,
  cancelURL:     `${process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'}/upgrade/cancelled`,
  returnURL:     `${process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'}/upgrade/success`,
})

export interface InvoiceResult {
  response_code: string
  token: string
  description: string
  response_text: string
  invoice_url?: string
}

export async function createPaymentInvoice(
  plan: string,
  amount: number,
  businessName: string,
  email: string,
  businessId: string
): Promise<InvoiceResult> {
  const invoice = new paydunya.CheckoutInvoice(setup, store)
  invoice.addItem(plan, 1, amount, amount, `Abonnement CaissePro ${plan}`)
  invoice.totalAmount = amount
  invoice.description = `Abonnement CaissePro ${plan} - 2 mois offerts!`
  invoice.addCustomData('plan', plan)
  invoice.addCustomData('business_name', businessName)
  invoice.addCustomData('email', email)
  invoice.addCustomData('business_id', businessId)

  return await invoice.create()
}
