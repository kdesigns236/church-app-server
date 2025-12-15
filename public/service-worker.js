const SW_VERSION = '2025-12-15-01';
const CACHE_NAME = `cogel-static-${SW_VERSION}`;
const RUNTIME_CACHE = `cogel-runtime-${SW_VERSION}`;

// Assets to cache on install (exclude index.html to avoid stale app shell)
const STATIC_ASSETS = [
  '/bible/en.json',
  '/bible/sw.json',
];

// Routes that require network (online-only)
const ONLINE_ONLY_ROUTES = [
  '/api/chat',
  '/api/ai',
  '/api/gemini',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // Skip development files
  if (
    url.pathname.includes('/@') ||
    url.pathname.includes('?t=') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.js') ||
    url.pathname.includes('node_modules')
  ) {
    return;
  }

  // Online-only routes
  if (ONLINE_ONLY_ROUTES.some((route) => url.pathname.includes(route))) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for navigations (ensures latest index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch('/index.html', { cache: 'no-store' })
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put('/index.html', clone);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Network-first strategy for API calls (with cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first strategy for static assets (Bible, images, CSS, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((response) =>
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, response))
          )
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      )
    );
  }
});