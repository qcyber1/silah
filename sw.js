/* صِلة — عامل الخدمة: العمل بدون إنترنت + التذكير اليومي */
const CACHE = 'silah-v3';
const DIGEST_CACHE = 'silah-digest';
const DIGEST_URL = '/__silah_digest';
const ASSETS = [
  './', './index.html', './styles.css',
  './js/font-local.js', './js/texts.js', './js/relations.js',
  './js/season.js', './js/store.js', './js/notify.js', './js/app.js',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== DIGEST_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* الشبكة أولًا مع رجوع إلى الكاش عند الانقطاع */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  if (req.url.includes(DIGEST_URL)) return;      /* ملخّص داخلي، ليس موردًا */
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

/* ── التذكير اليومي ─────────────────────────────────
   يكتب التطبيق الملخّص في Cache، فيجد العامل أسماءً حقيقية
   بدل نصّ عام حين يُوقَظ والتطبيق مغلق. */
async function dailyNotification() {
  let title = 'صِلة — تفقّد أرحامك';
  let body = 'مَن يستحق صلتك اليوم؟ افتح صِلة لترى.';
  try {
    const c = await caches.open(DIGEST_CACHE);
    const r = await c.match(DIGEST_URL);
    if (r) {
      const d = await r.json();
      /* ملخّص أقدم من يومين لا يُعتمد */
      if (d && d.title && Date.now() - (d.at || 0) < 48 * 3600 * 1000) {
        title = d.title; body = d.body;
      }
    }
  } catch (e) { /* نستخدم النص العام */ }

  return self.registration.showNotification(title, {
    body, icon: './icons/icon-192.png', badge: './icons/icon-192.png',
    lang: 'ar', dir: 'rtl', tag: 'silah-daily', data: { url: './' }
  });
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'silah-daily') e.waitUntil(dailyNotification());
});

/* احتياط: بعض المتصفحات تدعم sync لمرة واحدة فقط */
self.addEventListener('sync', e => {
  if (e.tag === 'silah-daily') e.waitUntil(dailyNotification());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
