import { supabase } from '@/lib/supabaseClient'

// Founder emails have full (super_admin) access everywhere, no DB row required.
export const FOUNDER_EMAILS = ['infos@dakarvapes.com', 'azzideejay@gmail.com']

export type AdminRole = 'super_admin' | 'admin' | 'analyst' | 'agent_manager'

// Every navigable area of the super-admin section.
export type AdminFeature =
  | 'dashboard'
  | 'businesses'
  | 'agents'
  | 'parrainage'
  | 'subscriptions'
  | 'admins'
  | 'settings'
  | 'tickets'

export function isFounder(email: string | null | undefined): boolean {
  if (!email) return false
  return FOUNDER_EMAILS.includes(email.toLowerCase())
}

// admin_users.role may be stored with either spelling ('analyst' English /
// 'analyste' French). We standardize on the canonical 'analyst' everywhere.
// Unknown spellings pass through unchanged so an active admin is never locked
// out purely over a label mismatch.
export function normalizeRole(raw: string | null | undefined): AdminRole | null {
  if (!raw) return null
  const r = raw.toLowerCase().trim()
  if (r === 'analyste' || r === 'analyst') return 'analyst'
  return r as AdminRole
}

// Permission matrix per role. Founders resolve to 'super_admin'.
const ROLE_ACCESS: Record<AdminRole, AdminFeature[]> = {
  super_admin: ['dashboard', 'businesses', 'agents', 'parrainage', 'subscriptions', 'admins', 'settings', 'tickets'],
  admin: ['dashboard', 'businesses', 'agents', 'parrainage', 'subscriptions', 'tickets'],
  analyst: ['dashboard', 'businesses', 'agents', 'parrainage', 'subscriptions', 'tickets'],
  agent_manager: ['dashboard', 'agents', 'parrainage'],
}

export function canAccess(role: AdminRole | null | undefined, feature: AdminFeature): boolean {
  const r = normalizeRole(role)
  if (!r) return false
  return ROLE_ACCESS[r]?.includes(feature) ?? false
}

// Resolve the admin role for an email. Founders are always super_admin.
// Otherwise look up an ACTIVE row in admin_users (matched by uid first, then email).
export async function getAdminRole(email: string | null | undefined): Promise<AdminRole | null> {
  if (isFounder(email)) return 'super_admin'

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  const lookupEmail = (email || userData.user?.email || '').toLowerCase()
  if (!uid && !lookupEmail) return null

  let row: { role: string } | null = null

  if (uid) {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', uid)
      .eq('status', 'active')
      .maybeSingle()
    row = (data as any) || null
  }

  if (!row && lookupEmail) {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .ilike('email', lookupEmail)
      .eq('status', 'active')
      .maybeSingle()
    row = (data as any) || null
  }

  return normalizeRole(row?.role)
}

export type AdminContext = {
  email: string
  allowed: boolean
  role: AdminRole | null
  isFounder: boolean
}

// One call to resolve the current user's admin context for gating a page/layout.
export async function getAdminContext(): Promise<AdminContext | null> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return null

  const email = user.email || ''
  if (isFounder(email)) {
    return { email, allowed: true, role: 'super_admin', isFounder: true }
  }

  const role = await getAdminRole(email)
  return { email, allowed: role !== null, role, isFounder: false }
}
