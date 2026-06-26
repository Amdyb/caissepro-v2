import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushTo } from '@/lib/pushServer'

export const runtime = 'nodejs'

const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[notifications/agent-signup] Service role key not configured')
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const fullName = (body.full_name as string) || 'Nouvel agent'
  const location = [body.city, body.country].filter(Boolean).join(', ')

  const supabase = adminClient()

  // Recipients: active admins with a linked auth account + founders.
  const recipientIds = new Set<string>()

  const { data: admins } = await supabase
    .from('admin_users')
    .select('user_id, email, status')
    .eq('status', 'active')
  for (const a of admins || []) {
    if (a.user_id) recipientIds.add(a.user_id)
  }

  // Resolve founder emails to auth user ids.
  try {
    const { data: list } = await supabase.auth.admin.listUsers()
    for (const u of list?.users || []) {
      if (FOUNDER_EMAILS.includes((u.email || '').toLowerCase())) recipientIds.add(u.id)
    }
  } catch {
    /* non-blocking */
  }

  if (recipientIds.size === 0) {
    return NextResponse.json({ success: true, notified: 0 })
  }

  const rows = Array.from(recipientIds).map((uid) => ({
    user_id: uid,
    business_id: null,
    title: 'Nouvelle candidature agent',
    message: `${fullName}${location ? ` — ${location}` : ''} a postulé pour devenir agent.`,
    type: 'agent',
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Web push to admins/founders (non-blocking; type 'agent' is not user-gated).
  try {
    await sendPushTo({
      userIds: Array.from(recipientIds),
      type: 'agent',
      title: 'Nouvelle candidature agent',
      body: `${fullName}${location ? ` — ${location}` : ''} a postulé pour devenir agent.`,
      url: '/super-admin/agents',
    })
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ success: true, notified: rows.length })
}
