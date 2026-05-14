'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type PlanLimits = {
  plan: string
  monthly_price: number
  max_products: number
  max_users: number
  ads_enabled: boolean
  whatsapp_receipts: boolean
  debt_system: boolean
  online_store_enabled: boolean
  mobile_payments: boolean
  custom_domain: boolean
  unlimited_users: boolean
  priority_support: boolean
  pdf_export: boolean
}

export function usePlanLimits(businessId: string | null) {
  const [plan, setPlan] = useState('free')
  const [limits, setLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlan() {
      if (!businessId) {
        setLoading(false)
        return
      }

      setLoading(true)

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan,status')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const activePlan = subscription?.plan || 'free'
      setPlan(activePlan)

      const { data: planLimits } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan', activePlan)
        .single()

      setLimits((planLimits || null) as PlanLimits | null)
      setLoading(false)
    }

    loadPlan()
  }, [businessId])

  return {
    plan,
    limits,
    loading,
    isFreePlan: plan === 'free' || Boolean(limits?.ads_enabled),
    canAddProducts: (currentCount: number) => {
      if (!limits) return true
      return currentCount < Number(limits.max_products || 0)
    },
    canAddUsers: (currentCount: number) => {
      if (!limits) return true
      if (limits.unlimited_users) return true
      return currentCount < Number(limits.max_users || 0)
    }
  }
}

export function upgradeMessage(feature: string) {
  return `Votre plan actuel ne permet pas ${feature}. Passez à un plan supérieur pour continuer.`
}
