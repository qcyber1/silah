/* =====================================================================
   صِلة — التذكير اليومي
   ---------------------------------------------------------------------
   بلا خادم، فلا يوجد Web Push. المتاح مساران:

   ١) periodicSync — يوقظ عامل الخدمة دوريًا فيُظهر الإشعار والتطبيق مغلق.
      يعمل على كروم/أندرويد للتطبيق المثبَّت فقط.
   ٢) تعويض عند الفتح — إن فات موعد اليوم ولم يُعرض، يُعرض فور فتح
      التطبيق. يعمل في كل مكان، وهو ما يحصل على آيفون.

   عامل الخدمة لا يقرأ localStorage، فيُكتب له «الملخّص» في Cache API
   ليجد أسماءً حقيقية بدل نصّ عام.
   ===================================================================== */
(function () {
  'use strict';

  const DIGEST_CACHE = 'silah-digest';
  const DIGEST_URL = '/__silah_digest';

  const supported = () => 'Notification' in window && 'serviceWorker' in navigator;
  const permission = () => (supported() ? Notification.permission : 'unsupported');

  const settings = () => {
    const s = window.STORE.db.settings;
    if (!s.notify) s.notify = { enabled: false, hour: 20, lastShown: null };
    return s.notify;
  };

  const todayKey = () => new Date().toDateString();

  /* نصّ الإشعار من حالة الأرحام الفعلية */
  function buildDigest() {
    const S = window.STORE;
    const due = S.suggestions(3);
    const occ = S.upcomingOccasions(1);
    const meet = S.activeGathering();

    if (occ.length) {
      const o = occ[0];
      return { title: (o.oc.title || 'مناسبة') + ' اليوم 🎉',
               body: `${o.person.name} — لا تفوّت تهنئته.` };
    }
    if (meet && S.daysUntil(meet.date) === 0) {
      return { title: meet.title + ' اليوم 🫂',
               body: meet.place ? '📍 ' + meet.place : 'لقاء العائلة اليوم.' };
    }
    if (!due.length) {
      return { title: 'أرحامك موصولون 🤍', body: 'ما شاء الله. ولك أن تُسجّل دعاءً لأحدهم.' };
    }
    const names = due.map(d => d.p.name.split(/\s+/)[0]).join('، ');
    return {
      title: due.length === 1 ? 'قريبٌ ينتظر صلتك' : `${due.length} من أرحامك ينتظرون صلتك`,
      body: names + ' — صِلهم اليوم، ولو باتصال قصير.'
    };
  }

  /* يكتبه التطبيق ليقرأه عامل الخدمة وهو موقظ والتطبيق مغلق */
  async function publishDigest() {
    if (!('caches' in window)) return;
    try {
      const c = await caches.open(DIGEST_CACHE);
      const d = buildDigest();
      await c.put(DIGEST_URL, new Response(JSON.stringify({ ...d, at: Date.now() }),
        { headers: { 'Content-Type': 'application/json' } }));
    } catch (e) { /* التخزين ممنوع — التعويض عند الفتح يكفي */ }
  }

  async function show(d) {
    const reg = await navigator.serviceWorker.getRegistration();
    const opts = {
      body: d.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      lang: 'ar', dir: 'rtl',
      tag: 'silah-daily',            /* لا يتكدّس */
      renotify: false,
      data: { url: '/' }
    };
    if (reg) await reg.showNotification(d.title, opts);
    else new Notification(d.title, opts);
  }

  async function requestPermission() {
    if (!supported()) return 'unsupported';
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    return p;
  }

  /* periodicSync متاح للتطبيق المثبَّت على كروم/أندرويد */
  async function registerPeriodic() {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (!('periodicSync' in reg)) return false;
      const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (st.state !== 'granted') return false;
      await reg.periodicSync.register('silah-daily', { minInterval: 12 * 60 * 60 * 1000 });
      return true;
    } catch (e) { return false; }
  }

  async function unregisterPeriodic() {
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) await reg.periodicSync.unregister('silah-daily');
    } catch (e) { /* لم يكن مسجَّلًا */ }
  }

  async function enable(hour) {
    const p = await requestPermission();
    if (p !== 'granted') return p;
    const n = settings();
    n.enabled = true;
    if (hour != null) n.hour = hour;
    window.STORE.save();
    await publishDigest();
    await registerPeriodic();
    return 'granted';
  }

  async function disable() {
    const n = settings();
    n.enabled = false;
    window.STORE.save();
    await unregisterPeriodic();
  }

  /* التعويض: فات الموعد اليوم ولم يُعرض بعد */
  async function checkAndFire() {
    if (!supported()) return false;
    const n = settings();
    if (!n.enabled || Notification.permission !== 'granted') return false;
    await publishDigest();
    if (n.lastShown === todayKey()) return false;
    if (new Date().getHours() < n.hour) return false;
    await show(buildDigest());
    n.lastShown = todayKey();
    window.STORE.save();
    return true;
  }

  async function test() {
    const p = await requestPermission();
    if (p !== 'granted') return p;
    await show(buildDigest());
    return 'granted';
  }

  /* حالة الدعم لعرضها بصدق في الإعدادات */
  async function capability() {
    const out = { supported: supported(), permission: permission(), periodic: false, installed: false };
    out.installed = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;
    try {
      const reg = await navigator.serviceWorker.ready;
      out.periodic = 'periodicSync' in reg;
    } catch (e) { /* لا عامل خدمة */ }
    return out;
  }

  window.NOTIFY = { supported, permission, settings, enable, disable, test,
                    checkAndFire, capability, buildDigest, publishDigest };
})();
