import { NextRequest, NextResponse } from 'next/server'
import { sendPushTo, type SendPushOptions } from '@/lib/pushServer'

// web-push needs the Node.js runtime (crypto / not edge-compatible).
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<SendPushOptions>

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
