import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.to || !body?.message) {
    return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
  }

  const { to, message } = body as { to: string; message: string }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

  if (accountSid && authToken) {
    try {
      const digits = to.replace(/\D/g, '')
      const phone  = digits.startsWith('221') ? `+${digits}` : `+221${digits}`

      const client = twilio(accountSid, authToken)
      await client.messages.create({
        from,
        to: `whatsapp:${phone}`,
        body: message,
      })

      return NextResponse.json({ success: true, method: 'twilio' })
    } catch (err) {
      console.error('Twilio error:', err)
    }
  }

  // Fallback: return wa.me URL for client to open
  const digits = to.replace(/\D/g, '')
  const phone  = digits.startsWith('221') ? `+${digits}` : `+221${digits}`
  const url    = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  return NextResponse.json({ success: true, method: 'fallback', url })
}
