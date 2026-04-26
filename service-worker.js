const CACHE_NAME = 'fpro-vfinal';

// Instala e força o cache
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './index.html',
                './style.css',
                './script.js',
                './manifest.json'
            ]);
        })
    );
});

// Ativa e assume o controlo imediato
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Essencial para o Chrome validar o PWA
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
