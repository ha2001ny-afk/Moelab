const CACHE_NAME = 'moelab-v2';
const ASSETS_TO_CACHE = [
  './',
  './portal.html',
  './cells_structure.html',
  './membrane.html',
  './organelles.html',
  './diffusion.html',
  './osmosis.html',
  './active_transport.html',
  './endocytosis.html',
  './mitosis.html',
  './meiosis.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => {
        return caches.match('./portal.html', { ignoreSearch: true });
      });
    })
  );
});
