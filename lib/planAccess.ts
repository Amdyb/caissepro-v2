export type BusinessPlan = 'free' | 'pro' | 'business'

export type FeatureKey =
  | 'storefront_publish'
  | 'storefront_share'
  | 'whatsapp_orders'
  | 'analytics'
  | 'multi_employee'

export const FEATURE_ACCESS: Record<FeatureKey, BusinessPlan[]> = {
  storefront_publish: ['pro', 'business'],
  storefront_share: ['pro', 'business'],
  whatsapp_orders: ['pro', 'business'],
  analytics: ['business'],
  multi_employee: ['business']
}

export function hasFeatureAccess(
  plan: string | null | undefined,
  feature: FeatureKey
) {
  const normalizedPlan: BusinessPlan =
    (plan as BusinessPlan) || 'free'

  return FEATURE_ACCESS[feature].includes(normalizedPlan)
}

export function isFreePlan(plan: string | null | undefined) {
  return (plan || 'free') === 'free'
}

export function isProPlan(plan: string | null | undefined) {
  return ['pro', 'business'].includes(plan || '')
}
