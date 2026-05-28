import { sendGAEvent } from '@next/third-parties/google'

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID!

export const event = (action: string, params?: Record<string, unknown>) => {
  sendGAEvent('event', action, params)
}
