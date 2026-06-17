import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    console.error('[notifications/new-ticket] Service role key not configured')
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const ticketNumber = (body.ticket_number as string) || ''
  const subject = (body.subject as string) || 'Nouveau ticket'
  const name = (body.name as string) || 'Client'

  const supabase = adminClient()

  const recipientIds = new Set<string>()

  const { data: admins } = await supabase
    .from('admin_users')
    .select('user_id, status')
    .eq('status', 'active')
  for (const a of admins || []) {
    if (a.user_id) recipientIds.add(a.user_id as string)
  }

  try {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
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
    title: `Nouveau ticket ${ticketNumber}`.trim(),
    message: `${name} : ${subject}`,
    type: 'info',
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, notified: rows.length })
}
