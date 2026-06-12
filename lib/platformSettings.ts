import useSWR from 'swr'
import { supabasePublic } from '@/lib/supabasePublic'

export type PlatformSettings = {
  commission_target_signups: number
  commission_amount_xof: number
  plan_price_starter: number
  plan_price_business: number
  plan_price_premium: number
  whatsapp_notifications_enabled: boolean
  maintenance_mode: boolean
  announcement_banner: string
}

// Defaults mirror the values hardcoded across the app before settings existed.
export const PLATFORM_DEFAULTS: PlatformSettings = {
  commission_target_signups: 20,
  commission_amount_xof: 50000,
  plan_price_starter: 5000,
  plan_price_business: 15000,
  plan_price_premium: 35000,
  whatsapp_notifications_enabled: true,
  maintenance_mode: false,
  announcement_banner: '',
}

const CACHE_KEY = 'platform-settings-v1'
const TTL = 5 * 60 * 1000

function num(v: string | undefined, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && v !== '' && v != null ? n : fallback
}

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

function parseRows(rows: { key: string; value: string | null }[]): PlatformSettings {
  const m: Record<string, string> = {}
  for (const r of rows) m[r.key] = r.value ?? ''
  return {
    commission_target_signups: num(m.commission_target_signups, PLATFORM_DEFAULTS.commission_target_signups),
    commission_amount_xof: num(m.commission_amount_xof, PLATFORM_DEFAULTS.commission_amount_xof),
    plan_price_starter: num(m.plan_price_starter, PLATFORM_DEFAULTS.plan_price_starter),
    plan_price_business: num(m.plan_price_business, PLATFORM_DEFAULTS.plan_price_business),
    plan_price_premium: num(m.plan_price_premium, PLATFORM_DEFAULTS.plan_price_premium),
    whatsapp_notifications_enabled: bool(m.whatsapp_notifications_enabled, PLATFORM_DEFAULTS.whatsapp_notifications_enabled),
    maintenance_mode: bool(m.maintenance_mode, PLATFORM_DEFAULTS.maintenance_mode),
    announcement_banner: m.announcement_banner ?? PLATFORM_DEFAULTS.announcement_banner,
  }
}

function readCache(): PlatformSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > TTL) return null
    return data as PlatformSettings
  } catch {
    return null
  }
}

function writeCache(data: PlatformSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    /* ignore quota errors */
  }
}

// Works in both browser and server (route handlers). Falls back to defaults on any error.
export async function fetchPlatformSettings(force = false): Promise<PlatformSettings> {
  if (!force) {
    const cached = readCache()
    if (cached) return cached
  }
  try {
    const { data, error } = await supabasePublic.from('platform_settings').select('key, value')
    if (error || !data) return PLATFORM_DEFAULTS
    const parsed = parseRows(data as { key: string; value: string | null }[])
    writeCache(parsed)
    return parsed
  } catch {
    return PLATFORM_DEFAULTS
  }
}

// Client hook. Returns defaults until loaded; cached value is used as immediate fallback.
export function usePlatformSettings(): PlatformSettings {
  const { data } = useSWR('platform-settings', () => fetchPlatformSettings(), {
    revalidateOnFocus: false,
    dedupingInterval: TTL,
    fallbackData: readCache() || PLATFORM_DEFAULTS,
  })
  return data || PLATFORM_DEFAULTS
}
