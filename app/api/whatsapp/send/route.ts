import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('221') ? `+${digits}` : `+221${digits}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.to || !body?.message) {
    return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
  }

  const { to, message } = body as { to: string; message: string }
  const phone = normalizePhone(to)

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+12487030072'

  if (accountSid && authToken) {
    try {
      const client = twilio(accountSid, authToken)
      const msg = await client.messages.create({
        from,
        to: `whatsapp:${phone}`,
        body: message,
      })
      console.log(`[Twilio] sent to ${phone} — SID: ${msg.sid}`)
      return NextResponse.json({ success: true, method: 'twilio', sid: msg.sid })
    } catch (err: any) {
      console.error(`[Twilio] error sending to ${phone}:`, err?.message || err)
      return NextResponse.json(
        { success: false, method: 'twilio_error', error: err?.message || 'Twilio error' },
        { status: 502 }
      )
    }
  }

  // No Twilio credentials — return wa.me fallback URL for client to open
  console.log('[WhatsApp] no Twilio credentials, returning wa.me fallback')
  const url = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`
  return NextResponse.json({ success: true, method: 'fallback', url })
}
