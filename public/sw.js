const CACHE_NAME = 'paylaw-v1'

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch — network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests and API calls
  // We never cache API calls because they have live data
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Save a copy in cache
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy)
        })
        return response
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          // If nothing in cache return offline page
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <title>PayLaw — Offline</title>
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <style>
                  body { font-family: sans-serif; display: flex; align-items: center;
                         justify-content: center; min-height: 100vh; margin: 0;
                         background: #f9fafb; }
                  .box { text-align: center; padding: 2rem; }
                  h1 { font-size: 1.25rem; font-weight: 600; color: #111; }
                  p { color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem; }
                </style>
              </head>
              <body>
                <div class="box">
                  <h1>You are offline</h1>
                  <p>Connect to the internet to continue using PayLaw.</p>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          )
        })
      })
  )
})