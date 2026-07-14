import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Stripe signature verification requires the raw, unparsed body.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'
const ADMIN_PHONE = '+221784581111'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendWhatsApp(to: string, body: string) {
  await fetch(`${APP_URL}/api/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, body }),
  }).catch(() => null)
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe/webhook] Stripe keys not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[stripe/webhook] Service role key not configured')
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature') || ''
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[stripe/webhook] signature verification failed:', err?.message || err)
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata || {}
  const businessId = meta.businessId
  const plan = (meta.plan || '').toLowerCase()
  const businessName = meta.businessName || 'Client'
  const email = meta.email || session.customer_details?.email || ''
  const amount = Number(meta.amount || 0) || (session.amount_total ?? 0)

  if (!businessId || !plan) {
    console.error('[stripe/webhook] missing metadata:', meta)
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = adminClient()

  // Promo nouveaux inscrits : 1 mois payé + 1 mois offert = 2 mois total.
  // Starts at activation (payment confirmed), not at signup.
  // Agent referrals do NOT stack — referred merchants still get 1 month max bonus.
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 2)

  await supabase.from('subscriptions').delete().eq('business_id', businessId)
  const { error: subErr } = await supabase.from('subscriptions').insert({
    business_id: businessId,
    plan,
    status: 'active',
    starts_at: now.toISOString(),
    started_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  })
  if (subErr) {
    console.error('[stripe/webhook] subscription insert error:', subErr.message)
    return NextResponse.json({ error: subErr.message }, { status: 500 })
  }

  await supabase.from('businesses').update({ plan }).eq('id', businessId)

  // Mark any pending upgrade request as paid (best-effort).
  await supabase
    .from('upgrade_requests')
    .update({ status: 'paid', approved_at: now.toISOString() })
    .eq('business_id', businessId)
    .eq('status', 'pending')

  console.log(`[stripe/webhook] activated plan=${plan} for business=${businessId} until ${expiresAt.toISOString()}`)

  // Notify merchant + admin (non-blocking).
  const amountStr = `${Number(amount).toLocaleString('fr-FR')} XOF`
  const dateStr = now.toLocaleDateString('fr-FR')

  const { data: biz } = await supabase
    .from('businesses')
    .select('phone')
    .eq('id', businessId)
    .maybeSingle()

  if (biz?.phone) {
    await sendWhatsApp(
      biz.phone,
      `Paiement reçu ! Votre abonnement CaissePro ${plan} est actif jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}. Merci de votre confiance !`
    )
  }

  await sendWhatsApp(
    ADMIN_PHONE,
    `PAIEMENT CARTE (Stripe)\nBoutique: ${businessName}\nPlan: ${plan}\nMontant: ${amountStr}\nEmail: ${email}\nDate: ${dateStr}\nAbonnement actif jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`
  )

  return NextResponse.json({ received: true, success: true })
}
