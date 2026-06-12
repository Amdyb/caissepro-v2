'use client'

import useSWR from 'swr'
import { mutate as globalMutate } from 'swr'
import {
  fetchPlatformSettings,
  clearPlatformSettingsCache,
  readPlatformSettingsCache,
  PLATFORM_DEFAULTS,
  PLATFORM_SETTINGS_SWR_KEY,
  PLATFORM_SETTINGS_TTL,
  type PlatformSettings,
} from '@/lib/platformSettings'

export type { PlatformSettings }

// Client hook. Returns defaults until loaded; cached value is used as immediate fallback.
export function usePlatformSettings(): PlatformSettings {
  const { data } = useSWR(PLATFORM_SETTINGS_SWR_KEY, () => fetchPlatformSettings(), {
    revalidateOnFocus: false,
    dedupingInterval: PLATFORM_SETTINGS_TTL,
    fallbackData: readPlatformSettingsCache() || PLATFORM_DEFAULTS,
  })
  return data || PLATFORM_DEFAULTS
}

// Call after saving settings: drop the cache, re-read fresh, and push into any
// mounted usePlatformSettings() so the change propagates instantly (no 5min wait).
export async function refreshPlatformSettings(): Promise<PlatformSettings> {
  clearPlatformSettingsCache()
  const fresh = await fetchPlatformSettings(true)
  await globalMutate(PLATFORM_SETTINGS_SWR_KEY, fresh, { revalidate: false })
  return fresh
}
