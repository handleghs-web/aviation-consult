const CACHE_NAME = 'aviation-med-pwa-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          if (e.request.method === 'GET' && e.request.url.startsWith('http')) {
            cache.put(e.request, response.clone());
          }
          return response;
        });
      }).catch(() => cached);
    })
  );
});
