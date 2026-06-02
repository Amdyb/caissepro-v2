import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentConfirmation } from '@/lib/whatsapp'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[PayDunya IPN] received:', JSON.stringify(body))

  // PayDunya sends: body.data.status, body.data.invoice.custom_data, body.data.invoice.total_amount
  const data        = body?.data || body
  const status      = data?.status
  const customData  = data?.invoice?.custom_data || data?.custom_data || {}
  const totalAmount = data?.invoice?.total_amount || data?.total_amount || 0

  if (status !== 'completed') {
    console.log('[PayDunya IPN] status not completed:', status)
    return NextResponse.json({ received: true })
  }

  const businessId   = customData.business_id
  const plan         = customData.plan
  const businessName = customData.business_name || 'Client'
  const email        = customData.email || ''

  if (!businessId || !plan) {
    console.error('[PayDunya IPN] missing custom data:', customData)
    return NextResponse.json({ error: 'Missing custom data' }, { status: 400 })
  }

  const supabase = adminClient()

  // Mark upgrade_request as paid
  await supabase
    .from('upgrade_requests')
    .update({ status: 'paid', approved_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('status', 'pending_payment')

  // Activate subscription for 2 months
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 2)

  await supabase.from('subscriptions').delete().eq('business_id', businessId)
  await supabase.from('subscriptions').insert({
    business_id: businessId,
    plan,
    status:     'active',
    starts_at:  new Date().toISOString(),
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  })

  // Update business plan
  await supabase.from('businesses').update({ plan }).eq('id', businessId)

  console.log(`[PayDunya IPN] activated plan=${plan} for business=${businessId} until ${expiresAt.toISOString()}`)

  // WhatsApp to merchant + admin (non-blocking)
  sendPaymentConfirmation(businessName, plan, totalAmount, email)
    .catch((err) => console.error('[PayDunya IPN] WhatsApp error:', err))

  return NextResponse.json({ success: true })
}
