import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPaymentInvoice } from '@/lib/paydunya'

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

  const { plan, amount, businessId, businessName, email } = body as {
    plan: string
    amount: number
    businessId: string
    businessName: string
    email: string
  }

  const supabase = adminClient()

  // Record the pending payment intent
  await supabase.from('upgrade_requests').insert({
    business_id:     businessId,
    business_name:   businessName || 'Inconnu',
    user_email:      email,
    plan,
    price:           `${amount} XOF`,
    status:          'pending_payment',
    whatsapp_sent:   false,
    duration_months: 2,
  })

  try {
    const result = await createPaymentInvoice(plan, amount, businessName, email, businessId)
    console.log('[PayDunya] invoice created:', result)

    if (result.response_code !== '00') {
      return NextResponse.json(
        { error: result.description || 'Erreur PayDunya' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      payment_url: result.invoice_url,
      token:       result.token,
    })
  } catch (err: any) {
    console.error('[PayDunya] checkout error:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Initialisation du paiement échouée' },
      { status: 500 }
    )
  }
}
