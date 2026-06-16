import { supabase } from '@/lib/supabaseClient'

const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

// True if the email is a founder or an active platform admin.
async function isPlatformAdmin(email: string): Promise<boolean> {
  const lower = (email || '').toLowerCase()
  if (!lower) return false
  if (FOUNDER_EMAILS.includes(lower)) return true
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .ilike('email', lower)
    .eq('status', 'active')
    .maybeSingle()
  return !!data
}

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

  // Invited admins / founders may have no business membership at all — send
  // them straight to the admin panel instead of onboarding.
  if (!memberships || memberships.length === 0) {
    if (await isPlatformAdmin(userEmail)) return '/super-admin'
    return '/onboarding'
  }

  const sorted = (memberships as any[]).sort((a, b) => {
    const p: Record<string, number> = { owner: 0, admin: 1 }
    return (p[a.role] ?? 2) - (p[b.role] ?? 2)
  })

  const member: any = sorted[0]
  const business = member?.businesses

  if (!member?.business_id || !business?.id) return '/onboarding'

  if (member.must_change_password) return '/change-password'

  // Employees (any non-owner role) always go to dashboard — never through onboarding
  const OWNER_ROLES = ['owner', 'admin']
  if (!OWNER_ROLES.includes(member.role)) return '/dashboard'

  if (business.onboarding_completed) return '/dashboard'

  if (business.name && business.business_type) {
    await supabase
      .from('businesses')
      .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
      .eq('id', business.id)
    return '/dashboard'
  }

  // Only owners/admins without a completed business go through onboarding
  return '/onboarding'
}
