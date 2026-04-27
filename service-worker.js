const CACHE_NAME = 'financaspro-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalação: Salva arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativação: Limpa versões antigas do cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch: Tenta buscar no cache primeiro, se falhar vai na rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se estiver no cache, retorna. Senão, busca na internet.
      return response || fetch(event.request).catch(() => {
        // Se falhar a rede (offline) e for uma navegação, retorna a index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
