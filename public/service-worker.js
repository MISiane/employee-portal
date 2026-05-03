// Minimal service worker - does NOTHING but register
// This is just to satisfy PWABuilder

self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  self.clients.claim();
});

// No fetch event = no caching = no interference