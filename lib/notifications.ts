import { supabase } from '@/lib/supabaseClient'

export type NotificationType =
  | 'info'
  | 'sale'
  | 'order'
  | 'low_stock'
  | 'subscription'
  | 'agent'

export type AppNotification = {
  id: string
  user_id: string
  business_id: string | null
  title: string
  message: string | null
  type: NotificationType
  read: boolean
  created_at: string
}

/**
 * Create a notification for the CURRENT authenticated user (RLS allows users to
 * insert their own rows). Use for self-notifications like new sale / low stock.
 * Fully non-blocking — failures are swallowed so they never break a flow.
 */
export async function notifySelf(params: {
  title: string
  message?: string
  type?: NotificationType
  businessId?: string | null
}): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return
    await supabase.from('notifications').insert({
      user_id: uid,
      business_id: params.businessId ?? null,
      title: params.title,
      message: params.message ?? null,
      type: params.type ?? 'info',
    })
  } catch (err) {
    console.error('[notifications] notifySelf error:', err)
  }
}

/**
 * Notify all platform admins of a new agent signup. Runs server-side via the
 * service-role key because it writes rows for other users (RLS would block it).
 */
export async function notifyAdminsOfAgentSignup(agent: {
  full_name: string
  email: string
  city?: string | null
  country?: string | null
}): Promise<void> {
  try {
    await fetch('/api/notifications/agent-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    })
  } catch (err) {
    console.error('[notifications] notifyAdminsOfAgentSignup error:', err)
  }
}
