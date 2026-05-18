export type BusinessPlan = 'free' | 'pro' | 'business'

export const FEATURE_ACCESS = {
  storefront_publish: ['pro', 'business'],
  storefront_share: ['pro', 'business'],
  whatsapp_orders: ['pro', 'business'],
  analytics: ['business'],
  multi_employee: ['business']
} as const

export type FeatureKey = keyof typeof FEATURE_ACCESS

export function hasFeatureAccess(
  plan: string | null | undefined,
  feature: FeatureKey
) {
  const normalizedPlan = (plan || 'free') as BusinessPlan

  return FEATURE_ACCESS[feature].includes(normalizedPlan)
}

export function isFreePlan(plan: string | null | undefined) {
  return (plan || 'free') === 'free'
}

export function isProPlan(plan: string | null | undefined) {
  return ['pro', 'business'].includes(plan || '')
}
