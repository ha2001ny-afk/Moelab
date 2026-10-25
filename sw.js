// Moelab Autonomous Engine - Permanent Offline Service Worker
const CACHE_NAME = 'moelab-core-offline';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات الخارجية مثل الخطوط أو ملفات خارج النطاق
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // 1. إذا كان الملف مخزناً مسبقاً، نرجعه مباشرة بدون نت
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. إذا لم يكن مخزناً، نجلبه من النت ونخزنه فوراً للمستقبل
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      }).catch(() => {
        // فشل النت والملف غير مخزن
        return new Response('<h2 style="font-family:sans-serif;text-align:center;padding:50px;">يرجى الاتصال بالإنترنت لمرة واحدة لتحميل هذه التجربة لأول مرة.</h2>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      });
    })
  );
});
