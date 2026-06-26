import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushTo, type SendPushOptions } from '@/lib/pushServer'

// web-push needs the Node.js runtime (crypto / not edge-compatible).
export const runtime = 'nodejs'

const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function isSuperAdmin(sb: ReturnType<typeof adminClient>, userId: string, email?: string | null): Promise<boolean> {
  if (email && FOUNDER_EMAILS.includes(email.toLowerCase())) return true
  const { data } = await sb.from('admin_users').select('user_id').eq('user_id', userId).eq('status', 'active').maybeSingle()
  return !!data
}

// A real, recent order must exist for the business before we let an anonymous
// caller fire an order notification (prevents storefront-path abuse).
async function hasRecentOrder(sb: ReturnType<typeof adminClient>, businessId: string): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data } = await sb
    .from('online_orders')
    .select('id')
    .eq('business_id', businessId)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'no-service-role' }, { status: 500 })
  }

  const body = (await req.json().catch(() => ({}))) as Partial<SendPushOptions>
  const sb = adminClient()

  // 1) Trusted server callers: shared secret grants full access.
  const secret = process.env.PUSH_SEND_SECRET
  const trusted = !!secret && req.headers.get('x-push-secret') === secret

  if (trusted) {
    return dispatch(body)
  }

  // 2) Authenticated in-app callers: scope by who they are.
  const authz = req.headers.get('authorization') || ''
  if (authz.startsWith('Bearer ')) {
    const { data: userData } = await sb.auth.getUser(authz.slice(7))
    const user = userData.user
    if (user) {
      // Targeting other users / admins → super-admins only.
      if (body.userIds || body.adminBroadcast) {
        if (!(await isSuperAdmin(sb, user.id, user.email))) {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        }
        return dispatch(body)
      }
      // Targeting a business → must be a member of that business.
      if (body.businessId) {
        const { data: member } = await sb
          .from('business_members')
          .select('id')
          .eq('business_id', body.businessId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!member) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        return dispatch(body)
      }
      return NextResponse.json({ error: 'no-target' }, { status: 400 })
    }
  }

  // 3) Anonymous (storefront): order notifications only, and only if a real
  //    recent order exists. Content is templated server-side (no injection).
  const type = body.type
  if (type !== 'new_order' && type !== 'order') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!body.businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }
  if (!(await hasRecentOrder(sb, body.businessId))) {
    return NextResponse.json({ error: 'no-matching-order' }, { status: 403 })
  }

  return dispatch({
    businessId: body.businessId,
    type: 'order',
    title: 'Nouvelle commande !',
    body: 'Vous avez reçu une nouvelle commande en ligne.',
    url: '/orders',
  })
}

async function dispatch(body: Partial<SendPushOptions>) {
  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
  }
  if (!body.userIds && !body.businessId && !body.adminBroadcast) {
    return NextResponse.json({ error: 'one of userIds, businessId, adminBroadcast is required' }, { status: 400 })
  }
  try {
    const result = await sendPushTo({
      userIds: body.userIds,
      businessId: body.businessId,
      adminBroadcast: body.adminBroadcast,
      title: body.title,
      body: body.body,
      url: body.url,
      type: body.type,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[push/send] error:', err)
    return NextResponse.json({ error: err?.message || 'send failed' }, { status: 500 })
  }
}
