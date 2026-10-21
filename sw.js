const CACHE_NAME = 'moelab-v9';

const ASSETS_TO_CACHE = [
  './',
  './portal.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',

  // الفصل الأول
  './plasma_membrane.html',
  './mitosis.html',

  // الفصل الثاني (14 تجربة)
  './plant_tissues.html',
  './phloem_tissue.html',
  './squamous_epithelium.html',
  './cuboidal_epithelium.html',
  './columnar_epithelium.html',
  './pseudostratified_epithelium.html',
  './stratified_squamous.html',
  './stratified_cuboidal.html',
  './stratified_columnar.html',
  './connective_loose.html',
  './compact_bone.html',
  './red_blood_cells.html',
  './muscle_types.html',
  './neurons.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Moelab: Caching all offline assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Moelab: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
