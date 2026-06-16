import Stripe from 'stripe'

// Lazy singleton so a missing key never crashes import/build — only throws when
// a Stripe call is actually attempted.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'

// XOF (West African CFA franc) is a zero-decimal currency: the smallest unit is
// the franc itself, so unit_amount equals the price (5000 XOF -> 5000), unlike
// EUR/USD which would be x100.
export type CheckoutParams = {
  businessId: string
  plan: string // 'starter' | 'business' | 'premium'
  amount: number // XOF
  billingPeriod?: string
  businessName?: string
  email?: string
}

export async function createCheckoutSession(params: CheckoutParams): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  const { businessId, plan, amount, billingPeriod = 'monthly', businessName, email } = params

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'xof',
          unit_amount: Math.round(amount), // zero-decimal: no x100
          product_data: {
            name: `CaissePro — Abonnement ${plan}`,
            description: "Offre promo : 1 mois payé = 2 mois d'utilisation",
          },
        },
      },
    ],
    ...(email ? { customer_email: email } : {}),
    success_url: `${APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/upgrade/cancelled`,
    metadata: {
      businessId,
      plan,
      billingPeriod,
      amount: String(amount),
      businessName: businessName || '',
      email: email || '',
    },
  })
}
