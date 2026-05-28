import { NextRequest, NextResponse } from 'next/server'
import { sendSaleNotification, sendOTP, sendLowStockAlert } from '@/lib/sms'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.type || !body?.phone) {
    return NextResponse.json({ error: 'Missing type or phone' }, { status: 400 })
  }

  const { type, phone, data } = body as {
    type: 'sale' | 'otp' | 'low_stock'
    phone: string
    data: Record<string, unknown>
  }

  try {
    if (type === 'sale') {
      const { shopName, amount, product } = data as {
        shopName: string
        amount: number
        product: string
      }
      if (!shopName || amount == null || !product) {
        return NextResponse.json(
          { error: 'data must include shopName, amount, product' },
          { status: 400 }
        )
      }
      await sendSaleNotification(phone, shopName, amount, product)
    } else if (type === 'otp') {
      const { otp } = data as { otp: string }
      if (!otp) {
        return NextResponse.json({ error: 'data must include otp' }, { status: 400 })
      }
      await sendOTP(phone, otp)
    } else if (type === 'low_stock') {
      const { productName, quantity } = data as { productName: string; quantity: number }
      if (!productName || quantity == null) {
        return NextResponse.json(
          { error: 'data must include productName and quantity' },
          { status: 400 }
        )
      }
      await sendLowStockAlert(phone, productName, quantity)
    } else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[SMS API] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
