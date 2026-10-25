const CACHE_NAME = 'moelab-v20';

// قائمة جميع ملفات ومحاكيات المنصة بالكامل
const ASSETS_TO_CACHE = [
  './portal.html',

  // --- الفصل الأول: الخلية ---
  './cells_structure.html',
  './plasma_membrane.html',
  './organelles.html',
  './diffusion.html',
  './osmosis.html',
  './active_transport.html',
  './endocytosis.html',
  './mitosis.html',
  './meiosis.html',


  // --- الفصل الثاني: الأنسجة ---
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
  './neurons.html',
  './plant_tissues.html',
  './phloem_tissue.html',

  // --- الفصل الثالث: التكاثر ---
  './bacteriophage.html',
  './binary_fission.html',
  './bacteria_conjugation.html',
  './chlamydomonas.html',
  './paramecium.html',
  './euglena.html',
  './alternation_of_generations.html',
  './spermatogenesis.html',
  './oogenesis.html',
  './insect_reproductive_system.html',
  './frog_lifecycle.html',
  './male_reproductive_system.html',
  './ovarian_cycle.html'
  './rhizopus.html',
  './gametophyte_reduction.html',
  './polytrichum.html',
  './polypodium.html',
  './flower_structure.html',
  './anther_structure.html',
  './anther_pollen.html',
  './dicot_embryo.html',
  './seed_structure.html',
  './fruit_structure.html',
  './frog_reproductive_system.html',
  './human_testis_structure.html',
];

// 1. التثبيت والتخزين الذكي
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('تخطي ملف غير متوفر:', asset);
        }
      }
    })
  );
});

// 2. تفعيل وحذف النسخ السابقة فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. إدارة الجلب والتشغيل أوفلاين
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // استثناء اتصالات Google Sheets لتمر للإنترنت دون اعتراض
  if (url.origin !== location.origin || req.method !== 'GET') {
    return;
  }

  // إذا كان الطلب للبوابة الرئيسية فقط (portal.html)
  const isPortal = url.pathname.endsWith('portal.html') || url.pathname.endsWith('/Moelab/') || url.pathname.endsWith('/Moelab');

  if (isPortal) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(async () => {
          const cached = await caches.match('./portal.html', { ignoreSearch: true });
          return cached || caches.match(req, { ignoreSearch: true });
        })
    );
    return;
  }

  // لجميع ملفات التجارب والمحاكاة: فتح فوري من ذاكرة الأوفلاين (Cache-First)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
