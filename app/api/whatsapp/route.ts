import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.to || !body?.message) {
    return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
  }

  const { to, message } = body as { to: string; message: string }
  const apiToken    = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (apiToken && phoneNumberId) {
    try {
      const phone = to.replace(/\D/g, '')
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        }
      )

      if (res.ok) {
        return NextResponse.json({ success: true, method: 'api' })
      }

      const err = await res.json()
      console.error('WhatsApp API error:', JSON.stringify(err))
    } catch (err) {
      console.error('WhatsApp API fetch failed:', err)
    }
  }

  // Fallback: return wa.me URL for client to open
  const phone = to.replace(/\D/g, '')
  const url   = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  return NextResponse.json({ success: true, method: 'fallback', url })
}
