
const CACHE_NAME = 'aviation-med-pwa-v2';

// 앱 구동에 필요한 정적 파일만 캐시
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // GET 이외의 요청은 서비스 워커가 건드리지 않음
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Google Apps Script 및 외부 서버 요청은 캐시하지 않고 직접 통신
  if (url.origin !== self.location.origin) {
    return;
  }

  // 앱 HTML은 항상 네트워크 우선으로 최신 버전 확인
  if (url.pathname.endsWith('/index.html') ||
      url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            );
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 나머지 정적 파일은 캐시 우선
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }
        return response;
      });
    })
  );
});
