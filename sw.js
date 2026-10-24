const CACHE_NAME = 'moelab-v18';

// قائمة جميع ملفات ومحاكيات المنصة بالكامل من مستودعك
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
];

// 1. التثبيت والتخزين الذكي (تخزين كل ملف مستقلاً لمنع فشل الحزمة)
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

// 2. تفعيل وحذف النسخ السابقة بالكامل من أجهزة المشتركين
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

  // استثناء اتصالات قاعدة البيانات (Google Sheets) لتمر للإنترنت دون اعتراض
  if (url.origin !== location.origin || req.method !== 'GET') {
    return;
  }

  // لصفحة البوابة الرئيسية: اسحب التحديث من النت، وإن تعذر افتح المحفوظ أوفلاين
  if (req.mode === 'navigate' || url.pathname.endsWith('portal.html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(async () => {
          const cachedPortal = await caches.match('./portal.html', { ignoreSearch: true });
          return cachedPortal || caches.match(req, { ignoreSearch: true });
        })
    );
    return;
  }

  // لجميع ملفات التجارب: تشغيل فوري من ذاكرة الأوفلاين
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
      return cachedResponse || fetch(req).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
