const CACHE_NAME = "app-v1";

// arquivos básicos pra cache (ajuste conforme seu projeto)
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json"
];

// instala e salva cache inicial
self.addEventListener("install", event => {
  self.skipWaiting(); // força atualização imediata

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ativa e limpa cache antigo
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim(); // assume controle imediato
});

// intercepta requisições
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
