/* بناء نسخة الاستضافة: يدمج التطبيق في مستند واحد وينسخ أصول PWA */
const fs = require('fs');
const SITE = process.argv[2];
if (!SITE) { console.error('usage: node build-site.js <site-repo-path>'); process.exit(1); }

const css = fs.readFileSync('styles.css', 'utf8');
const js = ['js/texts.js', 'js/relations.js', 'js/season.js', 'js/store.js', 'js/notify.js', 'js/app.js']
  .map(f => fs.readFileSync(f, 'utf8')).join('\n');
const html = fs.readFileSync('index.html', 'utf8');
const body = html.split('<body>')[1].split('</body>')[0].replace(/<script[\s\S]*?<\/script>/g, '').trim();

const CLOSE = '<' + '/script>';

const doc = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=5">
<title>صِلة — رفيقك في صلة الأرحام</title>
<meta name="description" content="منصة تساعدك على معرفة أرحامك وصِلتهم: شجرة الأرحام، مؤشر حرارة الصلة، لقاءات العائلة، وتذكير يومي بمن يستحق صلتك.">
<meta name="theme-color" content="#0e7a5f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="صِلة">
<meta property="og:title" content="صِلة — رفيقك في صلة الأرحام">
<meta property="og:description" content="شجرة أرحامك، ومؤشر يبيّن مَن قارب ينقطع، ولقاءات العائلة بتسجيل حضور جماعي.">
<meta property="og:image" content="/cover.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<style>
${css}
</style>
</head>
<body>
${body}
<script>
window.SILAH_DEMO = true;
${js}
${CLOSE}
<script>
if ('serviceWorker' in navigator) {
  addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
}
${CLOSE}
</body>
</html>`;

fs.mkdirSync(SITE + '/app/src/silah', { recursive: true });
fs.writeFileSync(SITE + '/app/src/silah/index.html', doc, 'utf8');

/* أصول PWA تُخدَم من الجذر */
fs.mkdirSync(SITE + '/app/public/icons', { recursive: true });
['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'cover.png']
  .forEach(f => fs.copyFileSync(f, SITE + '/app/public/' + f));

/* الخطوط — المسارات في CSS نسبية، والصفحة تُخدَم من الجذر، فتستقر على /fonts/ */
fs.mkdirSync(SITE + '/app/public/fonts', { recursive: true });
fs.readdirSync('fonts')
  .filter(f => f.endsWith('.woff2'))
  .forEach(f => fs.copyFileSync('fonts/' + f, SITE + '/app/public/fonts/' + f));

/* المسارات في المصدر مطلقة أصلًا — نمرّرها كما هي بلا تكرار الشرطة */
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
manifest.start_url = '/';
manifest.scope = '/';
fs.writeFileSync(SITE + '/app/public/manifest.webmanifest', JSON.stringify(manifest, null, 2), 'utf8');

/* عامل الخدمة نفسه لا نسخة موازية — النسخة المكرّرة سبق أن تخلّفت عن الأصل.
   الفرق الوحيد أن هذا البناء يدمج الكود في الصفحة، فلا ملفات js منفصلة تُخزَّن. */
const sw = fs.readFileSync('sw.js', 'utf8')
  .replace(/^\s*'\.\/js\/[^']*',?\s*$/gm, '')      // لا ملفات js مستقلة هنا
  .replace(/'\.\//g, "'/")                          // المسارات من الجذر
  .replace(/caches\.match\('\/index\.html'\)/g, "caches.match('/')")
  .replace(/'\/index\.html',\s*/g, '')
  .replace(/,(\s*)\]/g, '$1]');
fs.writeFileSync(SITE + '/app/public/sw.js', sw, 'utf8');

console.log('document: ' + (doc.length / 1024).toFixed(1) + 'KB');
console.log('public assets: manifest, sw.js, 3 icons');
