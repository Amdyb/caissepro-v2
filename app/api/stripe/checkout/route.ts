import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'

// Server-authoritative prices (XOF) so the amount can't be tampered with from
// the client. Falls back to the posted amount only if the plan is unknown.
const PLAN_PRICES: Record<string, number> = {
  starter: 5000,
  business: 15000,
  premium: 35000,
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[stripe/checkout] STRIPE_SECRET_KEY not configured')
    return NextResponse.json(
      { error: "Paiement par carte indisponible : configuration Stripe manquante (STRIPE_SECRET_KEY)." },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const businessId = body.businessId as string | undefined
  const plan = ((body.plan as string) || '').toLowerCase().trim()
  const billingPeriod = (body.billingPeriod as string) || 'monthly'
  const businessName = (body.businessName as string) || ''
  const email = (body.email as string) || ''

  if (!businessId) {
    return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 400 })
  }
  if (!plan || !(plan in PLAN_PRICES)) {
    return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })
  }

  const amount = PLAN_PRICES[plan] ?? Number(body.amount || 0)
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
  }

  try {
    const session = await createCheckoutSession({ businessId, plan, amount, billingPeriod, businessName, email })
    return NextResponse.json({ url: session.url, id: session.id })
  } catch (err: any) {
    console.error('[stripe/checkout] error:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || "Erreur lors de l'initialisation du paiement par carte." },
      { status: 500 }
    )
  }
}
