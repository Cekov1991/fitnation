// Service Worker for Fit Nation PWA
// This minimal service worker satisfies Chrome's PWA installability requirements

const CACHE_NAME = 'fitnation-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network-first strategy for API calls, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy - try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();
        
        // Cache successful responses for static assets
        if (response.ok && event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});
