const CACHE_NAME = 'moelab-v17';

// قائمة الملفات الأساسية للأوفلاين
const ASSETS_TO_CACHE = [
  './portal.html',
  './plasma_membrane.html',
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
  './ovarian_cycle.html',
  './euglena.html'
];

// 1. التثبيت وتخزين الملفات بأمان
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('تخطي ملف غير موجود حالياً:', asset);
        }
      }
    })
  );
});

// 2. تفعيل وحذف النسخ القديمة
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

// 3. إدارة الجلب والاتصال
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // استثناء جوهري: أي اتصال خارجي بقاعدة بيانات جوجل شيت اتركه يمر للإنترنت مباشرة دون اعتراض
  if (url.origin !== location.origin || req.method !== 'GET') {
    return;
  }

  // إذا كان الطلب للبوابة: اسحب الأحدث من النت أولاً، أو افتح المحفوظ أوفلاين
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

  // بالنسبة للتجارب وباقي الملفات: من الذاكرة أولاً ثم الشبكة
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
