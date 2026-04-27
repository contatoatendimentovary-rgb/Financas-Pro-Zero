const CACHE_NAME = 'financaspro-v4';
const assets = ['./', './index.html', './manifest.json', './service-worker.js', 'https://cdn.jsdelivr.net/npm/chart.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(assets)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
