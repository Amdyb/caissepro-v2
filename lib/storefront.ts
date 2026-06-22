import { supabase } from '@/lib/supabaseClient'
import { mutate } from 'swr'

// Single source of truth for "which shop am I working on". Multi-boutique users
// pick a shop and we persist it here; every storefront page reads from this so
// they all stay in sync with the dashboard's business switcher.
export const SELECTED_BUSINESS_KEY = 'caissepro_selected_business_id'

export type ShopOption = { id: string; name: string; slug: string | null; is_demo: boolean }

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function setSelectedBusinessId(id: string) {
  try {
    localStorage.setItem(SELECTED_BUSINESS_KEY, id)
    // Drop the dashboard's cached snapshot and revalidate the shared business
    // data so the whole app (AppShell, dashboard) follows the new selection.
    localStorage.removeItem('caissepro_dashboard_cache')
  } catch {}
  mutate('business-data')
}

export function getStoredBusinessId(): string | null {
  try {
    return localStorage.getItem(SELECTED_BUSINESS_KEY)
  } catch {
    return null
  }
}

// Resolves the current user, their list of shops, and which one is selected.
// The selected id is the one saved in localStorage when it belongs to the user,
// otherwise the first shop. Returns null businessId when the user has no shop.
export async function resolveSelectedBusiness(): Promise<{
  userId: string | null
  businessId: string | null
  shops: ShopOption[]
}> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { userId: null, businessId: null, shops: [] }

  const { data: memberships } = await supabase
    .from('business_members')
    .select('business_id, businesses(id, name, slug, is_demo)')
    .eq('user_id', userData.user.id)

  const shops: ShopOption[] = (memberships || [])
    .map((m: any) => ({
      id: m.business_id as string,
      name: (m.businesses?.name as string) || 'Boutique',
      slug: (m.businesses?.slug as string) ?? null,
      is_demo: !!m.businesses?.is_demo,
    }))
    .filter((s) => !!s.id)

  if (shops.length === 0) return { userId: userData.user.id, businessId: null, shops: [] }

  let selectedId = shops[0].id
  const saved = getStoredBusinessId()
  if (saved && shops.some((s) => s.id === saved)) selectedId = saved

  return { userId: userData.user.id, businessId: selectedId, shops }
}
