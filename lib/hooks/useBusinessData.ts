import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

const SUPER_ADMIN_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

async function fetchBusinessData() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role, full_name, is_active, businesses(id, name, logo_url, business_type, onboarding_completed, slug, slogan, banner_url, phone)')
    .eq('user_id', userData.user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) return null
  const member = membership as any
  const biz = member.businesses || {}

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('business_id', member.business_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    userId: userData.user.id as string,
    userEmail: userData.user.email || '',
    businessId: member.business_id as string,
    businessName: (biz.name || 'CaissePro') as string,
    businessLogo: (biz.logo_url || null) as string | null,
    businessPhone: (biz.phone || null) as string | null,
    businessType: (biz.business_type || 'retail') as string,
    onboardingCompleted: (biz.onboarding_completed ?? false) as boolean,
    business: {
      id: member.business_id as string,
      name: (biz.name || null) as string | null,
      slug: (biz.slug || null) as string | null,
      slogan: (biz.slogan || null) as string | null,
      banner_url: (biz.banner_url || null) as string | null,
      logo_url: (biz.logo_url || null) as string | null,
      business_type: (biz.business_type || null) as string | null,
      onboarding_completed: (biz.onboarding_completed ?? false) as boolean,
    },
    role: (member.role || 'owner') as string,
    fullName: (member.full_name || userData.user.email?.split('@')[0] || '') as string,
    isActive: member.is_active !== false,
    plan: (sub?.plan || 'free') as string,
    expiresAt: (sub?.expires_at || null) as string | null,
    isSuperAdmin: SUPER_ADMIN_EMAILS.includes(userData.user.email || ''),
  }
}

export function useBusinessData() {
  const { data, error, isLoading } = useSWR('business-data', fetchBusinessData, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  })

  return {
    userId: data?.userId ?? null,
    userEmail: data?.userEmail ?? '',
    businessId: data?.businessId ?? null,
    businessName: data?.businessName ?? 'CaissePro',
    businessLogo: data?.businessLogo ?? null,
    businessPhone: data?.businessPhone ?? null,
    businessType: data?.businessType ?? 'retail',
    onboardingCompleted: data?.onboardingCompleted ?? false,
    business: data?.business ?? null,
    role: data?.role ?? 'owner',
    fullName: data?.fullName ?? '',
    isActive: data?.isActive ?? true,
    plan: data?.plan ?? 'free',
    expiresAt: data?.expiresAt ?? null,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    loading: isLoading,
    error,
  }
}
