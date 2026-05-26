import { supabase } from '@/lib/supabaseClient'

export async function getNextRoute(userId: string, userEmail: string): Promise<string> {
  let { data: memberships } = await supabase
    .from('business_members')
    .select('id, business_id, role, must_change_password, businesses(id, onboarding_completed, name, business_type)')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) {
    const { data: byEmail } = await supabase
      .from('business_members')
      .select('id, business_id, role, must_change_password, businesses(id, onboarding_completed, name, business_type)')
      .eq('email', userEmail.toLowerCase())
      .is('user_id', null)
      .limit(1)

    if (byEmail && byEmail.length > 0) {
      await supabase
        .from('business_members')
        .update({ user_id: userId })
        .eq('id', (byEmail[0] as any).id)
      memberships = byEmail
    }
  }

  if (!memberships || memberships.length === 0) return '/onboarding'

  const sorted = (memberships as any[]).sort((a, b) => {
    const p: Record<string, number> = { owner: 0, admin: 1 }
    return (p[a.role] ?? 2) - (p[b.role] ?? 2)
  })

  const member: any = sorted[0]
  const business = member?.businesses

  if (!member?.business_id || !business?.id) return '/onboarding'

  if (member.must_change_password) return '/change-password'

  if (business.onboarding_completed) return '/dashboard'

  if (business.name && business.business_type) {
    await supabase
      .from('businesses')
      .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
      .eq('id', business.id)
    return '/dashboard'
  }

  return '/onboarding'
}
