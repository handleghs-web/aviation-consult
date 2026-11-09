const CACHE_NAME = 'aviation-med-pwa-v4';
const APP_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)).catch(err => console.warn('Precache:',err)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith('aviation-med-pwa-') && k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if (req.method!=='GET') return;
  const url=new URL(req.url);
  // Apps Script 등 외부 도메인은 절대 가로채거나 캐시하지 않는다.
  if (url.origin!==self.location.origin) return;
  if (req.mode==='navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
      if(res && res.ok) caches.open(CACHE_NAME).then(c=>c.put('./index.html',res.clone()));
      return res;
    }).catch(()=>caches.match('./index.html').then(c=>c||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
    if(res && res.ok) caches.open(CACHE_NAME).then(c=>c.put(req,res.clone()));
    return res;
  })));
});
