export const PLAN_LIMITS = {
  free: {
    products: 50,
    employees: 1,
    shops: 1,
    publishShop: false,
    reports: false,
    whatsapp: false,
    refunds: false,
    clients: false,
    expenses: false,
  },
  starter: {
    products: 500,
    employees: 3,
    shops: 1,
    publishShop: true,
    reports: 'basic',
    whatsapp: false,
    refunds: true,
    clients: true,
    expenses: true,
  },
  business: {
    products: 2000,
    employees: 10,
    shops: 5,
    publishShop: true,
    reports: 'advanced',
    whatsapp: true,
    refunds: true,
    clients: true,
    expenses: true,
  },
  premium: {
    products: -1,
    employees: -1,
    shops: -1,
    publishShop: true,
    reports: 'full',
    whatsapp: true,
    refunds: true,
    clients: true,
    expenses: true,
  },
} as const

export type PlanName = keyof typeof PLAN_LIMITS
export type PlanFeature = keyof (typeof PLAN_LIMITS)['free']

export function canAccessFeature(plan: PlanName, feature: PlanFeature): boolean {
  const limit: unknown = PLAN_LIMITS[plan]?.[feature]
  if (typeof limit === 'boolean') return limit
  if (typeof limit === 'number') return (limit as number) !== 0
  if (typeof limit === 'string') return true
  return false
}

export function getNumericLimit(plan: PlanName, feature: 'products' | 'employees' | 'shops'): number {
  return PLAN_LIMITS[plan][feature] as number
}

export function isUnderLimit(plan: PlanName, feature: 'products' | 'employees' | 'shops', count: number): boolean {
  const limit = getNumericLimit(plan, feature)
  if (limit === -1) return true
  return count < limit
}
