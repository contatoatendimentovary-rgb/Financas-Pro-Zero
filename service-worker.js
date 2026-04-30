const CACHE_NAME = 'financaspro-vfinal-1.1'; // Atualizei a versão para forçar o update
const assets = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap'
];

// Instalação: Salva os arquivos essenciais
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cacheando assets estáveis...');
      return cache.addAll(assets);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Removendo cache antigo:', key);
          return caches.delete(key);
        }
      })
    ))
  );
});

// Estratégia de Busca: Network First para dados, Cache First para arquivos estáticos
self.addEventListener('fetch', (e) => {
  // Ignora requisições do Firebase (deixe o Firebase lidar com o próprio cache offline)
  if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('identitytoolkit')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        // Se a resposta for válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver offline e não tiver no cache, não faz nada (ou retorna página offline)
      });

      return cachedResponse || fetchPromise;
    })
  );
});
