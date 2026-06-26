import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushTo } from '@/lib/pushServer'

// Daily cron: notify merchants whose subscription expires in ~7 days.
// Scheduled via vercel.json. web-push needs the Node runtime.
export const runtime = 'nodejs'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(req: NextRequest) {
  // Optional shared-secret guard (set CRON_SECRET in Vercel to enforce).
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'no-service-role' }, { status: 500 })
  }

  const sb = adminClient()

  // Window of (6, 7] days from now → each subscription matches on exactly one
  // daily run, so the reminder fires once.
  const now = Date.now()
  const from = new Date(now + 6 * 86400000).toISOString()
  const to = new Date(now + 7 * 86400000).toISOString()

  const { data: subs, error } = await sb
    .from('subscriptions')
    .select('business_id, plan, expires_at')
    .eq('status', 'active')
    .gt('expires_at', from)
    .lte('expires_at', to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let notified = 0
  for (const s of subs || []) {
    if (!s.business_id) continue
    try {
      await sendPushTo({
        businessId: s.business_id,
        type: 'subscription',
        title: 'Abonnement bientôt expiré',
        body: `Votre abonnement ${s.plan || ''} expire dans 7 jours. Renouvelez pour ne pas perdre l'accès.`.replace('  ', ' '),
        url: '/subscription',
      })
      notified++
    } catch {
      /* keep going */
    }
  }

  return NextResponse.json({ ok: true, checked: subs?.length || 0, notified })
}
