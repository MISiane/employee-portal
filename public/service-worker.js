const CACHE_NAME = 'employee-portal-v1';

// Only cache these specific files that exist in production
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Install service worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching basic assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch with network-first strategy for HTML, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external URLs (API calls, external resources)
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // For HTML pages (navigation requests) - use network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh HTML for offline fallback
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Offline fallback - serve cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For static assets (JS, CSS, images) - use cache first
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(networkResponse => {
          // Don't cache non-successful responses
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          // Cache valid responses
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        });
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});