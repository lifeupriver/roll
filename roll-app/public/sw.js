// Roll Service Worker — Offline caching & push notification support
const CACHE_NAME = 'roll-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Cache-first for static assets, network-first for API and pages
const CACHE_FIRST_PATTERNS = [
  /\/icons\//,
  /\/textures\//,
  /\/fonts\//,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
];

// Install — precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — strategy routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) return;

  // Network-first for API calls — don't cache auth or dynamic data
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  if (CACHE_FIRST_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for pages
  event.respondWith(staleWhileRevalidate(request));
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Roll', body: event.data.text() };
  }

  const { title = 'Roll', body, icon, data, tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: tag || 'roll-notification',
      data: data || {},
      vibrate: [100, 50, 100],
    })
  );
});

// Notification click — open the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/feed';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if one is open
      for (const client of clients) {
        if (new URL(client.url).pathname === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(url);
    })
  );
});

// === Caching strategies ===

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || networkFetch;
}
