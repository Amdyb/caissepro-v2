const PAGE_CACHE = 'caissepro-pages-v2'
const ASSET_CACHE = 'caissepro-assets-v2'
const OFFLINE_URL = '/offline.html'

// Pre-cache only the offline fallback at install time
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PAGE_CACHE)
      .then(cache => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

// Clean up old cache versions on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== PAGE_CACHE && k !== ASSET_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Cache-first for hashed static assets (safe to cache forever)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Stale-while-revalidate for HTML page navigations
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return new Response('Asset not available offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(PAGE_CACHE)
  const cached = await cache.match(request)

  const networkFetch = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    // Serve stale, update cache in background
    networkFetch.catch(() => {})
    return cached
  }

  const networkResponse = await networkFetch
  if (networkResponse) return networkResponse

  // Nothing cached, nothing from network → offline page
  return cache.match(OFFLINE_URL) ?? new Response('Offline', {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// Listen for sync messages from the main thread
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
