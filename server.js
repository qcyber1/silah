/* =====================================================================
   صِلة — خادم ثابت بسيط (لـ Railway أو أي مستضيف يشغّل Node)
   بلا اعتماديات: يخدم ملفات المشروع نفسها كما هي.
   محليًا:  node server.js      ثم افتح http://localhost:5179
   ===================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5179;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

/* ملفات المستودع التي لا علاقة لها بالتطبيق — لا تُخدَم */
const BLOCKED = new Set(['/server.js', '/build-site.js', '/package.json', '/README.md', '/_headers']);

function cacheFor(pathname) {
  if (pathname === '/' || pathname === '/index.html') return 'no-cache';
  if (pathname === '/sw.js') return 'no-cache';
  /* الأصول المُسمّاة بثبات تُخزَّن سنة؛ أما الكود فيجب أن يصل تحديثه فورًا */
  if (pathname.startsWith('/icons/') || pathname.startsWith('/fonts/')) {
    return 'public, max-age=31536000, immutable';
  }
  return 'no-cache';
}

const server = http.createServer((req, res) => {
  const send = (code, body, headers = {}) => {
    res.writeHead(code, {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      ...headers
    });
    res.end(body);
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method Not Allowed');

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(400, 'Bad Request');
  }

  if (pathname === '/healthz') return send(200, 'ok', { 'Content-Type': 'text/plain' });
  if (pathname === '/') pathname = '/index.html';
  if (BLOCKED.has(pathname) || pathname.split('/').some(seg => seg.startsWith('.'))) {
    return send(404, 'Not Found');
  }

  /* امنع الخروج من مجلد المشروع مهما كان المسار */
  const file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT + path.sep)) return send(403, 'Forbidden');

  fs.readFile(file, (err, data) => {
    if (err) {
      /* أي مسار غير معروف يعود إلى التطبيق — التوجيه داخلي */
      return fs.readFile(path.join(ROOT, 'index.html'), (e2, html) =>
        e2 ? send(404, 'Not Found') : send(200, html, {
          'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache'
        }));
    }
    send(200, data, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': cacheFor(pathname)
    });
  });
});

server.listen(PORT, () => console.log(`صِلة تعمل على المنفذ ${PORT}`));
