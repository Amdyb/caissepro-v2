import { supabase } from '@/lib/supabaseClient'

export type PlanName = 'free' | 'starter' | 'business' | 'premium' | 'founder_premium'

type CorePlanName = 'free' | 'starter' | 'business' | 'premium'

export const DEFAULT_LIMITS: Record<CorePlanName, Record<string, number | null>> = {
  free: {
    products: 10,
    employees: 1,
    storefront: 1,
    branches: 1,
    tontine_groups: 1
  },
  starter: {
    products: 500,
    employees: 3,
    storefront: 1,
    branches: 1,
    tontine_groups: 3
  },
  business: {
    products: 5000,
    employees: 10,
    storefront: 1,
    branches: 3,
    tontine_groups: 10
  },
  premium: {
    products: null,
    employees: null,
    storefront: null,
    branches: null,
    tontine_groups: null
  }
}

export async function getActivePlan(businessId: string): Promise<PlanName> {
  const { data: business } = await supabase
    .from('businesses')
    .select('beta_access,beta_plan,beta_expires_at,founding_member')
    .eq('id', businessId)
    .maybeSingle()

  if (business?.beta_access) {
    const expiresAt = business.beta_expires_at ? new Date(business.beta_expires_at) : null
    const stillActive = !expiresAt || expiresAt > new Date()

    if (stillActive) {
      return 'founder_premium'
    }
  }

  const { data } = await supabase
    .from('subscriptions')
    .select('plan,status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return ((data?.plan as PlanName) || 'free')
}

export async function getFeatureLimit(businessId: string, featureKey: string) {
  const plan = await getActivePlan(businessId)

  if (plan === 'founder_premium') {
    return {
      plan,
      enabled: true,
      limit: null,
      betaAccess: true
    }
  }

  const corePlan = (['free', 'starter', 'business', 'premium'].includes(plan) ? plan : 'free') as CorePlanName

  const { data } = await supabase
    .from('feature_limits')
    .select('limit_value,enabled')
    .eq('plan', corePlan)
    .eq('feature_key', featureKey)
    .maybeSingle()

  if (data) {
    return {
      plan: corePlan,
      enabled: data.enabled,
      limit: data.limit_value as number | null,
      betaAccess: false
    }
  }

  return {
    plan: corePlan,
    enabled: true,
    limit: DEFAULT_LIMITS[corePlan]?.[featureKey] ?? null,
    betaAccess: false
  }
}

export async function canUseFeature(params: {
  businessId: string
  featureKey: string
  currentUsage: number
}) {
  const feature = await getFeatureLimit(params.businessId, params.featureKey)

  if (feature.betaAccess) {
    return {
      allowed: true,
      plan: feature.plan,
      limit: null,
      reason: 'founder_beta_unlocked'
    }
  }

  if (!feature.enabled) {
    return {
      allowed: false,
      plan: feature.plan,
      limit: feature.limit,
      reason: 'feature_disabled'
    }
  }

  if (feature.limit === null) {
    return {
      allowed: true,
      plan: feature.plan,
      limit: null,
      reason: 'unlimited'
    }
  }

  return {
    allowed: params.currentUsage < feature.limit,
    plan: feature.plan,
    limit: feature.limit,
    reason: params.currentUsage < feature.limit ? 'allowed' : 'limit_reached'
  }
}
