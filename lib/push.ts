'use client'

import { supabase } from '@/lib/supabaseClient'

// Client-side Web Push helpers: capability detection, permission, and managing
// the device subscription in the push_subscriptions table (RLS-scoped to the
// signed-in user).

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// True when running as an installed PWA (standalone display mode).
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )
}

// iOS only supports Web Push from an installed (home-screen) PWA.
export function iosNeedsInstall(): boolean {
  return isIOS() && !isStandalone()
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return Notification.requestPermission()
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Subscribe this device to push and persist it. Safe to call repeatedly — it
 * reuses an existing browser subscription and de-dupes the DB row by endpoint.
 * Returns false when unsupported, blocked, or VAPID key missing.
 */
export async function subscribeToPush(businessId?: string | null): Promise<boolean> {
  try {
    if (!isPushSupported() || !PUBLIC_VAPID_KEY) return false
    if (Notification.permission !== 'granted') return false

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return false

    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })
    }

    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

    // De-dupe: drop any prior row for this endpoint, then insert fresh.
    await supabase.from('push_subscriptions').delete().eq('endpoint', json.endpoint)
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: userId,
      business_id: businessId ?? null,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
    })
    return !error
  } catch (err) {
    console.error('[push] subscribeToPush error:', err)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!isPushSupported()) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    }
  } catch (err) {
    console.error('[push] unsubscribeFromPush error:', err)
  }
}

// True when this device already has an active browser push subscription.
export async function isSubscribed(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false
    const reg = await navigator.serviceWorker.ready
    return !!(await reg.pushManager.getSubscription())
  } catch {
    return false
  }
}
