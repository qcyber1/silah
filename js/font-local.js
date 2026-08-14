/* =====================================================================
   صِلة — خط ثمانية على الأجهزة المحلية فقط
   ---------------------------------------------------------------------
   ترخيص ثمانية يجيز الاستخدام في «مشاريعك على أجهزتك»، ويمنع إتاحته
   للزوّار عبر web embedding. فيُحقن الخط عند التشغيل المحلي وحده،
   ويبقى Cairo على أي نطاق عام.
   ملفات الخط في fonts/local/ وهي مستثناة من git ومن النشر.
   ===================================================================== */
(function () {
  'use strict';

  const h = location.hostname;
  const isLocal =
    h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '' ||
    h.endsWith('.local') ||
    /^192\.168\./.test(h) || /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h);

  if (!isLocal) return;   /* نطاق عام — لا شيء يُحمَّل */

  const ARABIC = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,' +
                 'U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,' +
                 'U+FE70-FE74,U+FE76-FEFC';

  const faces = [400, 500, 700, 900].map(w => `
    @font-face{
      font-family:Thmanyah;font-style:normal;font-weight:${w};font-display:swap;
      src:url(fonts/local/thmanyah-${w}.woff2) format('woff2');
      unicode-range:${ARABIC};
    }`).join('');

  const style = document.createElement('style');
  style.id = 'thmanyah-local';
  /* لا يفرض نفسه — يُضاف كخيار في «المزيد ← خط التطبيق» ليختاره المستخدم،
     وإلا لتعارض مع مبدّل الخطوط وأبطله. */
  style.textContent = faces + `
    @font-face{
      font-family:Thmanyah;font-style:normal;font-weight:800 900;font-display:swap;
      src:url(fonts/local/thmanyah-900.woff2) format('woff2');
      unicode-range:${ARABIC};
    }
    :root[data-font="thmanyah"]{
      --font: Thmanyah, "Segoe UI", "Noto Sans Arabic", Tahoma, system-ui, sans-serif;
    }`;
  document.head.appendChild(style);

  /* يقرأه app.js فيُظهر الخيار في القائمة */
  window.SILAH_LOCAL_FONT = { key: 'thmanyah', label: 'ثمانية', note: 'جهازك فقط — لا يُنشر (قيد الترخيص)' };
  console.info('صِلة: خط ثمانية متاح كخيار — تشغيل محلي فقط، ولا يُنشر.');
})();
