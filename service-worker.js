self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open('fpro-v5').then(c => c.addAll(['./', 'index.html', 'style.css', 'script.js', 'manifest.json'])));
});
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
