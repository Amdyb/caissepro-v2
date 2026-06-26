import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { OWNER_ROLES } from '@/lib/permissions'

// Server-side Web Push fan-out. Uses the service-role key so it can read every
// device subscription and resolve recipients across users (RLS would block this
// from the browser). Import directly from server routes, or POST to
// /api/push/send from the client.

const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

// Maps a push "type" to the notification_preferences column that gates it.
// Types without an entry (e.g. 'agent', 'info') are always delivered.
const PREF_COLUMN: Record<string, string> = {
  order: 'new_orders',
  low_stock: 'low_stock',
  subscription: 'subscription_reminders',
  ticket: 'ticket_replies',
  payment: 'payment_confirmations',
  daily: 'daily_summary',
}

export type SendPushOptions = {
  userIds?: string[]
  businessId?: string
  adminBroadcast?: boolean
  title: string
  body: string
  url?: string
  type?: string
}

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function vapidReady(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:infos@dakarvapes.com', pub, priv)
  return true
}

export async function sendPushTo(opts: SendPushOptions): Promise<{ sent: number; failed: number; skipped?: string }> {
  if (!vapidReady()) return { sent: 0, failed: 0, skipped: 'vapid-not-configured' }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { sent: 0, failed: 0, skipped: 'no-service-role' }

  const sb = adminClient()
  const recipients = new Set<string>((opts.userIds || []).filter(Boolean))

  // Business owners/managers/admins of a business.
  if (opts.businessId) {
    const { data: members } = await sb
      .from('business_members')
      .select('user_id, role')
      .eq('business_id', opts.businessId)
    for (const m of members || []) {
      if (m.user_id && OWNER_ROLES.includes(m.role || '')) recipients.add(m.user_id)
    }
  }

  // Platform admins + founders.
  if (opts.adminBroadcast) {
    const { data: admins } = await sb.from('admin_users').select('user_id, status').eq('status', 'active')
    for (const a of admins || []) if (a.user_id) recipients.add(a.user_id)
    try {
      const { data: list } = await sb.auth.admin.listUsers()
      for (const u of list?.users || []) {
        if (u.email && FOUNDER_EMAILS.includes(u.email.toLowerCase())) recipients.add(u.id)
      }
    } catch {
      /* listUsers may be unavailable; admin_users rows still covered */
    }
  }

  let userIds = Array.from(recipients)
  if (userIds.length === 0) return { sent: 0, failed: 0, skipped: 'no-recipients' }

  // Respect notification_preferences for gated types (default ON when no row).
  const prefCol = opts.type ? PREF_COLUMN[opts.type] : null
  if (prefCol) {
    const { data: prefs } = await sb
      .from('notification_preferences')
      .select(`user_id, ${prefCol}`)
      .in('user_id', userIds)
    const disabled = new Set<string>()
    for (const p of (prefs as any[]) || []) {
      if (p[prefCol] === false) disabled.add(p.user_id)
    }
    userIds = userIds.filter((id) => !disabled.has(id))
    if (userIds.length === 0) return { sent: 0, failed: 0, skipped: 'all-opted-out' }
  }

  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs || subs.length === 0) return { sent: 0, failed: 0, skipped: 'no-subscriptions' }

  const payload = JSON.stringify({ title: opts.title, body: opts.body, url: opts.url || '/dashboard' })
  let sent = 0
  let failed = 0
  const dead: string[] = []

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
        sent++
      } catch (err: any) {
        failed++
        // 404/410 = subscription gone for good → prune it.
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.id)
      }
    })
  )

  if (dead.length) {
    await sb.from('push_subscriptions').delete().in('id', dead)
  }

  return { sent, failed }
}
