const CACHE_NAME = 'fpro-vfinal';
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(['./', './index.html', './style.css', './script.js', './manifest.json'])));
});
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request))));
