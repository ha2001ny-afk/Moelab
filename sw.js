// غيّر هذا الرقم عند كل تحديث مستقبلي لتنظيف الذاكرة القديمة فوراً
const CACHE_NAME = 'moelab-v13';

// قائمة الملفات الأساسية للحفظ أوفلاين
const ASSETS_TO_CACHE = [
  './portal.html',
  './spermatogenesis.html',
  './oogenesis.html',
  './bacteriophage.html',
  './binary_fission.html',
  './bacteria_conjugation.html',
  './chlamydomonas.html',
  './paramecium.html',
  './alternation_of_generations.html',
  './insect_reproductive_system.html',
  './frog_lifecycle.html',
  './male_reproductive_system.html',
  './ovarian_cycle.html'
  './plasma_membrane.html',

];

// 1. التثبيت والتخطي الفوري للانتظار دون الحاجة لإغلاق المتصفح
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل وحذف كل النسخ والكاش القديم لحظياً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // مسح الكاش القديم
          }
        })
      );
    }).then(() => self.clients.claim()) // فرض السيطرة على الصفحة المفتوحة فوراً
  );
});

// 3. آلية الجلب الذكية (Network-First للبوابة و Cache-First للتجارب)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // إذا كان الطلب لملف البوابة portal.html: اسحب الأحدث من النت أولاً
  if (req.mode === 'navigate' || url.pathname.endsWith('portal.html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // إذا لم يتوفر إنترنت: افتح النسخة المحفوظة أوفلاين
          return caches.match(req);
        })
    );
    return;
  }

  // بالنسبة للتجارب وباقي الملفات: افتح من الكاش لتكون سريعة وخفيفة
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      return cachedResponse || fetch(req).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
