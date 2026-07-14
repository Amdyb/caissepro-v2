import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const paydunya = require('paydunya')

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.plan || !body?.amount || !body?.businessId || !body?.email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { plan, amount, businessId, businessName, email, country } = body as {
    plan: string; amount: number; businessId: string; businessName: string; email: string; country?: string
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caissepro.app'

  const setup = new paydunya.Setup({
    masterKey: process.env.PAYDUNYA_MASTER_KEY || '',
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY || '',
    publicKey:  process.env.PAYDUNYA_PUBLIC_KEY  || '',
    token:      process.env.PAYDUNYA_TOKEN        || '',
    mode:       process.env.PAYDUNYA_MODE         || 'test',
  })

  const store = new paydunya.Store({
    name:          'CaissePro',
    tagline:       "La caisse enregistreuse de l'Afrique",
    phoneNumber:   '+221784581111',
    websiteURL:    'https://caissepro.app',
    logoURL:       'https://caissepro.app/caissepro-logo.png',
    callbackURL:   `${appUrl}/api/paydunya/webhook`,
    cancelURL:     `${appUrl}/upgrade/cancelled`,
    returnURL:     `${appUrl}/upgrade/success?plan=${encodeURIComponent(plan)}`,
  })

  const supabase = adminClient()

  await supabase.from('upgrade_requests').insert({
    business_id:     businessId,
    business_name:   businessName || 'Inconnu',
    user_email:      email,
    plan,
    price:           `${amount} XOF`,
    status:          'pending_payment',
    whatsapp_sent:   false,
    duration_months: 2, // 1 mois payé + 1 mois offert (promo nouveaux inscrits)
  })

  try {
    const invoice = new paydunya.CheckoutInvoice(setup, store)
    invoice.addItem(plan, 1, amount, amount, `Abonnement CaissePro ${plan} — 1 mois offert`)
    invoice.totalAmount = amount
    invoice.description = `Abonnement CaissePro ${plan}`
    invoice.addCustomData('plan', plan)
    invoice.addCustomData('business_id', businessId)
    invoice.addCustomData('business_name', businessName)
    invoice.addCustomData('email', email)
    if (country) invoice.addCustomData('country', country)

    await invoice.create()
    console.log('[PayDunya] invoice created, url:', invoice.url)

    if (!invoice.url) {
      return NextResponse.json({ error: 'PayDunya did not return a payment URL' }, { status: 502 })
    }

    return NextResponse.json({ payment_url: invoice.url, token: invoice.token })
  } catch (err: any) {
    console.error('[PayDunya] checkout error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Payment initialization failed' }, { status: 500 })
  }
}
