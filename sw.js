// sw.js — يعرض أحدث نسخة عند وجود الإنترنت، والنسخة المحفوظة عند انقطاعه
const CACHE_NAME = 'moelab-v2026-final'; // نفس اسم الذاكرة المستخدم في شريط المزامنة داخل المنصة
const NETWORK_TIMEOUT = 4000; // إذا تأخر الإنترنت أكثر من 4 ثوانٍ تُعرض النسخة المحفوظة

function stripUrl(url) {
  const u = new URL(url);
  u.search = '';
  u.hash = '';
  return u.href;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

// ينقل الملفات المحفوظة من الذاكرات القديمة إلى الذاكرة الحالية قبل حذفها، حتى لا يفقد أحد تجاربه المحفوظة
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const main = await caches.open(CACHE_NAME);
    const keys = await caches.keys();
    for (const key of keys) {
      if (key === CACHE_NAME) continue;
      const old = await caches.open(key);
      const requests = await old.keys();
      for (const req of requests) {
        const exists = await main.match(req, { ignoreSearch: true });
        if (!exists) {
          const res = await old.match(req);
          if (res) await main.put(stripUrl(req.url), res);
        }
      }
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  const path = new URL(req.url).pathname;
  const isPage = req.mode === 'navigate' || path.endsWith('.html') || path.endsWith('/');

  event.respondWith(isPage ? networkFirst(req) : staleWhileRevalidate(req));
});

// الصفحات: الإنترنت أولاً، والذاكرة عند الانقطاع
async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const key = stripUrl(req.url);

  const netPromise = fetch(req.url, { cache: 'no-store', credentials: 'same-origin' })
    .then((res) => {
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    });
  netPromise.catch(() => {});

  try {
    return await Promise.race([
      netPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT))
    ]);
  } catch (e) {
    const cached = (await cache.match(key, { ignoreSearch: true })) ||
                   (await caches.match(req, { ignoreSearch: true }));
    if (cached) return cached;
    return netPromise; // لا توجد نسخة محفوظة: ننتظر الإنترنت
  }
}

// الصور والملفات الأخرى: تُعرض من الذاكرة فوراً وتُحدَّث بالخلفية
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req, { ignoreSearch: true });

  const netPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(stripUrl(req.url), res.clone());
      return res;
    });
  netPromise.catch(() => {});

  return cached || netPromise;
}
