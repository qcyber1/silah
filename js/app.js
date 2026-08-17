/* =====================================================================
   صِلة — منطق الواجهة
   ===================================================================== */
(function () {
'use strict';

const S = window.STORE;
const R = window.REL;
const T = window.TEXTS;
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

/* ── أدوات ────────────────────────────────────────── */
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const AR_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function todayLabel() {
  const d = new Date();
  let s = `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
  try {
    const h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    s += ' · ' + h;
  } catch (e) { /* المتصفح لا يدعم التقويم الهجري */ }
  return s;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'سحورًا مباركًا';
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'طاب يومك';
  if (h < 20) return 'مساء الخير';
  return 'مساء الخير';
}

function agoText(days) {
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days === 2) return 'قبل يومين';
  if (days < 11) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${days} يومًا`;
  const m = Math.floor(days / 30);
  if (m === 1) return 'قبل شهر';
  if (m === 2) return 'قبل شهرين';
  if (m < 12) return `قبل ${m} أشهر`;
  const y = Math.floor(days / 365);
  return y === 1 ? 'قبل سنة' : `قبل ${y} سنوات`;
}

/* تمييز صيغ الجمع العربية للأيام */
function arDays(n) {
  if (n === 0) return 'اليوم';
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومان';
  if (n <= 10) return `${n} أيام`;
  return `${n} يومًا`;
}

/* الجمع العربي: صفر / مفرد / مثنى / جمع قلة (٣-١٠) / تمييز مفرد منصوب (١١+) */
function arCount(n, { zero, one, two, few, many }) {
  if (n === 0) return zero;
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

const arSilat = n => arCount(n, {
  zero: 'لا صلات', one: 'صلة واحدة', two: 'صلتان', few: 'صلات', many: 'صلة'
});
const arLogs = n => arCount(n, {
  zero: 'لا تسجيلات', one: 'تسجيل واحد', two: 'تسجيلان', few: 'تسجيلات', many: 'تسجيلًا'
});
const arMeets = n => arCount(n, {
  zero: 'لا لمّات', one: 'لمّة واحدة', two: 'لمّتان', few: 'لمّات', many: 'لمّة'
});
const arPeople = n => arCount(n, {
  zero: 'لا أحد', one: 'قريب واحد', two: 'قريبان', few: 'أقارب', many: 'قريبًا'
});

function cadenceText(d) {
  if (d === 1) return 'يوميًا';
  if (d === 7) return 'أسبوعيًا';
  if (d === 14) return 'كل أسبوعين';
  if (d === 30) return 'شهريًا';
  if (d === 90) return 'كل ٣ أشهر';
  if (d === 180) return 'كل ٦ أشهر';
  if (d === 365) return 'سنويًا';
  return `كل ${d} يومًا`;
}

/* الحرفان الأولان من أول كلمتين — مع تجاهل الشرطات وأدوات التعريف */
function initials(n) {
  const words = String(n || '').trim().split(/\s+/)
    .filter(w => /^[ء-يA-Za-z]/.test(w));
  if (!words.length) return '؟';
  return words.slice(0, 2).map(w => w[0]).join('');
}

/* حلقة الدورة: تُظهر كم انقضى من دورة الصلة، لا مجرد اللون.
   ممتلئة = حان الموعد · متجاوزة = تتحول إلى حلقة كاملة بنبضة خفيفة. */
function avatarRing(p, s, size = 52) {
  const meta = S.STATE_META[s.state];
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0.04, Math.min(1, s.ratio));
  const inner = size - 12;
  return `<span class="ring" style="--rc:${meta.color};width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}"></circle>
      <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}"
        stroke-dasharray="${(circ * pct).toFixed(1)} ${circ.toFixed(1)}"></circle>
    </svg>
    <span class="avatar" style="--av:${avatarColor(p.id)};width:${inner}px;height:${inner}px;font-size:${Math.round(inner / 2.9)}px">${esc(initials(p.name))}</span>
  </span>`;
}

function avatarColor(id) {
  const palette = ['#0e7a5f','#c9821f','#8a5cf6','#0ea5a4','#d9534f','#3b82f6','#a16207','#7c3aed','#059669','#be123c'];
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

let toastTimer;
function toast(msg, undo, note) {
  const t = $('#toast');
  clearTimeout(toastTimer);
  t.innerHTML = '';
  t.appendChild(document.createTextNode(msg));
  if (note) {
    const nb = el('button', 'toast-undo', '📝 وش صار؟');
    nb.onclick = () => { t.hidden = true; clearTimeout(toastTimer); note(); };
    t.appendChild(nb);
  }
  if (undo) {
    const b = el('button', 'toast-undo', 'تراجع');
    b.onclick = () => { t.hidden = true; clearTimeout(toastTimer); undo(); };
    t.appendChild(b);
  }
  t.hidden = false;
  toastTimer = setTimeout(() => { t.hidden = true; }, (undo || note) ? 5600 : 2100);
}

/* ملاحظة ما بعد المكالمة: سطرٌ يُكتب الآن يذكّرك المرة القادمة بآخر ما دار */
function openEventNote(ev, person) {
  openSheet(`
    <h3>وش صار مع ${esc(person.name.split(/\s+/)[0])}؟</h3>
    <p class="sheet-sub">سطرٌ واحد يكفي — يظهر في سجلّه فيذكّرك في المرة القادمة.</p>
    <label class="field">
      <input id="ev-note" type="text" placeholder="مثال: بشّرني بوظيفة جديدة، أتابع معه الأسبوع الجاي"
             value="${esc(ev.note || '')}" enterkeyhint="done"></label>
    <button class="btn btn-primary btn-lg" id="ev-save">حفظ</button>`,
    b => {
      const inp = b.querySelector('#ev-note');
      const save = () => {
        S.updateEventNote(ev.id, inp.value);
        closeSheet(); toast('حُفظت الملاحظة'); render();
      };
      b.querySelector('#ev-save').onclick = save;
      inp.onkeydown = e => { if (e.key === 'Enter') save(); };
    });
}

/* تسجيل صلة مع إتاحة التراجع والملاحظة — المسار الوحيد لكل تسجيل سريع */
function logContact(person, type, note, msg) {
  const ev = S.addEvent(person.id, type, note);
  haptic();
  toast(msg,
    () => { if (S.undoLastEvent()) { toast('أُلغي التسجيل'); render(); } },
    () => openEventNote(ev, person));
  setTimeout(render, 550);
}

/* ── شارة الأيقونة ────────────────────────────────
   رقم على أيقونة التطبيق المثبَّت: كم رحمًا ينتظرك. */
function updateBadge() {
  if (!('setAppBadge' in navigator)) return;
  try {
    const n = S.activePeople().length ? S.suggestions(99).length : 0;
    if (n > 0) navigator.setAppBadge(n).catch(() => {});
    else navigator.clearAppBadge().catch(() => {});
  } catch (e) { /* غير مدعوم */ }
}

function haptic() { if (navigator.vibrate) navigator.vibrate(12); }

/* ── الورقة السفلية ───────────────────────────────── */
const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
let sheetOpener = null;

function openSheet(html, onMount) {
  const w = $('#sheet');
  const body = $('#sheet-body');
  sheetOpener = document.activeElement;
  body.innerHTML = html;
  w.hidden = false;
  document.body.style.overflow = 'hidden';
  if (onMount) onMount(body);

  /* التركيز ينتقل داخل الورقة — وإلا علق مستخدم لوحة المفاتيح خارجها */
  const first = body.querySelector('input,textarea,select') || body.querySelector(FOCUSABLE);
  (first || w.querySelector('.sheet')).focus({ preventScroll: true });
}

function closeSheet() {
  $('#sheet').hidden = true;
  document.body.style.overflow = '';
  if (sheetOpener && document.contains(sheetOpener)) sheetOpener.focus({ preventScroll: true });
  sheetOpener = null;
}

const sheetOpen = () => !$('#sheet').hidden;

$('#sheet').addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeSheet(); });

/* لوحة المفاتيح فوق الورقة: --kb = ما تحجبه، فيرتفع المحتوى ولا يُدفَن الحقل */
if (window.visualViewport) {
  const vv = window.visualViewport;
  const applyKb = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb > 40 ? kb + 'px' : '0px');
  };
  vv.addEventListener('resize', applyKb);
  vv.addEventListener('scroll', applyKb);
}
/* والحقل المُركَّز داخل الورقة يُسحب إلى مرأى العين بعد فتح اللوحة */
$('#sheet').addEventListener('focusin', e => {
  if (!e.target.matches('input,textarea,select')) return;
  setTimeout(() => {
    try { e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
  }, 320);
});

document.addEventListener('keydown', e => {
  if (!sheetOpen()) return;
  if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
  if (e.key !== 'Tab') return;

  /* حصر التركيز داخل الورقة ما دامت مفتوحة */
  const items = [...$('#sheet .sheet').querySelectorAll(FOCUSABLE)]
    .filter(el => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ── التوجيه ──────────────────────────────────────── */
let route = { name: 'today', param: null };

function go(name, param) {
  if (name === 'add') return openAddSheet();
  route = { name, param: param || null };
  render();
  window.scrollTo({ top: 0 });
}

document.querySelectorAll('.tab').forEach(b =>
  b.addEventListener('click', () => go(b.dataset.route))
);

/* ══════════════════════════════════════════════════
   العرض الرئيسي
   ══════════════════════════════════════════════════ */
function render() {
  applySeasonTheme();   /* الموسم قد ينقلب أثناء الجلسة (منتصف ليلة رمضان مثلًا) */
  const v = $('#view');
  const title = $('#tb-title');
  const back = $('#tb-back');
  const act = $('#tb-action');
  back.innerHTML = ''; act.innerHTML = '';
  v.innerHTML = '';

  document.querySelectorAll('.tab').forEach(b => {
    if (b.dataset.route === route.name) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  updateBadge();

  switch (route.name) {
    case 'today':   title.textContent = 'صِلة';        viewToday(v); break;
    case 'people':  title.textContent = 'أرحامي';      viewPeople(v); break;
    case 'tree':    title.textContent = 'شجرة الأرحام'; viewTree(v); break;
    case 'more':    title.textContent = 'المزيد';      viewMore(v); break;
    case 'texts':   title.textContent = 'آيات وأحاديث'; backBtn('more'); viewTexts(v); break;
    case 'stats':   title.textContent = 'سجل الصلة';   backBtn('more'); viewStats(v); break;
    case 'occ':     title.textContent = 'المناسبات';   backBtn('more'); viewOccasions(v); break;
    case 'meets':   title.textContent = 'لقاءات العائلة'; backBtn('more'); viewGatherings(v); break;
    case 'greet':   title.textContent = 'قائمة المعايدة'; backBtn('today'); viewGreeting(v); break;
    case 'rift':    title.textContent = 'نيّة الصلح';     backBtn('more'); viewRift(v); break;
    case 'backup':  title.textContent = 'النسخ الاحتياطي'; backBtn('more'); viewBackup(v); break;
    case 'person':  viewPerson(v, route.param); break;
    default:        viewToday(v);
  }
}

function backBtn(to) {
  const b = el('button', 'tb-btn', '‹ رجوع');
  b.onclick = () => go(to);
  $('#tb-back').appendChild(b);
}

/* ══════════════════════════════════════════════════
   ١) شاشة اليوم
   ══════════════════════════════════════════════════ */
function viewToday(v) {
  const st = S.monthStats();
  const streak = S.streakDays();
  const name = S.db.settings.myName;

  const hero = el('div', 'hero');
  hero.innerHTML = `
    <div class="hero-top">
      <div>
        <div class="hero-hi">${esc(greeting())}${name ? '، ' + esc(name) : ''}</div>
        <div class="hero-date">${esc(todayLabel())}</div>
      </div>
      ${streak > 0 ? `<div class="hero-streak">🔥 ${esc(arDays(streak))}</div>` : ''}
    </div>
    <div class="hero-stats">
      <div class="hstat"><b>${st.counts.warm}</b><span>موصول</span></div>
      <div class="hstat"><b>${st.counts.due}</b><span>قارب</span></div>
      <div class="hstat"><b>${st.counts.cold + st.counts.new}</b><span>يحتاج صلة</span></div>
      <div class="hstat"><b>${st.total}</b><span>صلة هذا الشهر</span></div>
    </div>`;
  v.appendChild(hero);

  if (!S.persistent) {
    const w = el('div', 'card');
    w.style.cssText = 'border-color:var(--gold);margin-bottom:14px';
    w.innerHTML = `<p class="muted">⚠️ <b style="color:var(--ink)">هذه معاينة فقط.</b> المتصفح هنا يمنع الحفظ، فبياناتك تضيع عند تحديث الصفحة. لاستخدامها فعليًا، شغّل النسخة الكاملة على جهازك أو استضِفها على رابطك الخاص.</p>`;
    v.appendChild(w);
  }

  /* الموسم يتصدّر الشاشة — هو أهم ما في اليوم إن كان قائمًا */
  const season = S.activeSeason();
  if (season && S.activePeople().length) v.appendChild(seasonCard(season));

  const people = S.activePeople();
  if (!people.length) {
    const box = emptyBox('👥', 'ابدأ ببناء شجرة أرحامك',
      'يسألك سؤالًا سؤالًا — والدك، إخوانك، أعمامك — وتخرج بشجرتك كاملة في دقيقة.',
      '✨ ابنِ شجرتي معي', () => openWizard());
    const bulk = el('button', 'btn btn-block', '⚡ أو أضِفهم دفعة واحدة');
    bulk.style.marginTop = '9px';
    bulk.onclick = () => openBulkAddSheet();
    box.appendChild(bulk);
    if (contactsSupported()) {
      const imp = el('button', 'btn btn-block', '📇 استورد من جهات اتصالك');
      imp.style.marginTop = '9px';
      imp.onclick = () => openContactImport();
      box.appendChild(imp);
    }
    const one = el('button', 'btn btn-ghost btn-block', 'أضِف قريبًا واحدًا');
    one.style.marginTop = '9px';
    one.onclick = () => openAddSheet();
    box.appendChild(one);
    const demo = el('button', 'btn btn-ghost btn-block', '👁️ استعرض بمثال تجريبي');
    demo.style.marginTop = '9px';
    demo.onclick = () => { seedDemo(); toast('بيانات تجريبية — امسحها من «المزيد» متى شئت'); render(); };
    box.appendChild(demo);
    v.appendChild(box);
    v.appendChild(textOfDay());
    return;
  }

  /* ترتيب مقصود: لحظة الصلح الأسبوعية ← قرار اليوم ← التسجيل السريع
     ← اللقاء ← المناسبات ← إداريات (النسخة) ← الآية ختامًا. */

  /* نيّة الصلح — واحدٌ فقط، ومرة كل أسبوع */
  const rift = S.riftNudge();
  if (rift) v.appendChild(riftCard(rift));

  /* من يستحق صلتك اليوم */
  const sug = S.suggestions(3);
  const sec = el('div', 'section');
  sec.appendChild(el('div', 'section-head',
    `<span class="section-title">مَن يستحق صلتك اليوم</span>${sug.length ? '<span class="muted">' + sug.length + '</span>' : ''}`));

  if (!sug.length) {
    const c = el('div', 'card');
    c.innerHTML = `<div style="text-align:center;padding:8px 0">
      <div style="font-size:38px">✅</div>
      <h3 style="margin:6px 0 4px">أرحامك كلهم موصولون</h3>
      <p class="muted">ما شاء الله. تابع على هذا الخير — ولك أن تُسجّل دعاءً لأحدهم.</p></div>`;
    sec.appendChild(c);
  } else {
    sug.forEach(({ p, s }) => sec.appendChild(suggestionCard(p, s)));
  }
  v.appendChild(sec);

  /* شريط التسجيل السريع — مصمَّم لمن يتصل ثم يسجّل، لا العكس */
  v.appendChild(quickLogStrip());

  /* اللقاء القادم */
  const g = S.activeGathering();
  if (g) v.appendChild(gatheringHero(g));

  /* مناسبات قريبة */
  const occ = S.upcomingOccasions(10);
  if (occ.length) {
    const os = el('div', 'section');
    os.appendChild(el('div', 'section-head',
      `<span class="section-title">مناسبات قريبة</span><button class="section-more" data-go="occ">الكل</button>`));
    occ.slice(0, 3).forEach(o => os.appendChild(occRow(o)));
    os.querySelector('[data-go]').onclick = () => go('occ');
    v.appendChild(os);
  }

  /* تذكير النسخة الاحتياطية — إداريّ، فمكانه أسفل الصفحة لا وسط قراراتها.
     يظهر بعد شجرة معتبرة، وشهرًا بعد آخر تصدير، ويُصرَف بلا إلحاح. */
  const bk = S.db.settings.backup || {};
  const sinceBackup = bk.lastExport ? (Date.now() - new Date(bk.lastExport)) / 86400000 : Infinity;
  const sinceNag = bk.lastNag ? (Date.now() - new Date(bk.lastNag)) / 86400000 : Infinity;
  if (S.activePeople().length >= 8 && sinceBackup > 30 && sinceNag > 14) {
    const w = el('div', 'card');
    w.style.cssText = 'border-color:var(--gold);margin-bottom:16px';
    w.innerHTML = `<div style="display:flex;gap:11px;align-items:flex-start">
        <span style="font-size:22px">💾</span>
        <div class="pc-main">
          <div class="pc-name" style="font-size:15px">${bk.lastExport ? 'مضى شهر على آخر نسخة' : 'احفظ نسخة من شجرتك'}</div>
          <p class="muted" style="margin-top:3px">بياناتك على هذا الجهاز وحده. مسحُ بيانات المتصفح أو تغيير الجهاز يضيّعها، والتصدير ثانيتان.</p>
        </div></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-gold" style="flex:1" data-export>⬇️ صدّر الآن</button>
        <button class="btn btn-ghost" data-later style="flex:none;padding:12px 16px">لاحقًا</button>
      </div>`;
    w.querySelector('[data-export]').onclick = () => {
      S.exportJSON();
      S.db.settings.backup = { ...bk, lastExport: new Date().toISOString() };
      S.save(); toast('نُزِّلت النسخة — احتفظ بها'); render();
    };
    w.querySelector('[data-later]').onclick = () => {
      S.db.settings.backup = { ...bk, lastNag: new Date().toISOString() };
      S.save(); render();
    };
    v.appendChild(w);
  }

  /* نص اليوم */
  v.appendChild(textOfDay());
}

/* ══ التسجيل السريع ═════════════════════════════════
   الحالة الشائعة: كلّم قريبه من الهاتف مباشرة ثم فتح التطبيق ليسجّل.
   فالمطلوب أقصر مسار ممكن: وجه → ضغطة → تم. بلا بحث ولا فتح صفحة.
   ترتيب الأسماء بالأولوية نفسها، ومن سُجّل اليوم ينزاح إلى الآخر. */
function quickLogStrip() {
  const today = new Date().toDateString();
  const loggedToday = new Set(
    S.db.events.filter(e => new Date(e.at).toDateString() === today).map(e => e.personId)
  );

  /* المقتطعان منفصلان عمدًا: لو فرزتُ المُسجَّلين إلى الآخر ثم اقتطعت،
     لسقطوا خارج الشريط ولما ظهرت علامة «تم» قط. */
  const all = S.activePeople().map(p => ({ p, done: loggedToday.has(p.id) }));
  const pending = all.filter(x => !x.done)
    .sort((a, b) => S.priorityOf(b.p) - S.priorityOf(a.p)).slice(0, 12);
  const done = all.filter(x => x.done).slice(0, 6);
  const rows = pending.concat(done);
  if (!rows.length) return el('div');

  const sec = el('div', 'section');
  sec.appendChild(el('div', 'section-head',
    `<span class="section-title">سجّل بسرعة</span><span class="muted">${
      done.length ? arPeople(done.length) + ' اليوم ✓' : 'كلّمته؟ اضغط وجهه'}</span>`));

  const strip = el('div', 'qstrip');
  rows.forEach(({ p, done }) => {
    const b = el('button', 'qitem' + (done ? ' done' : ''));
    b.innerHTML = `
      <span class="qav"><span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
        <span class="qtick">✓</span></span>
      <span class="qn">${esc(p.name.split(/\s+/)[0])}</span>`;
    /* ضغطة = اتصال · ضغطة مطوّلة = اختيار نوع الصلة */
    b.onclick = () => {
      logContact(p, 'call', '', 'سُجّل اتصالك بـ' + p.name.split(/\s+/)[0] + ' — تقبّل الله');
    };
    let timer;
    const hold = () => { timer = setTimeout(() => { timer = null; openLogSheet(p); }, 480); };
    const release = e => { if (timer) clearTimeout(timer); else e.preventDefault(); };
    b.addEventListener('pointerdown', hold);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointerleave', () => clearTimeout(timer));
    b.addEventListener('contextmenu', e => e.preventDefault());
    strip.appendChild(b);
  });
  sec.appendChild(strip);
  sec.appendChild(el('div', 'hint', '👆 ضغطة = اتصال · ضغطة مطوّلة = زيارة أو رسالة أو هديّة أو دعاء'));
  return sec;
}

function suggestionCard(p, s) {
  const rel = R.REL_MAP[p.relation] || {};
  const meta = S.STATE_META[s.state];
  const c = el('div', 'sug');
  c.style.setProperty('--st', meta.color);
  c.style.setProperty('--stbg', meta.bg);

  const reason = s.last
    ? `آخر ${R.ACTION_MAP[s.last.type]?.label || 'تواصل'} ${agoText(s.days)} · الدورة المقترحة ${cadenceText(s.cadence)}`
    : `لم تُسجَّل صلة بعد · الدورة المقترحة ${cadenceText(s.cadence)}`;
  /* آخر ما دار بينكما — هنا تثمر ملاحظة «وش صار؟» */
  const lastNote = s.last && s.last.note ? s.last.note : '';

  c.innerHTML = `
    <div class="sug-head">
      ${avatarRing(p, s, 56)}
      <div class="pc-main">
        <div class="pc-name">${esc(p.name)}</div>
        <div class="pc-rel">${esc(rel.label || '')}${p.city ? ' · ' + esc(p.city) : ''}</div>
      </div>
      <div class="sug-over">${s.ratio > 1 ? '×' + s.ratio.toFixed(1) : ''}</div>
    </div>
    <div class="sug-reason">${esc(reason)}</div>
    ${lastNote ? `<div class="sug-note">💬 ${esc(lastNote)}</div>` : ''}
    <div class="sug-actions">
      ${p.phone ? `<a class="btn btn-primary" href="tel:${esc(p.phone)}" data-call>📞 اتصل الآن</a>` : `<button class="btn btn-primary" data-log>✔️ سجّل صلة</button>`}
      <button class="btn" data-open>التفاصيل</button>
      <button class="btn btn-ghost" data-snooze aria-label="أجّله أسبوعًا" title="أجّله أسبوعًا" style="flex:none;min-width:48px;padding:12px 14px">⏱</button>
    </div>`;

  const callBtn = c.querySelector('[data-call]');
  if (callBtn) callBtn.onclick = () => logContact(p, 'call', '', 'سُجّل اتصالك بـ' + p.name + ' — تقبّل الله');
  const logBtn = c.querySelector('[data-log]');
  if (logBtn) logBtn.onclick = () => openLogSheet(p);
  c.querySelector('[data-open]').onclick = () => go('person', p.id);
  c.querySelector('[data-snooze]').onclick = () => {
    S.snooze(p.id, 7); haptic();
    toast(`أُجّل ${p.name.split(/\s+/)[0]} أسبوعًا — حرارته لم تتغيّر`,
      () => { S.unsnooze(p.id); toast('أُلغي التأجيل'); render(); });
    render();
  };
  return c;
}

function occRow(o) {
  const kind = R.OCCASION_MAP[o.oc.kind] || R.OCCASION_MAP.other;
  const b = el('button', 'occ');
  const when = o.inDays === 0 ? 'اليوم' : o.inDays === 1 ? 'غدًا' : o.inDays === 2 ? 'بعد يومين' : `بعد ${arDays(o.inDays)}`;
  b.innerHTML = `<span class="e">${kind.icon}</span>
    <div class="pc-main">
      <div class="pc-name">${esc(o.oc.title || kind.label)}</div>
      <div class="pc-rel">${esc(o.person.name)} · ${esc(kind.note)}</div>
    </div>
    <span class="in">${when}</span>`;
  b.onclick = () => go('person', o.person.id);
  return b;
}

let textIndex = null;
function textOfDay() {
  const pool = [
    ...T.VERSES.map(x => ({ kind: 'آية', ...x })),
    ...T.HADITHS.map(x => ({ kind: 'حديث', ...x }))
  ];
  if (textIndex === null) {
    const seed = Math.floor(Date.now() / 86400000);
    textIndex = seed % pool.length;
  }
  const t = pool[textIndex];
  const box = el('div', 'ayah');
  box.innerHTML = `
    <div class="ayah-kind">${t.kind === 'آية' ? '﴿ آية اليوم ﴾' : '❝ حديث اليوم ❞'}</div>
    <div class="ayah-text${t.kind === 'آية' ? ' q' : ''}">${esc(t.text)}</div>
    <div class="ayah-src">
      <span class="chip-src">${esc(t.ref || t.grade)}</span>
      ${t.source ? `<span>${esc(t.source)}</span>` : ''}
      ${t.narrator ? `<span>عن ${esc(t.narrator)}</span>` : ''}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost" style="flex:1" data-next>🔁 نص آخر</button>
      <button class="btn btn-ghost" style="flex:1" data-more>📖 المكتبة</button>
    </div>`;
  box.querySelector('[data-next]').onclick = () => { textIndex = (textIndex + 1) % pool.length; render(); };
  box.querySelector('[data-more]').onclick = () => go('texts');
  return box;
}

/* =====================================================================
   نموذج تجريبي: عائلة كاملة من ٢٩ قريبًا عبر الطبقات والجهات كلها.
   للاستعراض فقط — يُمسح من «المزيد ← مسح كل البيانات».
   الأرقام وهمية (05000000xx) ولا تعود لأحد.
   ===================================================================== */
const DEMO_PEOPLE = [
  /* الاسم، القرابة، الجوال، المدينة، أيام منذ آخر تواصل (null = لم يُسجَّل)، نوعه، ملاحظة */
  ['عبدالعزيز — والدي',   'father',      '0500000001', 'الرياض', 0,   'call',    'يسأل عن الأولاد كل جمعة. يحب أن أتصل بعد العصر.'],
  ['حصّة — والدتي',        'mother',      '0500000002', 'الرياض', 0,   'visit',   'موعد مراجعتها في المستشفى أول كل شهر.'],

  ['جدّي إبراهيم',         'gf_f',        '0500000003', 'بريدة',  3,   'call',    'تجاوز التسعين، يفرح بالاتصال ولو دقيقة.'],
  ['جدّتي لطيفة',          'gm_f',        '',           'بريدة',  6,   'visit',   ''],
  ['جدّي سليمان',          'gf_m',        '0500000004', 'الرياض', 45,  'visit',   ''],
  ['جدّتي موضي',           'gm_m',        '',           'الرياض', 20,  'call',    ''],

  ['سعد — أخي',            'brother',     '0500000005', 'جدة',    4,   'message', ''],
  ['مشعل — أخي',           'brother',     '0500000006', 'الرياض', 8,   'visit',   ''],
  ['نورة — أختي',          'sister',      '0500000007', 'الرياض', 26,  'call',    'انشغلت بعد الولادة — تحتاج سؤالًا واطمئنانًا.'],
  ['ريم — أختي',           'sister',      '0500000008', 'الخبر',  2,   'message', ''],

  ['فهد — عمّي',           'uncle_p',     '0500000009', 'القصيم', 95,  'call',    'آخر مرة عاتبني على الانقطاع.'],
  ['خالد — عمّي',          'uncle_p',     '0500000010', 'الرياض', 18,  'visit',   ''],
  ['منيرة — عمّتي',        'aunt_p',      '0500000011', 'الرياض', null, null,     'لم أسجّل لها صلة منذ أضفتها.'],
  ['سارة — عمّتي',         'aunt_p',      '',           'جدة',    33,  'message', ''],

  ['ماجد — خالي',          'uncle_m',     '0500000012', 'الدمام', 140, 'message', 'بيني وبينه فتور منذ سنة — أنوي إصلاحه.'],
  ['بندر — خالي',          'uncle_m',     '0500000013', 'الرياض', 10,  'visit',   ''],
  ['هيا — خالتي',          'aunt_m',      '0500000014', 'الرياض', 20,  'call',    'الخالة بمنزلة الأم.'],
  ['أمل — خالتي',          'aunt_m',      '',           'المدينة', 60, 'gift',    ''],

  ['تركي — ابن عمّي',      'c_uncle_p_m', '0500000015', 'الرياض', 40,  'message', ''],
  ['الجوهرة — بنت عمّي',   'c_uncle_p_f', '',           'الرياض', 100, 'gift',    ''],
  ['فيصل — ابن عمّتي',     'c_aunt_p_m',  '0500000016', 'جدة',    null, null,     ''],
  ['عبدالرحمن — ابن خالي', 'c_uncle_m_m', '0500000017', 'الدمام', 200, 'call',    ''],
  ['لمى — بنت خالي',       'c_uncle_m_f', '',           'مكة',    null, null,     ''],
  ['جواهر — بنت خالتي',    'c_aunt_m_f',  '',           'الرياض', 30,  'message', ''],

  ['ياسر — ابني',          'son',         '',           'الرياض', 0,   'visit',   ''],
  ['جنى — ابنتي',          'daughter',    '',           'الرياض', 0,   'visit',   ''],

  ['عبدالإله — ابن أخي',   'nephew_b',    '',           'جدة',    15,  'gift',    ''],
  ['شهد — بنت أخي',        'niece_b',     '',           'جدة',    50,  'message', ''],
  ['سلطان — ابن أختي',     'nephew_s',    '',           'الخبر',  70,  'visit',   ''],

  ['منصور — ابن عمّ والدي', 'other_m',    '0500000018', 'بريدة',  300, 'call',    'من كبار العائلة، وصلته تصل الجميع.']
];

/* مناسبات النموذج: [رقم الشخص، النوع، العنوان، بعد كم يوم من اليوم] */
const DEMO_OCCASIONS = [
  [26, 'birth',   'ميلاد عبدالإله',        2],
  [0,  'birth',   'ميلاد والدي',           5],
  [6,  'wedding', 'ذكرى زواج سعد',         9],
  [1,  'birth',   'ميلاد والدتي',          18],
  [16, 'birth',   'ميلاد خالتي هيا',       25],
  [24, 'birth',   'ميلاد ياسر',            41],
  [10, 'other',   'تقاعد عمّي فهد',        63]
];

function seedDemo() {
  const DAY = 86400000;
  const TYPES = ['visit', 'call', 'message', 'gift', 'dua'];
  const ids = [];

  DEMO_PEOPLE.forEach(([name, relation, phone, city, ago, type, notes], i) => {
    const p = S.addPerson({ name, relation, phone, city, notes });
    ids.push(p.id);
    if (ago === null) return;

    S.addEvent(p.id, type, '', new Date(Date.now() - ago * DAY).toISOString());

    /* سجل أقدم ليبدو الخط الزمني حقيقيًا — متغيّر لكنه ثابت لكل شخص */
    const extra = (i * 7 + 3) % 4;
    for (let k = 1; k <= extra; k++) {
      const back = ago + k * (12 + (i * 5 + k * 9) % 40);
      if (back > 900) break;
      S.addEvent(p.id, TYPES[(i + k * 3) % TYPES.length], '', new Date(Date.now() - back * DAY).toISOString());
    }
  });

  /* لمّات النموذج */
  const iso = days => {
    const d = new Date(Date.now() + days * DAY);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const pick = idxs => idxs.map(i => ids[i]);
  const cousins = pick([18, 19, 20, 21, 22, 23]);          /* عيال العم والخال */
  const sibs = pick([6, 7, 8, 9]);                          /* الإخوة */
  const elders = pick([2, 3, 10, 11, 12, 13, 14, 15, 16, 17]);

  S.addGathering({ title: 'لمّة عيال العم', date: iso(6), time: '20:30',
    place: 'استراحة أبو تركي — طريق الثمامة', guests: cousins, repeat: 'monthly',
    notes: 'العشاء الساعة ٩ ونرجو إحضار الأطفال.' });

  S.addGathering({ title: 'غداء الجمعة عند الوالدين', date: iso(-2), time: '13:00',
    place: 'بيت الوالد — حي الملقا', guests: sibs.concat(pick([24, 25])), repeat: 'weekly' });

  S.addGathering({ title: 'اجتماع العائلة الكبير', date: iso(24), time: '19:00',
    place: 'مزرعة العائلة — الخرج', guests: elders.concat(cousins, sibs), repeat: 'quarterly',
    notes: 'اللقاء السنوي الموسّع، ونود حضور الجميع.' });

  /* لمّة سابقة سُجّل حضورها */
  const done = S.addGathering({ title: 'لمّة عيال العم', date: iso(-24), time: '20:30',
    place: 'استراحة أبو تركي — طريق الثمامة', guests: cousins, repeat: 'none' });
  S.recordAttendance(done.id, cousins.slice(0, 4));

  const byPerson = {};
  DEMO_OCCASIONS.forEach(([idx, kind, title, inDays]) => {
    const d = new Date(Date.now() + inDays * DAY);
    (byPerson[idx] = byPerson[idx] || []).push({
      id: S.uid(), kind, title,
      date: String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    });
  });
  Object.entries(byPerson).forEach(([idx, occasions]) => S.updatePerson(ids[idx], { occasions }));
}

function emptyBox(emoji, title, sub, btnLabel, onClick) {
  const e = el('div', 'card empty');
  e.innerHTML = `<span class="e">${emoji}</span><h3>${esc(title)}</h3><p>${esc(sub)}</p>`;
  if (btnLabel) {
    const b = el('button', 'btn btn-primary btn-lg', esc(btnLabel));
    b.onclick = onClick; e.appendChild(b);
  }
  return e;
}

/* ══════════════════════════════════════════════════
   ٢) أرحامي
   ══════════════════════════════════════════════════ */
let pFilter = 'all', pQuery = '';

function viewPeople(v) {
  const addB = el('button', 'tb-btn primary', '＋ إضافة');
  addB.onclick = () => openAddSheet();
  $('#tb-action').appendChild(addB);

  const people = S.activePeople();
  if (!people.length) {
    v.appendChild(emptyBox('🌱', 'لا يوجد أحد بعد',
      'أضف أرحامك واحدًا واحدًا — ابدأ بالوالدين والإخوة.', 'أضف قريبًا', () => openAddSheet()));
    return;
  }

  const search = el('input', 'search');
  search.type = 'search'; search.placeholder = '🔍 ابحث بالاسم…'; search.value = pQuery;
  search.oninput = () => { pQuery = search.value; paint(); };
  v.appendChild(search);

  const filters = el('div', 'filters');
  const opts = [
    ['all', 'الكل'], ['cold', '🔴 منقطع'], ['due', '🟡 قارب'], ['warm', '🟢 موصول'],
    ['t1', 'رحم واجب'], ['father', 'جهة الأب'], ['mother', 'جهة الأم'], ['self', 'أسرتي']
  ];
  opts.forEach(([k, l]) => {
    const b = el('button', 'fchip', l);
    b.setAttribute('aria-pressed', pFilter === k);
    b.onclick = () => { pFilter = k; paint(); };
    filters.appendChild(b);
  });
  v.appendChild(filters);

  const list = el('div');
  v.appendChild(list);

  function paint() {
    v.querySelectorAll('.fchip').forEach((b, i) => b.setAttribute('aria-pressed', opts[i][0] === pFilter));
    list.innerHTML = '';

    let rows = people.map(p => ({ p, s: S.statusOf(p) }));
    if (pQuery.trim()) {
      /* بحثٌ متسامح مع الإملاء: «احمد» يجد «أحمد»، و«حصه» تجد «حصّة» */
      const q = S.normalizeName(pQuery);
      rows = rows.filter(r =>
        S.normalizeName(r.p.name).includes(q) ||
        S.normalizeName(R.REL_MAP[r.p.relation]?.label || '').includes(q));
    }
    if (pFilter === 'cold') rows = rows.filter(r => r.s.state === 'cold' || r.s.state === 'new');
    else if (pFilter === 'due') rows = rows.filter(r => r.s.state === 'due');
    else if (pFilter === 'warm') rows = rows.filter(r => r.s.state === 'warm');
    else if (pFilter === 't1') rows = rows.filter(r => r.s.tier === 1);
    else if (['father', 'mother', 'self'].includes(pFilter))
      rows = rows.filter(r => (R.REL_MAP[r.p.relation]?.side) === pFilter);

    rows.sort((a, b) => S.priorityOf(b.p) - S.priorityOf(a.p));

    if (!rows.length) {
      list.appendChild(el('div', 'card empty', '<span class="e">🔎</span><h3>لا نتائج</h3><p>جرّب بحثًا أو تصنيفًا آخر.</p>'));
      return;
    }
    const head = el('div', 'muted');
    head.style.margin = '2px 2px 10px';
    head.textContent = `${rows.length} من ${people.length}`;
    list.appendChild(head);
    rows.forEach(({ p, s }) => list.appendChild(personCard(p, s)));
  }
  paint();
}

function personCard(p, s) {
  const rel = R.REL_MAP[p.relation] || {};
  const side = R.SIDES[rel.side] || R.SIDES.other;
  const meta = S.STATE_META[s.state];
  const b = el('button', 'pcard');
  b.style.setProperty('--st', meta.color);
  b.innerHTML = `
    ${avatarRing(p, s, 50)}
    <div class="pc-main">
      <div class="pc-name">${esc(p.name)} <span class="pc-side" style="--sidebg:${side.color}1f;--sidec:${side.color}">${esc(side.short)}</span></div>
      <div class="pc-rel">${esc(rel.label || '')}</div>
      <div class="pc-meta">${esc(s.last ? R.ACTION_MAP[s.last.type]?.label + ' ' + agoText(s.days) : s.label)}</div>
    </div>
    <span class="pc-go">‹</span>`;
  b.onclick = () => go('person', p.id);
  return b;
}

/* ══════════════════════════════════════════════════
   ٣) صفحة القريب
   ══════════════════════════════════════════════════ */
function viewPerson(v, id) {
  const p = S.getPerson(id);
  if (!p) return go('people');
  const rel = R.REL_MAP[p.relation] || {};
  const s = S.statusOf(p);
  const meta = S.STATE_META[s.state];
  const side = R.SIDES[rel.side] || R.SIDES.other;
  const tier = R.TIERS[rel.tier] || R.TIERS[3];

  $('#tb-title').textContent = p.name;
  backBtn('people');
  const edit = el('button', 'tb-btn', '✏️ تعديل');
  edit.onclick = () => openAddSheet(p);
  $('#tb-action').appendChild(edit);

  /* رأس البطاقة */
  const head = el('div', 'card');
  head.style.textAlign = 'center';
  head.innerHTML = `
    <div class="avatar" style="--av:${avatarColor(p.id)};width:64px;height:64px;font-size:23px;margin:2px auto 10px">${esc(initials(p.name))}</div>
    <h2 style="font-size:21px">${esc(p.name)}</h2>
    <div class="muted" style="margin-top:2px">${esc(rel.label || '')} · ${esc(side.label)}${p.city ? ' · ' + esc(p.city) : ''}</div>
    <div style="display:inline-flex;gap:7px;margin-top:11px;flex-wrap:wrap;justify-content:center">
      <span class="badge" style="background:${meta.bg};color:${meta.color}">${meta.dot} ${esc(s.label)}</span>
      <span class="badge" style="background:${tier.color}1a;color:${tier.color}">${esc(tier.label)}</span>
      <span class="badge o">🔁 ${esc(cadenceText(s.cadence))}</span>
    </div>
    ${rel.notRahim ? '<div class="hint" style="margin-top:9px">ملاحظة: هذه القرابة ليست من الرحم المحرَّم، وأُدرجت للتذكير بالإحسان والصلة.</div>' : ''}`;
  v.appendChild(head);

  /* التأجيل يجب أن يكون مرئيًا وقابلًا للإلغاء، لا اختفاءً صامتًا */
  if (S.isSnoozed(p)) {
    const days = Math.max(1, Math.ceil((new Date(p.snoozeUntil) - Date.now()) / 86400000));
    const sn = el('div', 'card');
    sn.style.cssText = 'margin-top:10px;border-color:var(--gold)';
    sn.innerHTML = `<div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">⏱</span>
      <span class="pc-main"><span class="pc-name" style="font-size:14px">مؤجَّل ${esc(arDays(days))}</span>
        <span class="pc-rel">لا يظهر في اقتراحات اليوم — وحرارته لم تتغيّر</span></span>
      <button class="btn btn-ghost" data-unsnooze style="flex:none;padding:10px 14px">ألغِ</button></div>`;
    sn.querySelector('[data-unsnooze]').onclick = () => {
      S.unsnooze(p.id); toast('أُلغي التأجيل'); render();
    };
    v.appendChild(sn);
  }

  /* اتصال سريع */
  if (p.phone) {
    const row = el('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:10px';
    row.innerHTML = `
      <a class="btn btn-primary" style="flex:1" href="tel:${esc(p.phone)}">📞 اتصال</a>
      <a class="btn btn-gold" style="flex:1" href="https://wa.me/${esc(p.phone.replace(/[^\d]/g, ''))}" target="_blank" rel="noopener">💬 واتساب</a>
      <a class="btn" style="flex:1" href="sms:${esc(p.phone)}">✉️ رسالة</a>`;
    row.querySelectorAll('a').forEach((a, i) => {
      a.addEventListener('click', () => {
        S.addEvent(p.id, i === 0 ? 'call' : 'message');
        toast('سُجّلت الصلة — تقبّل الله');
        setTimeout(render, 800);
      });
    });
    v.appendChild(row);
  }

  /* تسجيل بضغطة */
  const logSec = el('div', 'section');
  logSec.style.marginTop = '18px';
  logSec.appendChild(el('div', 'section-head', '<span class="section-title">سجّل صلة — بضغطة واحدة</span>'));
  const acts = el('div', 'acts');
  R.ACTIONS.forEach(a => {
    const b = el('button', 'act big', `<span class="e">${a.icon}</span><span>${a.label}</span>`);
    b.onclick = () => logContact(p, a.key, '',
      a.key === 'dua' ? 'تقبّل الله دعاءك 🤲' : `سُجّلت ${a.label} — بارك الله فيك`);
    acts.appendChild(b);
  });
  logSec.appendChild(acts);
  logSec.appendChild(el('div', 'hint', '🤲 الدعاء يُسجَّل كحسنة ولا يُصفِّر عدّاد التواصل — الصلة تحتاج تواصلًا.'));
  v.appendChild(logSec);

  /* نيّة الصلح */
  const riftOn = S.hasRift(p);
  const riftBtn = el('button', 'rowlink' + (riftOn ? ' on' : ''));
  riftBtn.style.marginBottom = '10px';
  riftBtn.innerHTML = `<span class="e">🤝</span>
    <span class="t">بيني وبينه جفوة
      <span class="s">${riftOn
        ? 'في نيّة الصلح — خطوة كل أسبوع، ومرفوع من الإلحاح اليومي'
        : 'يُرفَع من قائمة الإلحاح، ويُنقَل إلى مسار الصلح الهادئ'}</span></span>
    <span class="switch" aria-checked="${riftOn}"></span>`;
  riftBtn.onclick = () => {
    if (riftOn) go('rift');
    else openRiftNote(p, true);
  };
  v.appendChild(riftBtn);

  /* علامة الحج — تُدرِجه في قائمة الحجّاج خلال ذي الحجة */
  const y = S.currentHijriYear();
  const isHajj = p.hajjYear === y;
  const hajjBtn = el('button', 'rowlink' + (isHajj ? ' on' : ''));
  hajjBtn.style.marginBottom = '22px';
  hajjBtn.innerHTML = `<span class="e">🕋</span>
    <span class="t">يحجّ هذا العام${y ? ` (${y}هـ)` : ''}
      <span class="s">${isHajj ? 'مُدرَج في قائمة الحجّاج — تُذكَّر بالدعاء له والتهنئة' : 'علّمه ليظهر في بطاقة العشر وعرفة والأضحى'}</span></span>
    <span class="switch" aria-checked="${isHajj}"></span>`;
  hajjBtn.onclick = () => {
    const on = S.toggleHajj(p.id); haptic();
    toast(on ? 'أُدرِج في قائمة الحجّاج 🕋' : 'أُزيل من القائمة');
    render();
  };
  v.appendChild(hajjBtn);

  /* المناسبات */
  const occSec = el('div', 'section');
  occSec.appendChild(el('div', 'section-head',
    '<span class="section-title">المناسبات</span><button class="section-more" data-add>＋ إضافة</button>'));
  if (!(p.occasions || []).length) {
    occSec.appendChild(el('div', 'card muted', 'لم تُضِف مناسبات — أضف الميلاد أو الزواج أو ذكرى وفاة لتصلك تذكيرات.'));
  } else {
    p.occasions.forEach(oc => {
      const k = R.OCCASION_MAP[oc.kind] || R.OCCASION_MAP.other;
      const [mm, dd] = (oc.date || '').split('-').map(Number);
      const row = el('div', 'occ');
      row.innerHTML = `<span class="e">${k.icon}</span>
        <div class="pc-main"><div class="pc-name">${esc(oc.title || k.label)}</div>
        <div class="pc-rel">${dd || '?'} ${esc((oc.cal === 'h' && window.SEASON ? window.SEASON.HIJRI_MONTHS : AR_MONTHS)[(mm || 1) - 1])}${oc.cal === 'h' ? ' 🌙' : ''} — سنويًا</div></div>
        <button class="btn btn-ghost" style="padding:6px 10px" data-del>🗑</button>`;
      row.querySelector('[data-del]').onclick = () => {
        S.updatePerson(p.id, { occasions: p.occasions.filter(x => x.id !== oc.id) });
        render();
      };
      occSec.appendChild(row);
    });
  }
  occSec.querySelector('[data-add]').onclick = () => openOccasionSheet(p);
  v.appendChild(occSec);

  /* السجل */
  const evs = S.eventsOf(p.id);
  const hSec = el('div', 'section');
  hSec.appendChild(el('div', 'section-head', `<span class="section-title">سجل الصلة</span><span class="muted">${evs.length}</span>`));
  if (!evs.length) {
    hSec.appendChild(el('div', 'card muted', 'لا يوجد سجل بعد. أول تسجيل يبدأ من هنا.'));
  } else {
    const tl = el('div', 'tl');
    evs.slice(0, 25).forEach(e => {
      const a = R.ACTION_MAP[e.type] || { icon: '•', label: e.type };
      const d = new Date(e.at);
      const item = el('div', 'tlitem');
      item.innerHTML = `<div class="t">${a.icon} ${esc(a.label)}${e.note ? ' — ' + esc(e.note) : ''}</div>
        <div class="d">${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()} · ${agoText(Math.floor((Date.now() - d) / 86400000))}
        <button class="btn btn-ghost" style="padding:0 6px;font-size:12px;color:var(--ink-3)" data-del="${e.id}">حذف</button></div>`;
      item.querySelector('[data-del]').onclick = () => { S.deleteEvent(e.id); render(); };
      tl.appendChild(item);
    });
    hSec.appendChild(tl);
  }
  v.appendChild(hSec);

  /* الملاحظات */
  if (p.notes) {
    const n = el('div', 'card');
    n.innerHTML = `<div class="section-title" style="margin-bottom:6px">ملاحظات</div><div>${esc(p.notes).replace(/\n/g, '<br>')}</div>`;
    v.appendChild(n);
  }

  const del = el('button', 'btn btn-danger btn-block', '🗑 حذف هذا القريب');
  del.style.marginTop = '18px';
  del.onclick = () => confirmSheet({
    title: `حذف «${p.name}»؟`,
    body: evs.length
      ? `سيُحذف معه <b>${esc(arLogs(evs.length))}</b> للصلة. لا يمكن التراجع عن هذا.`
      : 'لا يوجد له سجل صلة. لا يمكن التراجع عن الحذف.',
    confirm: '🗑 نعم، احذفه',
    cancel: 'أبقِه',
    danger: true,
    onConfirm: () => { S.deletePerson(p.id); toast('تم الحذف'); go('people'); }
  });
  v.appendChild(del);
}

/* ── ورقة تأكيد — بديل confirm() ───────────────────
   كل زر يقول ما سيحدث، ولا يوجد زر يعني شيئًا آخر غير اسمه. */
function confirmSheet({ title, body, confirm, cancel = 'إلغاء', danger, onConfirm }) {
  openSheet(`
    <h3>${esc(title)}</h3>
    ${body ? `<p class="sheet-sub">${body}</p>` : ''}
    <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'} btn-lg" id="c-yes">${esc(confirm)}</button>
    <button class="btn btn-ghost btn-block" id="c-no" style="margin-top:9px">${esc(cancel)}</button>`,
    b => {
      b.querySelector('#c-yes').onclick = () => { closeSheet(); onConfirm(); };
      b.querySelector('#c-no').onclick = closeSheet;
    });
}

/* ── ورقة فشل — تقول السبب والخطوة التالية ────────── */
function failSheet(reason) {
  openSheet(`
    <h3>تعذّر إتمام العملية</h3>
    <p class="sheet-sub">${esc(reason)}</p>
    <div class="card muted" style="margin-bottom:13px">
      تأكّد أنك اخترت ملفًا صدَّرته «صِلة» نفسها — ينتهي اسمه بـ <code dir="ltr">.json</code> ويبدأ بـ «صلة-نسخة».
    </div>
    <button class="btn btn-primary btn-lg" data-close>حسنًا</button>`);
}

/* ── ورقة خيارات — لمّا يكون القرار ثلاثيًا ───────── */
function optionSheet({ title, body, options }) {
  openSheet(`
    <h3>${esc(title)}</h3>
    ${body ? `<p class="sheet-sub">${body}</p>` : ''}
    <div class="optlist">
      ${options.map((o, i) => `
        <button class="opt${o.danger ? ' danger' : ''}" data-i="${i}">
          <span class="opt-e">${o.icon}</span>
          <span class="opt-t">${esc(o.label)}<span>${esc(o.desc)}</span></span>
        </button>`).join('')}
    </div>
    <button class="btn btn-ghost btn-block" id="o-cancel" style="margin-top:11px">إلغاء</button>`,
    b => {
      b.querySelectorAll('[data-i]').forEach(el => el.onclick = () => {
        closeSheet(); options[Number(el.dataset.i)].run();
      });
      b.querySelector('#o-cancel').onclick = closeSheet;
    });
}

/* ── ورقة تسجيل سريعة ─────────────────────────────── */
function openLogSheet(p) {
  const DAY = 86400000;
  /* «متى» يمنع تشويه حساب الحرارة حين يُسجَّل لقاءُ أمس اليوم */
  const WHEN = [
    { d: 0, label: 'اليوم' }, { d: 1, label: 'أمس' },
    { d: 2, label: 'قبل يومين' }, { d: 3, label: 'قبل 3 أيام' },
    { d: 7, label: 'قبل أسبوع' }
  ];
  let back = 0;

  openSheet(`
    <h3>سجّل صلة مع ${esc(p.name)}</h3>
    <p class="sheet-sub">اختر نوع الصلة — ضغطة واحدة تكفي.</p>
    <div class="acts">
      ${R.ACTIONS.map(a => `<button class="act big" data-a="${a.key}"><span class="e">${a.icon}</span><span>${a.label}</span></button>`).join('')}
    </div>

    <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:16px 0 8px">متى؟</div>
    <div class="relchips">
      ${WHEN.map(w => `<button class="relchip" data-w="${w.d}" aria-pressed="${w.d === 0}">${w.label}</button>`).join('')}
    </div>

    <label class="field" style="margin-top:14px"><span>ملاحظة (اختياري)</span>
      <input id="lognote" type="text" placeholder="مثال: سألته عن صحته، وذكر أنه مسافر"></label>
    <div class="hint">الملاحظة تظهر في سجلّه، فتذكّرك المرة القادمة بآخر ما دار بينكما.</div>`,
    body => {
      body.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
        back = Number(b.dataset.w);
        body.querySelectorAll('[data-w]').forEach(x => x.setAttribute('aria-pressed', x === b));
      });
      body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const at = back ? new Date(Date.now() - back * DAY).toISOString() : undefined;
        const ev = S.addEvent(p.id, b.dataset.a, body.querySelector('#lognote').value, at);
        haptic(); closeSheet();
        toast(back ? 'سُجّلت الصلة بتاريخها' : 'سُجّلت الصلة — تقبّل الله',
          () => { S.deleteEvent(ev.id); toast('أُلغي التسجيل'); render(); });
        render();
      });
    });
}

/* ── ورقة المناسبة ────────────────────────────────── */
function openOccasionSheet(p) {
  const hijriOk = !!(window.SEASON && window.SEASON.hijri());
  openSheet(`
    <h3>مناسبة لـ${esc(p.name)}</h3>
    <p class="sheet-sub">تُذكِّرك صِلة قبل موعدها كلَّ عام.</p>
    <div class="relchips" id="okinds" style="margin-bottom:14px">
      ${R.OCCASION_KINDS.map((k, i) => `<button class="relchip" data-k="${k.key}" aria-pressed="${i === 0}">${k.icon} ${k.label}</button>`).join('')}
    </div>
    <label class="field"><span>العنوان</span><input id="otitle" type="text" placeholder="مثال: ميلاد أبي"></label>

    ${hijriOk ? `
    <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:2px 0 8px">التقويم</div>
    <div class="relchips" id="ocal" style="margin-bottom:13px">
      <button class="relchip" data-cal="g" aria-pressed="true">ميلادي</button>
      <button class="relchip" data-cal="h" aria-pressed="false">هجري 🌙</button>
    </div>` : ''}

    <div class="field-row">
      <label class="field"><span>اليوم</span><input id="oday" type="number" min="1" max="31" inputmode="numeric" placeholder="15"></label>
      <label class="field"><span>الشهر</span>
        <select id="omonth">${AR_MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label>
    </div>
    <button class="btn btn-primary btn-lg" id="osave">حفظ المناسبة</button>`,
    body => {
      let kind = R.OCCASION_KINDS[0].key;
      let cal = 'g';
      const monthSel = body.querySelector('#omonth');
      const daysIn = () => cal === 'h' ? 30 : 31;

      body.querySelectorAll('#okinds .relchip').forEach(b => b.onclick = () => {
        kind = b.dataset.k;
        body.querySelectorAll('#okinds .relchip').forEach(x => x.setAttribute('aria-pressed', x === b));
      });
      body.querySelectorAll('#ocal [data-cal]').forEach(b => b.onclick = () => {
        cal = b.dataset.cal;
        body.querySelectorAll('#ocal [data-cal]').forEach(x => x.setAttribute('aria-pressed', x === b));
        const months = cal === 'h' ? window.SEASON.HIJRI_MONTHS : AR_MONTHS;
        monthSel.innerHTML = months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
        body.querySelector('#oday').max = daysIn();
        haptic();
      });

      body.querySelector('#osave').onclick = () => {
        const d = Number(body.querySelector('#oday').value);
        const m = Number(monthSel.value);
        if (!d || d < 1 || d > daysIn()) return toast('أدخل يومًا صحيحًا');
        const list = (p.occasions || []).concat([{
          id: S.uid(), kind,
          title: body.querySelector('#otitle').value.trim() || R.OCCASION_MAP[kind].label,
          date: String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'),
          ...(cal === 'h' ? { cal: 'h' } : {})
        }]);
        S.updatePerson(p.id, { occasions: list });
        closeSheet(); toast('أُضيفت المناسبة'); render();
      };
    });
}

/* ══════════════════════════════════════════════════
   معالج بناء الشجرة
   المستخدم الجديد يفتح تطبيقًا فارغًا فيقف: «مَن أرحامي؟».
   السؤال المرتَّب يستخرج ما في ذهنه أسرع من نموذج فارغ.
   ══════════════════════════════════════════════════ */
const WIZARD = [
  { rel: 'father',   title: 'والدك',            hint: 'اسم والدك — واتركه فارغًا إن كان متوفّى أو لا تريد إضافته الآن.', single: true },
  { rel: 'mother',   title: 'والدتك',           hint: 'اسم والدتك.', single: true },
  { rel: 'brother',  title: 'إخوانك',           hint: 'اسم كل أخ في سطر.' },
  { rel: 'sister',   title: 'أخواتك',           hint: 'اسم كل أخت في سطر.' },
  { rel: 'son',      title: 'أبناؤك',           hint: 'اتركها فارغة إن لم يكن لك أبناء.' },
  { rel: 'daughter', title: 'بناتك',            hint: '' },
  { rel: 'uncle_p',  title: 'أعمامك',           hint: 'إخوة والدك.' },
  { rel: 'aunt_p',   title: 'عمّاتك',           hint: 'أخوات والدك.' },
  { rel: 'uncle_m',  title: 'أخوالك',           hint: 'إخوة والدتك.' },
  { rel: 'aunt_m',   title: 'خالاتك',           hint: 'أخوات والدتك — «الخالة بمنزلة الأم».' },
  { rel: 'gf_f',     title: 'جدّك وجدّتك لأبيك', hint: 'اسم الجد ثم الجدة، كلٌّ في سطر.', pair: 'gm_f' },
  { rel: 'gf_m',     title: 'جدّك وجدّتك لأمّك', hint: 'اسم الجد ثم الجدة، كلٌّ في سطر.', pair: 'gm_m' }
];

function openWizard() {
  let step = 0;
  const answers = {};        /* rel -> [أسماء] */

  const render_ = () => {
    const s = WIZARD[step];
    const pct = Math.round(step / WIZARD.length * 100);
    const prev = (answers[s.rel] || []).join('\n');

    openSheet(`
      <div class="wiz-bar"><i style="width:${pct}%"></i></div>
      <div class="wiz-step">الخطوة ${step + 1} من ${WIZARD.length}</div>
      <h3>${esc(s.title)}</h3>
      <p class="sheet-sub">${esc(s.hint || '')}</p>

      ${s.single
        ? `<label class="field"><input id="w-in" type="text" placeholder="الاسم" value="${esc(prev)}"></label>`
        : `<label class="field"><textarea id="w-in" style="min-height:120px;line-height:2" placeholder="اسم في كل سطر">${esc(prev)}</textarea></label>`}
      <div class="hint" id="w-count"></div>

      <div style="display:flex;gap:8px;margin-top:16px">
        ${step > 0 ? '<button class="btn" id="w-back" style="flex:none;padding:14px 18px">‹</button>' : ''}
        <button class="btn btn-primary" id="w-next" style="flex:1">${step === WIZARD.length - 1 ? 'أنهِ وابنِ الشجرة' : 'التالي'}</button>
      </div>
      <button class="btn btn-ghost btn-block" id="w-skip" style="margin-top:9px">تخطّى هذه</button>
      <button class="btn btn-ghost btn-block" id="w-quit" style="margin-top:4px;color:var(--ink-3)">أنهِ الآن بما أدخلتُه</button>
    `, body => {
      const inp = body.querySelector('#w-in');
      const cnt = body.querySelector('#w-count');
      const names = () => inp.value.split('\n').map(x => x.trim()).filter(Boolean);
      const tick = () => {
        const n = names().length;
        cnt.textContent = n ? `${arPeople(n)} في هذه الخطوة` : '';
      };
      inp.oninput = tick; tick();
      inp.focus({ preventScroll: true });

      const save = () => { answers[s.rel] = names(); };
      const advance = () => {
        if (step < WIZARD.length - 1) { step++; render_(); }
        else finish();
      };

      body.querySelector('#w-next').onclick = () => { save(); advance(); };
      body.querySelector('#w-skip').onclick = () => { answers[s.rel] = []; advance(); };
      const back = body.querySelector('#w-back');
      if (back) back.onclick = () => { save(); step--; render_(); };
      body.querySelector('#w-quit').onclick = () => { save(); finish(); };
      if (s.single) inp.onkeydown = e => { if (e.key === 'Enter') { save(); advance(); } };
    });
  };

  const finish = () => {
    let added = 0;
    WIZARD.forEach(s => {
      const list = answers[s.rel] || [];
      list.forEach((name, i) => {
        /* خطوة الجدّين: الأول جد والثاني جدة */
        const rel = (s.pair && i === 1) ? s.pair : s.rel;
        if (S.findDuplicates(name, rel).length) return;   /* لا يُكرَّر */
        S.addPerson({ name, relation: rel });
        added++;
      });
    });
    closeSheet();
    toast(added ? `بُنيت شجرتك — ${arPeople(added)} 🌿` : 'لم يُضَف أحد');
    go('tree');
  };

  render_();
}

/* ══════════════════════════════════════════════════
   الاستيراد من جهات الاتصال
   كتابة ٣٠ رقمًا يدويًا أكبر عائق بعد الأسماء. Contact Picker
   يعطي الاسم والرقم من دفتر الهاتف — كروم/أندرويد فقط، ولا يصل
   التطبيق إلى شيء لم يخترْه المستخدم بنفسه في نافذة النظام.
   ══════════════════════════════════════════════════ */
const contactsSupported = () =>
  'contacts' in navigator && 'ContactsManager' in window &&
  typeof navigator.contacts.select === 'function';

/* أرقام دفتر الهاتف تأتي بمسافات وشُرَط ورموز — تُنظَّف ويُوحَّد المفتاح */
function cleanPhone(t) {
  return String(t || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
}

function openContactImport(preRel) {
  if (!contactsSupported()) {
    openSheet(`
      <h3>الاستيراد من جهات الاتصال</h3>
      <p class="sheet-sub">هذه الميزة يتيحها المتصفح على <b>أندرويد مع كروم</b> فقط. جهازك أو متصفحك لا يدعمها.</p>
      <div class="card muted" style="margin-bottom:13px">
        آبل لا تتيح للمواقع قراءة جهات الاتصال إطلاقًا، فلا توجد طريقة لتشغيلها على آيفون.
      </div>
      <button class="btn btn-primary btn-lg" id="c-bulk">⚡ أضِفهم دفعة واحدة بدلًا من ذلك</button>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:9px">إغلاق</button>`,
      b => b.querySelector('#c-bulk').onclick = () => { closeSheet(); openBulkAddSheet(preRel); });
    return;
  }

  let relKey = preRel || null;
  openSheet(`
    <h3>الاستيراد من جهات الاتصال</h3>
    <p class="sheet-sub">اختر صلة القرابة، ثم اختر من دفتر هاتفك. لن يصل التطبيق إلا إلى من تحدّده أنت.</p>

    <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:4px 0 9px">صلة القرابة *</div>
    ${R.REL_PICKER.map(g => `
      <div class="relgrp"><h4>${g.title}</h4><div class="relchips">
        ${g.keys.map(k => `<button class="relchip" data-rel="${k}" aria-pressed="${relKey === k}">${R.REL_MAP[k].label}</button>`).join('')}
      </div></div>`).join('')}

    <button class="btn btn-primary btn-lg" id="c-pick" style="margin-top:6px" disabled>📇 اختر من جهات الاتصال</button>
    <div class="hint">تفتح نافذة النظام، وتختار منها ما تشاء — والتطبيق لا يرى سواه.</div>`,
    b => {
      const pick = b.querySelector('#c-pick');
      b.querySelectorAll('[data-rel]').forEach(x => x.onclick = () => {
        relKey = x.dataset.rel;
        b.querySelectorAll('[data-rel]').forEach(y => y.setAttribute('aria-pressed', y === x));
        pick.disabled = false;
      });
      if (relKey) pick.disabled = false;

      pick.onclick = async () => {
        let picked;
        try {
          picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        } catch (e) {
          return failSheet('تعذّر فتح جهات الاتصال. تأكّد أنك تستخدم كروم على أندرويد وأن الصفحة مفتوحة مباشرة لا داخل إطار.');
        }
        if (!picked || !picked.length) return;      /* أُلغي الاختيار */
        openContactReview(picked, relKey);
      };
    });
}

/* مراجعة قبل الإضافة: أسماء الدفتر فيها «أبو محمد الجوال» وأرقام مكرّرة */
function openContactReview(raw, relKey) {
  const rows = raw.map((c, i) => {
    const name = (c.name && c.name[0] ? String(c.name[0]) : '').trim();
    const tel = cleanPhone(c.tel && c.tel[0]);
    const dupName = name ? S.findDuplicates(name, relKey).length > 0 : false;
    const dupPhone = tel ? S.activePeople().some(p => cleanPhone(p.phone) && cleanPhone(p.phone) === tel) : false;
    return { i, name, tel, dup: dupName || dupPhone };
  }).filter(r => r.name || r.tel);

  const fresh = rows.filter(r => !r.dup);
  const dups = rows.filter(r => r.dup);
  const picked = new Set(fresh.map(r => r.i));

  openSheet(`
    <h3>راجِع قبل الإضافة</h3>
    <p class="sheet-sub">الجميع سيُضاف بصلة <b>${esc(R.REL_MAP[relKey].label)}</b>. ألغِ تحديد من لا تريده، وعدّل الأسماء بعد الإضافة متى شئت.</p>
    ${dups.length ? `<div class="card muted" style="margin-bottom:12px">⚠️ ${esc(arPeople(dups.length))} عندك بالفعل — استُبعدوا تلقائيًا، ويمكنك تحديدهم يدويًا.</div>` : ''}
    <div class="guestbox">
      ${rows.map(r => `
        <button class="guest" type="button" data-c="${r.i}" aria-pressed="${!r.dup}">
          <span class="avatar" style="--av:${avatarColor(String(r.i) + r.name)}">${esc(initials(r.name) || '؟')}</span>
          <span class="guest-n">${esc(r.name || 'بلا اسم')}
            <span dir="ltr" style="text-align:right">${esc(r.tel || 'بلا رقم')}${r.dup ? ' · موجود عندك' : ''}</span></span>
          <span class="guest-c">✓</span></button>`).join('')}
    </div>
    <div class="hint" id="c-count" style="margin-top:11px"></div>
    <button class="btn btn-primary btn-lg" id="c-save" style="margin-top:6px"></button>`,
    b => {
      const cnt = b.querySelector('#c-count');
      const save = b.querySelector('#c-save');
      const refresh = () => {
        cnt.textContent = picked.size ? `${arPeople(picked.size)} سيُضافون` : 'لم تختر أحدًا';
        save.textContent = picked.size ? `أضِف ${arPeople(picked.size)}` : 'أضِفهم';
        save.disabled = !picked.size;
      };
      b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => {
        const i = Number(x.dataset.c);
        picked.has(i) ? picked.delete(i) : picked.add(i);
        x.setAttribute('aria-pressed', picked.has(i));
        refresh();
      });
      refresh();

      save.onclick = () => {
        let added = 0;
        rows.filter(r => picked.has(r.i)).forEach(r => {
          const name = r.name || r.tel;
          S.addPerson({ name, relation: relKey, phone: r.tel });
          added++;
        });
        haptic(); closeSheet();
        toast(`أُضيف ${arPeople(added)} من جهات اتصالك 🌿`);
        render();
      };
    });
}

/* ══════════════════════════════════════════════════
   الإضافة الجماعية
   العائق الأكبر أمام أي مستخدم جديد: بناء شجرة من ٢٥ اسمًا
   عبر نموذج يُملأ مرة لكل شخص. هنا تُختار القرابة مرة واحدة
   وتُكتب الأسماء دفعة واحدة.
   ══════════════════════════════════════════════════ */
function openBulkAddSheet(preRel) {
  let relKey = preRel || null;

  openSheet(`
    <h3>أضف عدة أقارب دفعة واحدة</h3>
    <p class="sheet-sub">اختر صلة القرابة مرة واحدة، ثم اكتب الأسماء — كل اسم في سطر.</p>

    <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:4px 0 9px">صلة القرابة *</div>
    <div id="relbox">
      ${R.REL_PICKER.map(g => `
        <div class="relgrp">
          <h4>${g.title}</h4>
          <div class="relchips">
            ${g.keys.map(k => `<button class="relchip" data-rel="${k}" aria-pressed="${relKey === k}">${R.REL_MAP[k].label}</button>`).join('')}
          </div>
        </div>`).join('')}
    </div>

    <label class="field"><span>الأسماء — اسم في كل سطر</span>
      <textarea id="b-names" style="min-height:132px;line-height:2" placeholder="فهد&#10;خالد&#10;سعود&#10;عبدالرحمن"></textarea></label>
    ${('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
      ? `<button class="btn btn-block" id="b-mic" type="button">🎤 أملِ الأسماء بصوتك</button>
         <div class="hint">قل: «فهد، خالد، سعود» — كل اسم ينزل في سطر.</div>`
      : ''}
    <div class="hint" id="b-count">لم تكتب أسماءً بعد</div>

    <label class="field" style="margin-top:13px"><span>المدينة (تُطبَّق على الجميع — اختياري)</span>
      <input id="b-city" type="text" placeholder="الرياض"></label>

    <button class="btn btn-primary btn-lg" id="b-save" style="margin-top:4px">أضِفهم</button>
  `, body => {
    const ta = body.querySelector('#b-names');
    const countEl = body.querySelector('#b-count');
    const btn = body.querySelector('#b-save');

    const names = () => ta.value.split('\n').map(s => s.trim()).filter(Boolean);
    const refresh = () => {
      const n = names().length;
      countEl.textContent = n ? `${arPeople(n)} جاهزون للإضافة` : 'لم تكتب أسماءً بعد';
      btn.textContent = n ? `أضِف ${arPeople(n)}` : 'أضِفهم';
      btn.disabled = !n || !relKey;
    };

    body.querySelectorAll('[data-rel]').forEach(b => b.onclick = () => {
      relKey = b.dataset.rel;
      body.querySelectorAll('[data-rel]').forEach(x => x.setAttribute('aria-pressed', x.dataset.rel === relKey));
      refresh();
    });
    ta.oninput = refresh;
    refresh();

    /* الإملاء الصوتي: «فهد، خالد وسعود» → ثلاثة أسطر */
    const mic = body.querySelector('#b-mic');
    if (mic) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      let rec = null;
      const stop = () => {
        if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
        mic.textContent = '🎤 أملِ الأسماء بصوتك';
        mic.classList.remove('btn-danger-solid');
      };
      mic.onclick = () => {
        if (rec) return stop();
        rec = new SR();
        rec.lang = 'ar-SA';
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = ev => {
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            if (!ev.results[i].isFinal) continue;
            const heard = ev.results[i][0].transcript;
            const parts = heard.split(/[،,]|\sو(?=\s?\S)/).map(s => s.trim()).filter(Boolean);
            if (parts.length) {
              ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + parts.join('\n');
              refresh(); haptic();
            }
          }
        };
        rec.onerror = e => {
          stop();
          toast(e.error === 'not-allowed'
            ? 'رُفض إذن اللاقط — فعّله من إعدادات المتصفح'
            : 'تعذّر الإملاء — اكتب الأسماء يدويًا');
        };
        rec.onend = stop;
        try {
          rec.start();
          mic.textContent = '⏺️ يسمعك الآن — اضغط للإيقاف';
          mic.classList.add('btn-danger-solid');
        } catch (e) { stop(); }
      };
    }

    btn.onclick = () => {
      const list = names();
      if (!relKey) return toast('اختر صلة القرابة');
      if (!list.length) return toast('اكتب اسمًا واحدًا على الأقل');
      const city = body.querySelector('#b-city').value.trim();
      let added = 0, skipped = 0;
      list.forEach(name => {
        if (S.findDuplicates(name, relKey).length) { skipped++; return; }
        S.addPerson({ name, relation: relKey, city }); added++;
      });
      haptic(); closeSheet();
      toast(skipped
        ? `أُضيف ${arPeople(added)} · تُخطّي ${skipped} مكرّرًا`
        : `أُضيف ${arPeople(added)} 🌿`);
      render();
    };
  });
}

/* ══════════════════════════════════════════════════
   ٤) إضافة / تعديل قريب
   ══════════════════════════════════════════════════ */
function openAddSheet(existing) {
  const isEdit = !!existing;
  let relKey = existing ? existing.relation : null;

  openSheet(`
    <h3>${isEdit ? 'تعديل بيانات' : 'إضافة قريب'}</h3>
    <p class="sheet-sub">الاسم وصلة القرابة يكفيان للبداية.</p>

    <label class="field"><span>الاسم *</span>
      <input id="f-name" type="text" placeholder="مثال: محمد بن عبدالله" value="${esc(existing?.name || '')}"></label>

    <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:4px 0 9px">صلة القرابة *</div>
    <div id="relbox">
      ${R.REL_PICKER.map(g => `
        <div class="relgrp">
          <h4>${g.title}</h4>
          <div class="relchips">
            ${g.keys.map(k => {
              const r = R.REL_MAP[k];
              return `<button class="relchip" data-rel="${k}" aria-pressed="${relKey === k}">${r.label}</button>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>

    <label class="field"><span>رقم الجوال</span>
      <input id="f-phone" type="tel" inputmode="tel" dir="ltr" placeholder="+9665xxxxxxxx" value="${esc(existing?.phone || '')}"></label>

    <div class="field-row">
      <label class="field"><span>المدينة</span>
        <input id="f-city" type="text" placeholder="الرياض" value="${esc(existing?.city || '')}"></label>
      <label class="field"><span>دورة الصلة</span>
        <select id="f-cad">
          ${[1, 3, 7, 14, 30, 60, 90, 180, 365].map(d => `<option value="${d}">${cadenceText(d)}</option>`).join('')}
        </select></label>
    </div>
    <div class="hint" id="cadhint">تُحدَّد تلقائيًا حسب درجة الرحم، ولك أن تُعدِّلها.</div>

    <label class="field" style="margin-top:13px"><span>ملاحظات</span>
      <textarea id="f-notes" placeholder="ما يهمّه، أخباره، ما تحب أن تسأله عنه…">${esc(existing?.notes || '')}</textarea></label>

    <button class="btn btn-primary btn-lg" id="f-save">${isEdit ? 'حفظ التعديلات' : 'إضافة القريب'}</button>
    ${isEdit ? '' : `
      <button class="btn btn-ghost btn-block" id="f-save-more" style="margin-top:9px">حفظ وإضافة آخر</button>
      <button class="btn btn-ghost btn-block" id="f-bulk" style="margin-top:9px;color:var(--green)">⚡ عندك كثير؟ أضِفهم دفعة واحدة</button>
      <button class="btn btn-ghost btn-block" id="f-contacts" style="margin-top:4px;color:var(--green)">📇 أو استورد من جهات اتصالك</button>`}
  `, body => {
    const cadSel = body.querySelector('#f-cad');
    const hint = body.querySelector('#cadhint');
    let cadTouched = isEdit;
    if (isEdit) cadSel.value = String(existing.cadence);

    function pick(k) {
      relKey = k;
      body.querySelectorAll('[data-rel]').forEach(x => x.setAttribute('aria-pressed', x.dataset.rel === k));
      const r = R.REL_MAP[k];
      if (!cadTouched && r) cadSel.value = String(r.cadence);
      if (r) hint.textContent = `${R.TIERS[r.tier].label} — ${R.TIERS[r.tier].desc}`;
    }
    body.querySelectorAll('[data-rel]').forEach(b => b.onclick = () => pick(b.dataset.rel));
    cadSel.onchange = () => { cadTouched = true; };
    if (relKey) pick(relKey);

    function collect() {
      const name = body.querySelector('#f-name').value.trim();
      if (!name) { toast('اكتب الاسم أولًا'); return null; }
      if (!relKey) { toast('اختر صلة القرابة'); return null; }
      if (!isEdit) {
        const dup = S.findDuplicates(name, relKey);
        if (dup.length) { toast(`«${dup[0].name}» موجود عندك بنفس القرابة`); return null; }
      }
      return {
        name, relation: relKey,
        phone: body.querySelector('#f-phone').value.trim(),
        city: body.querySelector('#f-city').value.trim(),
        notes: body.querySelector('#f-notes').value.trim(),
        cadence: Number(cadSel.value)
      };
    }

    body.querySelector('#f-save').onclick = () => {
      const d = collect(); if (!d) return;
      if (isEdit) { S.updatePerson(existing.id, d); toast('حُفظت التعديلات'); }
      else { S.addPerson(d); toast('أُضيف ' + d.name + ' 🌿'); }
      closeSheet();
      render();
    };
    const bulk = body.querySelector('#f-bulk');
    if (bulk) bulk.onclick = () => { closeSheet(); openBulkAddSheet(relKey); };
    const imp = body.querySelector('#f-contacts');
    if (imp) imp.onclick = () => { closeSheet(); openContactImport(relKey); };

    const more = body.querySelector('#f-save-more');
    if (more) more.onclick = () => {
      const d = collect(); if (!d) return;
      S.addPerson(d); haptic(); toast('أُضيف ' + d.name + ' — أضف التالي');
      body.querySelector('#f-name').value = '';
      body.querySelector('#f-phone').value = '';
      body.querySelector('#f-notes').value = '';
      body.querySelector('#f-name').focus();
      $('#sheet').scrollTop = 0;
    };
  });
}

/* ══════════════════════════════════════════════════
   ٥) الشجرة
   ══════════════════════════════════════════════════ */
function viewTree(v) {
  const people = S.activePeople();
  if (!people.length) {
    v.appendChild(emptyBox('🌳', 'شجرتك تنتظرك',
      'كل قريب تضيفه يظهر في مكانه الصحيح — من جهة الأب أو الأم.', 'أضف قريبًا', () => openAddSheet()));
    return;
  }

  const shareB = el('button', 'tb-btn', '🖼️ صورة');
  shareB.onclick = () => { toast('نجهّز الصورة…'); shareTreeImage().catch(() => toast('تعذّر إنشاء الصورة')); };
  $('#tb-action').appendChild(shareB);

  const legend = el('div', 'card');
  legend.innerHTML = `<div class="legend">
      <span>🟢 موصول</span><span>🟡 قارب</span><span>🔴 يحتاج صلة</span><span>⚪ جديد</span>
    </div>
    <div class="hint" style="margin-top:6px">اسحب كل صف يمينًا ويسارًا · اضغط أي اسم لفتح صفحته</div>`;
  v.appendChild(legend);

  const tree = el('div', 'tree');
  tree.style.marginTop = '14px';

  const byLevel = {};
  people.forEach(p => {
    const r = R.REL_MAP[p.relation];
    if (!r) return;
    (byLevel[r.level] = byLevel[r.level] || []).push(p);
  });

  const LEVELS = [
    { lv: -2, label: 'الأجداد والجدّات' },
    { lv: -1, label: 'الوالدان والأعمام والأخوال' },
    { lv: 0,  label: 'جيلي — الإخوة وأبناء العم والخال' },
    { lv: 1,  label: 'الأبناء وأبناء الإخوة' },
    { lv: 2,  label: 'الأحفاد' }
  ];

  LEVELS.forEach((L, idx) => {
    const isMyLevel = L.lv === 0;
    const list = (byLevel[L.lv] || []).slice()
      .sort((a, b) => (R.REL_MAP[a.relation].order) - (R.REL_MAP[b.relation].order));
    if (!list.length && !isMyLevel) return;

    const block = el('div', 'tlevel');
    block.appendChild(el('span', 'tlabel', esc(L.label)));
    const row = el('div', 'trow');

    if (isMyLevel) {
      const me = el('div', 'tnode me');
      me.innerHTML = `<div class="avatar" style="--av:var(--green)">أنا</div>
        <div class="tnode-name">${esc(S.db.settings.myName || 'أنا')}</div>
        <div class="tnode-rel">صاحب الشجرة</div>`;
      row.appendChild(me);
    }

    list.forEach(p => {
      const r = R.REL_MAP[p.relation];
      const s = S.statusOf(p);
      const meta = S.STATE_META[s.state];
      const n = el('button', 'tnode');
      n.style.setProperty('--st', meta.color);
      n.innerHTML = `<div class="tnode-av">${avatarRing(p, s, 44)}</div>
        <div class="tnode-name">${esc(p.name)}</div>
        <div class="tnode-rel">${esc(r.label)}</div>`;
      n.onclick = () => go('person', p.id);
      row.appendChild(n);
    });

    block.appendChild(row);
    tree.appendChild(block);
    if (idx < LEVELS.length - 1) tree.appendChild(el('div', 'tconn', '<i></i>'));
  });

  v.appendChild(tree);

  /* توزيع الجهات */
  const counts = { father: 0, mother: 0, self: 0, other: 0 };
  people.forEach(p => { const r = R.REL_MAP[p.relation]; if (r) counts[r.side]++; });
  const total = people.length || 1;
  const dist = el('div', 'card');
  dist.style.marginTop = '10px';
  dist.innerHTML = `<div class="section-title" style="margin-bottom:9px">توزيع أرحامك</div>
    <div class="bar">
      ${Object.entries(counts).map(([k, n]) =>
        n ? `<i style="width:${(n / total * 100).toFixed(1)}%;background:${R.SIDES[k].color}"></i>` : '').join('')}
    </div>
    <div class="legend">
      ${Object.entries(counts).map(([k, n]) =>
        `<span><b style="color:${R.SIDES[k].color}">●</b> ${R.SIDES[k].label}: ${n}</span>`).join('')}
    </div>`;
  v.appendChild(dist);
}

/* ── صورة الشجرة ──────────────────────────────────
   لقروب العائلة: أسماء وقرابات فقط — لا حالات صلة، فتلك خاصة بك. */
async function shareTreeImage() {
  const people = S.activePeople();
  if (!people.length) return toast('أضف أرحامك أولًا');
  await document.fonts.ready;

  const LEVELS = [
    { lv: -2, label: 'الأجداد والجدّات' },
    { lv: -1, label: 'الوالدان والأعمام والأخوال' },
    { lv: 0,  label: 'الإخوة وأبناء العمومة', me: true },
    { lv: 1,  label: 'الأبناء وأبناء الإخوة' },
    { lv: 2,  label: 'الأحفاد' }
  ];
  const byLevel = {};
  people.forEach(p => {
    const r = R.REL_MAP[p.relation]; if (!r) return;
    (byLevel[r.level] = byLevel[r.level] || []).push(p);
  });

  const W = 1080, PAD = 60, CHIP_H = 84, CHIP_GAP = 18, ROW_GAP = 46, LABEL_H = 56;
  const ctx0 = document.createElement('canvas').getContext('2d');
  const font = (w, s) => `${w} ${s}px Cairo, sans-serif`;

  /* قِس أولًا لتُحسب الأسطر والارتفاع */
  const rows = [];
  LEVELS.forEach(L => {
    const list = (byLevel[L.lv] || []).slice()
      .sort((a, b) => R.REL_MAP[a.relation].order - R.REL_MAP[b.relation].order);
    const chips = [];
    if (L.me) chips.push({ name: S.db.settings.myName || 'أنا', rel: '★', me: true });
    list.forEach(p => chips.push({ name: p.name, rel: R.REL_MAP[p.relation].label }));
    if (!chips.length) return;
    ctx0.font = font(700, 30);
    chips.forEach(c => c.w = Math.min(430, Math.max(150,
      Math.max(ctx0.measureText(c.name).width, ctx0.measureText(c.rel).width * .8) + 56)));
    /* لفّ الرقائق في أسطر */
    const lines = [[]]; let x = 0;
    chips.forEach(c => {
      if (x + c.w > W - PAD * 2 && lines[lines.length - 1].length) { lines.push([]); x = 0; }
      lines[lines.length - 1].push(c); x += c.w + CHIP_GAP;
    });
    rows.push({ label: L.label, lines });
  });

  const HEAD = 190, FOOT = 110;
  const bodyH = rows.reduce((a, r) =>
    a + LABEL_H + r.lines.length * (CHIP_H + CHIP_GAP) + ROW_GAP, 0);
  const H = HEAD + bodyH + FOOT;

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');

  /* الأرضية */
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0e7a5f'); bg.addColorStop(1, '#083e31');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  /* الترويسة */
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.direction = 'rtl';
  g.font = font(800, 56);
  g.fillText(`شجرة أرحام ${S.db.settings.myName || 'عائلتنا'}`, W / 2, 92);
  g.fillStyle = '#f5c76a'; g.font = font(600, 30);
  g.fillText('«مَنْ وَصَلَنِي وَصَلَهُ اللَّهُ»', W / 2, 148);

  /* الصفوف */
  let y = HEAD;
  rows.forEach(row => {
    g.fillStyle = 'rgba(255,255,255,.65)'; g.font = font(700, 26);
    g.textAlign = 'right';
    g.fillText(row.label, W - PAD, y + 30);
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2;
    const tw = g.measureText(row.label).width;
    g.beginPath(); g.moveTo(PAD, y + 22); g.lineTo(W - PAD - tw - 22, y + 22); g.stroke();
    y += LABEL_H;

    row.lines.forEach(line => {
      const total = line.reduce((a, c) => a + c.w, 0) + (line.length - 1) * CHIP_GAP;
      let x = W - (W - total) / 2;          /* ابدأ من اليمين — RTL */
      line.forEach(c => {
        const cx = x - c.w;
        g.fillStyle = c.me ? '#f5c76a' : 'rgba(255,255,255,.13)';
        g.beginPath();
        g.roundRect(cx, y, c.w, CHIP_H, 20);
        g.fill();
        g.textAlign = 'center';
        g.fillStyle = c.me ? '#1d2b17' : '#ffffff';
        g.font = font(700, 30);
        g.fillText(c.name, cx + c.w / 2, y + 38, c.w - 24);
        g.fillStyle = c.me ? 'rgba(29,43,23,.75)' : 'rgba(255,255,255,.62)';
        g.font = font(600, 22);
        g.fillText(c.rel, cx + c.w / 2, y + 68, c.w - 24);
        x -= c.w + CHIP_GAP;
      });
      y += CHIP_H + CHIP_GAP;
    });
    y += ROW_GAP;
  });

  /* التذييل */
  g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = font(600, 24);
  g.fillText(`${arPeople(people.length)} · تطبيق صِلة`, W / 2, H - 46);

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  const file = new File([blob], 'شجرة-الأرحام.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'شجرة أرحامنا' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'شجرة-الأرحام.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('نُزِّلت صورة الشجرة 🌳');
}

/* ══════════════════════════════════════════════════
   ٦) المزيد
   ══════════════════════════════════════════════════ */
function viewMore(v) {
  const st = S.monthStats();

  const me = el('div', 'card');
  me.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
      <div class="avatar" style="--av:var(--green);width:52px;height:52px">${esc(initials(S.db.settings.myName || 'أنا'))}</div>
      <div class="pc-main">
        <div class="pc-name">${esc(S.db.settings.myName || 'صاحب الشجرة')}</div>
        <div class="pc-rel">${st.peopleCount} من الأرحام · ${esc(arSilat(st.total))} هذا الشهر</div>
      </div>
      <button class="btn btn-ghost" data-editname>✏️</button>
    </div>`;
  me.querySelector('[data-editname]').onclick = () => openSheet(`
    <h3>اسمك</h3>
    <p class="sheet-sub">يظهر في التحية وفي وسط شجرتك.</p>
    <label class="field"><span>الاسم</span>
      <input id="n-name" type="text" autocomplete="name" value="${esc(S.db.settings.myName || '')}" placeholder="مثال: عبدالله"></label>
    <button class="btn btn-primary btn-lg" id="n-save">حفظ</button>`,
    b => {
      const inp = b.querySelector('#n-name');
      const save = () => {
        S.db.settings.myName = inp.value.trim(); S.save();
        closeSheet(); toast('حُفظ الاسم'); render();
      };
      b.querySelector('#n-save').onclick = save;
      inp.onkeydown = e => { if (e.key === 'Enter') save(); };
    });
  v.appendChild(me);

  const up = S.upcomingGatherings();
  const season = S.activeSeason();
  const items = [
    ['🌙', 'وضع رمضان والعيد', season ? `نشط الآن: ${season.label}` : 'يُفعَّل تلقائيًا في موعده', 'seasonSheet'],
    ['🔔', 'التذكير اليومي', (() => {
      const n = S.db.settings.notify;
      return n && n.enabled ? 'مُفعَّل — يوميًا عند ' + hourLabel(n.hour) : 'مُطفأ — فعّله ليذكّرك';
    })(), 'notifySheet'],
    ['🔤', 'خط التطبيق', (fontList().find(f => f.k === (S.db.settings.font || 'plex')) || FONTS[0]).label, 'fontSheet'],
    ['🌳', 'شارك شجرتك مع العائلة', 'ملفٌ يستورده قريبك فيبدأ بشجرة جاهزة', 'treeShare'],
    ['🤝', 'نيّة الصلح', (() => {
      const n = S.riftPeople().length;
      if (!n) return 'لمن بينك وبينه جفوة';
      if (n === 1) return 'تنوي صلح قريب واحد';
      if (n === 2) return 'تنوي صلح قريبين';
      return `تنوي صلح ${arPeople(n)}`;
    })(), 'rift'],
    ['🫂', 'لقاءات العائلة', up.length ? `القادمة: ${up[0].title} — ${countdown(S.daysUntil(up[0].date))}` : 'رتّب لمّة وادعُ أرحامك', 'meets'],
    ['📖', 'آيات وأحاديث صلة الرحم', `${T.VERSES.length} آية و${T.HADITHS.length} حديثًا من الصحيحين`, 'texts'],
    ['📊', 'سجل الصلة والإحصاءات', 'كم وصلت هذا الشهر ومن تحتاج أن تصله', 'stats'],
    ['🎉', 'المناسبات القادمة', 'مواليد وأعراس وذكريات', 'occ'],
    ['💾', 'نسخة احتياطية', 'تصدير واستيراد بياناتك كملف', 'backup']
  ];
  const box = el('div');
  box.style.marginTop = '12px';
  items.forEach(([e, t, s, r]) => {
    const b = el('button', 'rowlink', `<span class="e">${e}</span>
      <span class="t">${esc(t)}<span class="s">${esc(s)}</span></span><span class="pc-go">‹</span>`);
    b.onclick = () => r === 'seasonSheet' ? openSeasonSheet()
                    : r === 'fontSheet'   ? openFontSheet()
                    : r === 'notifySheet' ? openNotifySheet()
                    : r === 'treeShare'   ? openTreeShareSheet()
                    : go(r);
    box.appendChild(b);
  });
  v.appendChild(box);

  const about = el('div', 'card');
  about.style.marginTop = '16px';
  about.innerHTML = `
    <div class="section-title" style="margin-bottom:7px">عن «صِلة»</div>
    <p class="muted">منصة تُعينك على معرفة أرحامك وصِلتهم. بياناتك محفوظة على جهازك فقط — لا تُرسَل إلى أي خادم، ولا تحتاج حسابًا.</p>
    <p class="muted" style="margin-top:8px">النصوص الشرعية: الآيات من المصحف، والأحاديث من صحيحي البخاري ومسلم مع أرقامها.</p>
    <p class="muted" style="margin-top:8px">📱 لتثبيتها كتطبيق: من متصفح الجوال اختر «إضافة إلى الشاشة الرئيسية».</p>`;
  v.appendChild(about);

  const wipe = el('button', 'btn btn-danger btn-block', '⚠️ مسح كل البيانات');
  wipe.style.marginTop = '14px';
  wipe.onclick = () => confirmSheet({
    title: 'مسح كل البيانات؟',
    body: `سيُحذف <b>${esc(arPeople(st.peopleCount))}</b> و<b>${esc(arLogs(S.db.events.length))}</b> للصلة و<b>${esc(arMeets(S.db.gatherings.length))}</b> — نهائيًا وبلا رجعة.<br><br>
           إن لم تكن صدّرت نسخة احتياطية، أغلق هذه النافذة وصدّرها أولًا.`,
    confirm: '⚠️ امسح كل شيء',
    cancel: 'لا، ارجع',
    danger: true,
    onConfirm: () => { S.wipe(); toast('مُسحت البيانات'); boot(); }
  });
  v.appendChild(wipe);
}

/* ══ التذكير اليومي ═════════════════════════════════ */
const HOURS = [7, 9, 12, 16, 18, 20, 22];
/* أرقام غربية في كل الواجهة — الخلط مع الهندية يبدو كخلل */
const hourLabel = h => h === 12 ? '12 ظهرًا'
  : h < 12 ? `${h} صباحًا`
  : `${h - 12} مساءً`;

async function openNotifySheet() {
  const N = window.NOTIFY;
  const cap = await N.capability();
  const n = N.settings();
  const on = n.enabled && cap.permission === 'granted';

  /* لا نعد بما لا يتحقق: الجدولة في الخلفية تحتاج تثبيتًا ودعمًا */
  const bg = cap.periodic && cap.installed;
  const reality = !cap.supported
    ? { icon: '⚠️', text: 'متصفحك لا يدعم الإشعارات. جرّب كروم أو سفاري حديثًا.' }
    : bg
      ? { icon: '✅', text: 'يصلك التذكير حتى والتطبيق مغلق.' }
      : cap.installed
        ? { icon: 'ℹ️', text: 'جهازك لا يجدول الإشعارات في الخلفية — يصلك التذكير أول ما تفتح التطبيق بعد الموعد.' }
        : { icon: '📲', text: 'ثبّت التطبيق على شاشتك الرئيسية ليصلك التذكير والتطبيق مغلق. بدونه يظهر عند الفتح فقط.' };

  openSheet(`
    <h3>التذكير اليومي</h3>
    <p class="sheet-sub">إشعار واحد في اليوم بمن يستحق صلتك — ومناسبات أرحامك ولمّاتهم.</p>

    <button class="rowlink${on ? ' on' : ''}" id="n-toggle" style="margin-bottom:14px">
      <span class="e">🔔</span>
      <span class="t">${on ? 'التذكير مُفعَّل' : 'فعّل التذكير'}
        <span class="s">${on ? 'يوميًا عند ' + esc(hourLabel(n.hour)) : 'يطلب إذن الإشعارات مرة واحدة'}</span></span>
      <span class="switch" aria-checked="${on}"></span>
    </button>

    <div id="n-body" ${on ? '' : 'hidden'}>
      <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:4px 0 9px">وقت التذكير</div>
      <div class="relchips" style="margin-bottom:15px">
        ${HOURS.map(h => `<button class="relchip" data-h="${h}" aria-pressed="${n.hour === h}">${hourLabel(h)}</button>`).join('')}
      </div>
      <button class="btn btn-block" id="n-test">🔔 جرّب الإشعار الآن</button>
    </div>

    <div class="card muted" style="margin-top:14px">${reality.icon} ${esc(reality.text)}</div>
    ${cap.permission === 'denied' ? `<div class="card" style="margin-top:10px;border-color:var(--cold)">
      <p class="muted">🚫 <b style="color:var(--ink)">الإشعارات محجوبة</b> لهذا الموقع من إعدادات متصفحك. افتح إعدادات الموقع واسمح بالإشعارات، ثم ارجع هنا.</p></div>` : ''}
  `, b => {
    const bodyEl = b.querySelector('#n-body');

    b.querySelector('#n-toggle').onclick = async () => {
      if (N.settings().enabled) {
        await N.disable(); toast('أُوقف التذكير'); closeSheet(); render(); return;
      }
      const res = await N.enable();
      if (res === 'granted') { haptic(); toast('فُعّل التذكير 🔔'); closeSheet(); openNotifySheet(); render(); }
      else if (res === 'denied') { toast('رُفض الإذن — فعّله من إعدادات المتصفح'); closeSheet(); openNotifySheet(); }
      else toast('متصفحك لا يدعم الإشعارات');
    };

    b.querySelectorAll('[data-h]').forEach(x => x.onclick = () => {
      N.settings().hour = Number(x.dataset.h);
      N.settings().lastShown = null;      /* الموعد الجديد يستحق تذكيرًا اليوم */
      S.save();
      b.querySelectorAll('[data-h]').forEach(y => y.setAttribute('aria-pressed', y === x));
      b.querySelector('#n-toggle .s').textContent = 'يوميًا عند ' + hourLabel(Number(x.dataset.h));
      haptic();
    });

    const t = b.querySelector('#n-test');
    if (t) t.onclick = async () => {
      const r = await N.test();
      if (r === 'granted') toast('أُرسل الإشعار — تحقّق من شاشتك');
      else toast('لم يُسمح بالإشعارات بعد');
    };
    if (bodyEl && !on) bodyEl.hidden = true;
  });
}

/* ══ اختيار الخط ════════════════════════════════════
   الخطوط الثلاثة مُعلَنة في CSS، ولا ينزّل المتصفح إلا المستعمَل. */
const FONTS = [
  { k: 'plex',    label: 'بلِكس',    note: 'مرسوم لواجهات الشاشات — الأوضح في المقاسات الصغيرة' },
  { k: 'cairo',   label: 'القاهرة',  note: 'الأكثر استخدامًا في المواقع العربية' },
  { k: 'tajawal', label: 'تجوّال',   note: 'مستدير وودود، والأخفّ تحميلًا' },
  { k: 'system',  label: 'خط جهازك', note: 'بلا أي تحميل — الأسرع' }
];

/* خط محلي يُضيفه font-local.js عند التشغيل على الجهاز (ثمانية) */
const fontList = () => window.SILAH_LOCAL_FONT
  ? [{ k: window.SILAH_LOCAL_FONT.key, label: window.SILAH_LOCAL_FONT.label, note: window.SILAH_LOCAL_FONT.note }, ...FONTS]
  : FONTS;

const CSS_FAMILY = { plex: 'Plex', cairo: 'Cairo', tajawal: 'Tajawal', thmanyah: 'Thmanyah', system: 'system-ui' };

function applyFont() {
  const list = fontList();
  let f = S.db.settings.font || 'plex';
  if (!list.some(x => x.k === f)) f = 'plex';   /* اختير ثمانية ثم فُتح على نطاق عام */
  const root = document.documentElement;
  if (f === 'plex') root.removeAttribute('data-font');
  else root.setAttribute('data-font', f);
}

function openFontSheet() {
  const list = fontList();
  const cur = list.some(f => f.k === S.db.settings.font) ? S.db.settings.font : 'plex';
  openSheet(`
    <h3>خط التطبيق</h3>
    <p class="sheet-sub">اضغط أيًّا منها لترى الفرق فورًا. النص الشرعي يبقى بخط النسخ في كل الأحوال.</p>
    <div class="optlist">
      ${list.map(f => `
        <button class="opt${cur === f.k ? ' picked' : ''}" data-f="${f.k}">
          <span class="opt-t" style="font-family:${CSS_FAMILY[f.k] || 'system-ui'}">
            ${esc(f.label)} — صِلة الأرحام
            <span style="font-family:var(--font)">${esc(f.note)}</span></span>
          <span class="opt-tick">${cur === f.k ? '✓' : ''}</span>
        </button>`).join('')}
    </div>
    <div class="hint" style="margin-top:12px">التغيير يُحفظ على جهازك، ولا يؤثّر على غيرك.</div>`,
    b => {
      b.querySelectorAll('[data-f]').forEach(x => x.onclick = () => {
        S.db.settings.font = x.dataset.f; S.save();
        applyFont(); haptic();
        b.querySelectorAll('[data-f]').forEach(y => {
          y.classList.toggle('picked', y === x);
          y.querySelector('.opt-tick').textContent = y === x ? '✓' : '';
        });
      });
    });
}

/* ══ مشاركة الشجرة مع العائلة ═══════════════════════ */
async function shareTreeFile(withPhones) {
  const data = S.exportTreeShare(withPhones);
  const json = JSON.stringify(data, null, 2);
  const fname = `شجرة-${(S.db.settings.myName || 'صلة').replace(/\s+/g, '-')}.json`;
  const file = new File([json], fname, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'شجرة أرحامنا',
        text: 'شجرة العائلة من تطبيق صِلة — افتح التطبيق ثم: المزيد ← نسخة احتياطية ← استيراد.'
      });
      return;
    } catch (e) { if (e.name === 'AbortError') return; }
  }
  /* لا مشاركة ملفات؟ نزّله ليُرسَل يدويًا */
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = fname; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('نُزِّل الملف — أرسله لأهلك في الواتساب');
}

function openTreeShareSheet() {
  const n = S.activePeople().length;
  if (!n) return toast('أضف أرحامك أولًا');
  openSheet(`
    <h3>شارك شجرتك مع العائلة</h3>
    <p class="sheet-sub">يستلم قريبك ملفًا يستورده فيبدأ بشجرة جاهزة من ${esc(arPeople(n))} — بدل أن يبنيها من الصفر.</p>

    <div class="card" style="margin-bottom:13px">
      <div class="section-title" style="margin-bottom:7px">ما الذي يخرج من جهازك؟</div>
      <p class="muted">✅ الأسماء وصلات القرابة والمدن فقط.<br>
      🔒 سجل صلتك وملاحظاتك ونيّة الصلح <b style="color:var(--ink)">لا تُغادر جهازك أبدًا</b>.</p>
    </div>

    <button class="rowlink" id="ts-phones" style="margin-bottom:14px">
      <span class="e">📞</span>
      <span class="t">أرفق أرقام الجوال
        <span class="s">ينفع أهلك — ولا تفعل إن كان فيهم من لا يحب نشر رقمه</span></span>
      <span class="switch" aria-checked="false"></span>
    </button>

    <button class="btn btn-primary btn-lg" id="ts-share">📤 أرسل الشجرة</button>`,
    b => {
      let phones = false;
      const sw = b.querySelector('#ts-phones .switch');
      b.querySelector('#ts-phones').onclick = () => {
        phones = !phones; sw.setAttribute('aria-checked', phones); haptic();
      };
      b.querySelector('#ts-share').onclick = () => { closeSheet(); shareTreeFile(phones); };
    });
}

/* ── إعدادات الموسم ───────────────────────────────── */
function openSeasonSheet() {
  const SE = window.SEASON;
  const h = SE.hijri(new Date(), S.db.settings.hijriOffset || 0);
  const auto = SE.detectSeason(S.db.settings.hijriOffset || 0);
  const mode = S.db.settings.seasonMode || 'auto';

  const modes = [
    ['auto', '🕌 تلقائي', auto ? `يكتشفه من التقويم — الآن: ${auto.label}` : 'يكتشفه من التقويم — لا موسم حاليًا'],
    ['ramadan', '🌙 رمضان', 'هدف يومي وعزائم إفطار'],
    ['ramadan_last10', '✨ العشر الأواخر', 'الهدف يرتفع إلى خمسة'],
    ['eid_fitr', '🎉 عيد الفطر', 'قائمة المعايدة'],
    ['ashr', '🕋 عشر ذي الحجة', 'هدف يومي وقائمة الحجّاج'],
    ['arafah', '🤍 يوم عرفة', 'هدف الدعاء وقائمة الحجّاج'],
    ['eid_adha', '🎉 عيد الأضحى', 'المعايدة وتهنئة العائدين'],
    ['off', '⚪ معطّل', 'لا تُظهر أوضاع المواسم إطلاقًا']
  ];

  openSheet(`
    <h3>وضع رمضان والعيد</h3>
    <p class="sheet-sub">${h ? `اليوم <b>${h.day} ${esc(SE.HIJRI_MONTHS[h.month - 1])} ${h.year}هـ</b>` : 'متصفحك لا يدعم التقويم الهجري'}</p>
    <div class="optlist">
      ${modes.map(([k, label, desc]) => `
        <button class="opt${mode === k ? ' picked' : ''}" data-m="${k}">
          <span class="opt-t">${esc(label)}<span>${esc(desc)}</span></span>
          <span class="opt-tick">${mode === k ? '✓' : ''}</span>
        </button>`).join('')}
    </div>
    <div class="field" style="margin-top:16px">
      <span>تعديل التاريخ الهجري</span>
      <div class="stepper">
        <button class="step" data-off="-1">−</button>
        <b id="off-v">${S.db.settings.hijriOffset > 0 ? '+' : ''}${S.db.settings.hijriOffset || 0}</b>
        <button class="step" data-off="1">+</button>
      </div>
      <div class="hint">تقويم أم القرى قد يسبق الرؤية المحلية أو يتأخّر يومًا. عدّله ليطابق بلدك.</div>
    </div>`,
    b => {
      b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => {
        S.db.settings.seasonMode = x.dataset.m; S.save();
        closeSheet(); applySeasonTheme(); toast('حُدّث وضع الموسم'); render();
      });
      b.querySelectorAll('[data-off]').forEach(x => x.onclick = () => {
        const n = Math.max(-3, Math.min(3, (S.db.settings.hijriOffset || 0) + Number(x.dataset.off)));
        S.db.settings.hijriOffset = n; S.save();
        b.querySelector('#off-v').textContent = (n > 0 ? '+' : '') + n;
        applySeasonTheme();
      });
    });
}

/* ══════════════════════════════════════════════════
   ٧) النصوص
   ══════════════════════════════════════════════════ */
let textTab = 'hadith';
let textTag = null;   /* موضوع مُصفّى — يُصفَّر عند تبديل التبويب */

function viewTexts(v) {
  const tabs = el('div', 'texttabs');
  [['hadith', `أحاديث (${T.HADITHS.length})`], ['verse', `آيات (${T.VERSES.length})`], ['dua', `أدعية (${T.DUAS.length})`]]
    .forEach(([k, l]) => {
      const b = el('button', 'fchip', l);
      b.setAttribute('aria-pressed', textTab === k);
      b.onclick = () => { textTab = k; textTag = null; render(); };
      tabs.appendChild(b);
    });
  v.appendChild(tabs);

  const note = el('div', 'card');
  note.style.marginBottom = '12px';
  note.innerHTML = `<p class="muted">🛡️ سياسة التوثيق: الأحاديث المعروضة من <b>صحيح البخاري وصحيح مسلم</b> فقط، مع رقم الحديث والراوي. لا يُعرض هنا حديث ضعيف.</p>`;
  v.appendChild(note);

  /* فهرس الموضوعات: الوسوم كانت مطبوعة على البطاقات بلا نفع — الآن تُصفّي */
  const list = textTab === 'hadith' ? T.HADITHS : textTab === 'verse' ? T.VERSES : T.DUAS;
  const tagOf = x => textTab === 'dua' ? x.for : x.tag;
  const tags = [...new Set(list.map(tagOf).filter(Boolean))];
  if (tags.length > 1) {
    const fl = el('div', 'filters');
    [['', 'الكل'], ...tags.map(t => [t, t])].forEach(([val, label]) => {
      const b = el('button', 'fchip', esc(label));
      b.setAttribute('aria-pressed', (textTag || '') === val);
      b.onclick = () => { textTag = val || null; render(); };
      fl.appendChild(b);
    });
    v.appendChild(fl);
  }
  const shown = textTag ? list.filter(x => tagOf(x) === textTag) : list;

  if (textTab === 'hadith') {
    shown.forEach(h => {
      const c = el('div', 'tcard');
      c.innerHTML = `<div class="body">${esc(h.text)}</div>
        <div class="foot">
          <span class="badge g">${esc(h.grade)}</span>
          <span>${esc(h.source)}</span>
          <span>· عن ${esc(h.narrator)}</span>
          ${h.tag ? `<span class="badge o">${esc(h.tag)}</span>` : ''}
        </div>`;
      c.appendChild(shareBtn(`${h.text}\n\n— ${h.source}`));
      v.appendChild(c);
    });
  } else if (textTab === 'verse') {
    shown.forEach(x => {
      const c = el('div', 'tcard');
      c.innerHTML = `<div class="body q">${esc(x.text)}</div>
        <div class="foot"><span class="badge g">${esc(x.ref)}</span>${x.tag ? `<span class="badge o">${esc(x.tag)}</span>` : ''}</div>`;
      c.appendChild(shareBtn(`${x.text}\n\n— ${x.ref}`));
      v.appendChild(c);
    });
  } else {
    shown.forEach(x => {
      const c = el('div', 'tcard');
      c.innerHTML = `<div class="body q">${esc(x.text)}</div>
        <div class="foot"><span class="badge g">${esc(x.ref)}</span><span class="badge o">${esc(x.for)}</span></div>`;
      c.appendChild(shareBtn(`${x.text}\n\n— ${x.ref}`));
      v.appendChild(c);
    });
  }
}

function shareBtn(text) {
  const b = el('button', 'btn btn-ghost btn-block', '📤 مشاركة');
  b.style.marginTop = '10px';
  b.onclick = async () => {
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast('نُسخ النص'); }
    } catch (e) { /* أُلغيت المشاركة */ }
  };
  return b;
}

/* ══════════════════════════════════════════════════
   ٨) الإحصاءات
   ══════════════════════════════════════════════════ */
function viewStats(v) {
  const st = S.monthStats();
  const people = S.activePeople();

  const g = el('div', 'grid2');
  g.innerHTML = `
    <div class="stat"><b>${st.total}</b><span>صلة هذا الشهر</span></div>
    <div class="stat"><b>${st.reached}</b><span>قريبًا وصلتَه</span></div>
    <div class="stat"><b>${st.peopleCount}</b><span>في شجرتك</span></div>
    <div class="stat"><b>${S.streakDays()}</b><span>أيام متتالية</span></div>`;
  v.appendChild(g);

  const kinds = el('div', 'card');
  kinds.style.marginTop = '12px';
  kinds.innerHTML = `<div class="section-title" style="margin-bottom:10px">أنواع الصلة هذا الشهر</div>
    ${R.ACTIONS.map(a => {
      const n = st.byType[a.key] || 0;
      const max = Math.max(1, ...Object.values(st.byType));
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="width:78px;font-size:13px;font-weight:700">${a.icon} ${a.label}</span>
        <div class="bar" style="flex:1"><i style="width:${(n / max * 100).toFixed(0)}%;background:var(--green)"></i></div>
        <b style="width:26px;text-align:left;font-size:14px">${n}</b></div>`;
    }).join('')}`;
  v.appendChild(kinds);

  const total = people.length || 1;
  const health = el('div', 'card');
  health.style.marginTop = '12px';
  health.innerHTML = `<div class="section-title" style="margin-bottom:9px">حالة أرحامك</div>
    <div class="bar">
      ${['warm', 'due', 'cold', 'new'].map(k =>
        st.counts[k] ? `<i style="width:${(st.counts[k] / total * 100).toFixed(1)}%;background:${S.STATE_META[k].color}"></i>` : '').join('')}
    </div>
    <div class="legend">
      ${['warm', 'due', 'cold', 'new'].map(k =>
        `<span>${S.STATE_META[k].dot} ${S.STATE_META[k].text}: <b>${st.counts[k]}</b></span>`).join('')}
    </div>`;
  v.appendChild(health);

  /* المسارات الخاصة: يفسّران «المنقطعين» بدل أن يتضخّم الرقم بصمت */
  const rifts = S.riftPeople().length;
  const snoozed = people.filter(p => S.isSnoozed(p)).length;
  if (rifts || snoozed) {
    const sp = el('div', 'card');
    sp.style.marginTop = '12px';
    sp.innerHTML = `<div class="section-title" style="margin-bottom:8px">خارج الإلحاح اليومي</div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        ${rifts ? `<button class="badge" style="background:#4a7ea31a;color:#4a7ea3;border:none;padding:7px 13px;font-size:12.5px" data-go-rift>🤝 ${esc(arPeople(rifts))} في نيّة الصلح</button>` : ''}
        ${snoozed ? `<span class="badge o" style="padding:7px 13px;font-size:12.5px">⏱ ${esc(arPeople(snoozed))} مؤجَّلون</span>` : ''}
      </div>`;
    const gr = sp.querySelector('[data-go-rift]');
    if (gr) gr.onclick = () => go('rift');
    v.appendChild(sp);
  }

  /* من لم تصله أبدًا — المؤجَّل استُثني بقرارك فلا يُعاد عرضه هنا */
  const never = people.filter(p => !S.lastContact(p.id) && !S.isSnoozed(p) && !S.hasRift(p));
  if (never.length) {
    const sec = el('div', 'section');
    sec.style.marginTop = '18px';
    sec.appendChild(el('div', 'section-head',
      `<span class="section-title">لم تُسجَّل معهم صلة بعد</span><span class="muted">${never.length}</span>`));
    never.forEach(p => sec.appendChild(personCard(p, S.statusOf(p))));
    v.appendChild(sec);
  }

  const note = el('div', 'card muted');
  note.style.marginTop = '14px';
  note.innerHTML = '💡 هذه الأرقام لك وحدك — لا تُنشر ولا تُشارَك. اجعلها عونًا على الخير لا مباهاة.';
  v.appendChild(note);
}

/* ══════════════════════════════════════════════════
   نيّة الصلح
   لا مؤشر أحمر ولا إلحاح: صاحب الجفوة يعلم قطيعته، وما ينقصه
   تذكيرٌ بل خطوةٌ صغيرة يقدر عليها. النبرة هنا مختلفة عمدًا.
   ══════════════════════════════════════════════════ */

/* بطاقة أسبوعية واحدة في شاشة اليوم — واحدٌ فقط، ولا تتكرّر قبل أسبوع */
function riftCard(p) {
  const r = p.rift;
  const next = S.RIFT_STEPS.find(s => !r.marks[s.i]) || null;
  const sec = el('div', 'section');
  const c = el('div', 'rift-card');
  c.innerHTML = `
    <div class="rift-badge">🤝 نيّة الصلح</div>
    <h3 class="rift-title">${esc(p.name)}</h3>
    <p class="rift-verse">«لَيْسَ الْوَاصِلُ بِالْمُكَافِئِ، وَلَكِنِ الْوَاصِلُ الَّذِي إِذَا قُطِعَتْ رَحِمُهُ وَصَلَهَا»</p>
    <div class="rift-src">البخاري ٥٩٩١</div>
    ${next ? `<div class="rift-next">خطوتك التالية — ${next.icon} ${esc(next.label)}<span>${esc(next.hint)}</span></div>`
           : '<div class="rift-next">بلغتَ آخر الخطوات. أسأل الله أن يجمع قلبيكما.</div>'}
    <div class="rift-actions">
      ${next ? `<button class="btn btn-rift" data-do>${next.icon} ${esc(next.label)}</button>` : ''}
      <button class="btn btn-rift-ghost" data-open>الخطوات كلها</button>
    </div>`;
  const d = c.querySelector('[data-do]');
  if (d) d.onclick = () => {
    S.markRiftStep(p.id, next.i); haptic();
    toast(next.i === 1 ? 'تقبّل الله دعاءك 🤲' : 'بارك الله فيك — بدأتَ');
    render();
  };
  c.querySelector('[data-open]').onclick = () => go('rift');
  S.markNudged(p.id);
  sec.appendChild(c);
  return sec;
}

function viewRift(v) {
  const list = S.riftPeople();

  const intro = el('div', 'card');
  intro.innerHTML = `
    <p class="rift-verse" style="color:var(--ink)">جاء رجلٌ فقال: يا رسول الله، إنَّ لي قَرابةً أَصِلُهُم ويَقطَعوني… فقال ﷺ: «لَئِنْ كُنْتَ كَمَا قُلْتَ… وَلَا يَزَالُ مَعَكَ مِنَ اللَّهِ ظَهِيرٌ عَلَيْهِمْ مَا دُمْتَ عَلَى ذَلِكَ»</p>
    <div class="rift-src" style="color:var(--ink-3)">مسلم ٢٥٥٨</div>
    <p class="muted" style="margin-top:11px">من تضعه هنا يُرفَع من قائمة «مَن يستحق صلتك اليوم» — فالجفوة ليست نسيانًا يُذكَّر به. ويُذكَّرك التطبيق بخطوة واحدة كل أسبوع، لا كل يوم.</p>`;
  v.appendChild(intro);

  if (!list.length) {
    const e = emptyBox('🤝', 'لا أحد هنا — والحمد لله',
      'إن كان بينك وبين رحمٍ جفوة، ضعه هنا. لا أحد يرى هذا غيرك، وأول خطوة دعوةٌ في ظهر الغيب.',
      'اختر مَن أنوي صلحه', () => openRiftPicker());
    v.appendChild(e);
    return;
  }

  list.forEach(p => {
    const r = p.rift;
    const done = S.RIFT_STEPS.filter(s => r.marks[s.i]).length;
    const days = Math.floor((Date.now() - new Date(r.since)) / 86400000);
    const sec = el('div', 'section');
    const card = el('div', 'card rift-person');
    card.innerHTML = `
      <div class="rift-head">
        <div class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</div>
        <div class="pc-main">
          <div class="pc-name">${esc(p.name)}</div>
          <div class="pc-rel">${esc(R.REL_MAP[p.relation]?.label || '')} · نويتَ صلحه ${esc(agoText(days))}</div>
        </div>
        <span class="rift-count">${done}/${S.RIFT_STEPS.length}</span>
      </div>
      ${r.note ? `<div class="rift-note">${esc(r.note)}</div>` : ''}
      <div class="rift-steps">
        ${S.RIFT_STEPS.map(s => {
          const at = r.marks[s.i];
          return `<button class="rstep${at ? ' done' : ''}" data-s="${s.i}" data-p="${p.id}">
            <span class="rstep-i">${at ? '✓' : s.icon}</span>
            <span class="rstep-t">${esc(s.label)}<span>${at
              ? esc(new Date(at).getDate() + ' ' + AR_MONTHS[new Date(at).getMonth()])
              : esc(s.hint)}</span></span>
          </button>`;
        }).join('')}
      </div>
      <div class="rift-foot">
        <button class="btn btn-primary" data-resolve="${p.id}">🤍 عادت الصلة بحمد الله</button>
        <button class="btn btn-ghost" data-edit="${p.id}">✏️</button>
      </div>`;

    card.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.s);
      if (r.marks[i]) return;                       /* المُنجَز لا يُلغى بلمسة عابرة */
      S.markRiftStep(p.id, i); haptic();
      toast(i === 1 ? 'تقبّل الله دعاءك 🤲' : 'بارك الله فيك');
      render();
    });
    card.querySelector('[data-resolve]').onclick = () => confirmSheet({
      title: 'عادت الصلة؟',
      body: `يُرفَع <b>${esc(p.name)}</b> من نيّة الصلح ويعود إلى متابعة الصلة المعتادة. نسأل الله أن يديم الوصل.`,
      confirm: '🤍 نعم، الحمد لله',
      cancel: 'ليس بعد',
      onConfirm: () => { S.resolveRift(p.id); toast('الحمد لله — عادت الصلة 🤍'); render(); }
    });
    card.querySelector('[data-edit]').onclick = () => openRiftNote(p);
    sec.appendChild(card);
    v.appendChild(sec);
  });

  const add = el('button', 'btn btn-block', '＋ أضِف مَن أنوي صلحه');
  add.onclick = () => openRiftPicker();
  v.appendChild(add);

  const note = el('div', 'card muted');
  note.style.marginTop = '12px';
  note.innerHTML = '🔒 ما تكتبه هنا لا يغادر جهازك، ولا يظهر في أي مشاركة أو تصدير تعرضه على أحد.';
  v.appendChild(note);
}

function openRiftPicker() {
  const people = S.activePeople().filter(p => !S.hasRift(p));
  if (!people.length) return toast('لا يوجد من تضيفه');
  openSheet(`
    <h3>مَن أنوي صلحه؟</h3>
    <p class="sheet-sub">اختر رحمًا بينك وبينه جفوة. لن يظهر في قائمة الإلحاح اليومي بعدها.</p>
    <div class="guestbox">
      ${people.map(p => `
        <button class="guest" type="button" data-r="${p.id}">
          <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
          <span class="guest-n">${esc(p.name)}<span>${esc(R.REL_MAP[p.relation]?.label || '')}</span></span>
          <span class="guest-c">✓</span></button>`).join('')}
    </div>`,
    b => b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => {
      const p = S.getPerson(x.dataset.r);
      closeSheet(); openRiftNote(p, true);
    }));
}

function openRiftNote(p, isNew) {
  const cur = (p.rift && p.rift.note) || '';
  openSheet(`
    <h3>${isNew ? 'نيّة الصلح مع ' + esc(p.name) : 'ملاحظتك'}</h3>
    <p class="sheet-sub">اكتب لنفسك ما يعينك: ما الذي جرى، وما نيّتك. لا يراه أحد سواك.</p>
    <label class="field"><span>ملاحظة خاصة (اختياري)</span>
      <textarea id="r-note" style="min-height:110px" placeholder="مثال: انقطعنا بعد خلاف على الميراث. نيّتي أبدأ بالسلام في العيد.">${esc(cur)}</textarea></label>
    <button class="btn btn-primary btn-lg" id="r-save">${isNew ? 'أضِفه إلى نيّة الصلح' : 'حفظ'}</button>
    ${isNew ? '' : `<button class="btn btn-ghost btn-block" id="r-remove" style="margin-top:9px;color:var(--cold)">أزِله من نيّة الصلح</button>`}`,
    b => {
      b.querySelector('#r-save').onclick = () => {
        S.setRift(p.id, true, b.querySelector('#r-note').value.trim());
        closeSheet(); toast(isNew ? 'أعانك الله — بدأتَ بالنيّة 🤍' : 'حُفظت');
        go('rift');
      };
      const rm = b.querySelector('#r-remove');
      if (rm) rm.onclick = () => {
        S.setRift(p.id, false); closeSheet(); toast('أُزيل من نيّة الصلح'); render();
      };
    });
}

/* ══════════════════════════════════════════════════
   المواسم — رمضان والعيد
   ══════════════════════════════════════════════════ */

/* يُطبَّق على <html> فتتبدّل لوحة الألوان كلها */
function applySeasonTheme() {
  const s = S.activeSeason();
  const root = document.documentElement;
  if (!s) { root.removeAttribute('data-season'); root.style.removeProperty('--sa'); return; }
  root.setAttribute('data-season', s.key);
  root.style.setProperty('--sa', s.accent);
  root.style.setProperty('--sg1', s.grad[0]);
  root.style.setProperty('--sg2', s.grad[1]);
}

/* بطاقة الموسم في صدر شاشة اليوم */
function seasonCard(s) {
  const SE = window.SEASON;
  const sec = el('div', 'section');
  const c = el('div', 'season');

  if (s.greeting) {
    /* ── وضع العيد: قائمة المعايدة ── */
    const total = S.activePeople().length;
    const done = S.greetedList(s).filter(id => S.getPerson(id)).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    c.innerHTML = `
      <div class="season-head"><span class="season-icon">${s.icon}</span>
        <div><h3 class="season-title">${esc(s.title)}</h3>
        <p class="season-blurb">${esc(s.blurb)}</p></div></div>
      <div class="season-prog">
        <div class="season-bar"><i style="width:${pct}%"></i></div>
        <span>${done} من ${total} · ${pct}%</span>
      </div>
      <div class="season-actions">
        <button class="btn btn-season" data-open>${done ? 'أكمل المعايدة' : 'ابدأ المعايدة'}</button>
        <button class="btn btn-season-ghost" data-msg>✍️ نص التهنئة</button>
      </div>`;
    c.querySelector('[data-open]').onclick = () => go('greet');
    c.querySelector('[data-msg]').onclick = () => shareText(SE.eidMessage('', s), 'نص التهنئة');
  } else {
    /* ── هدف يومي: رمضان والعشر بالتواصل، وعرفة بالدعاء ── */
    const done = s.countDua ? S.duaToday() : S.reachedToday();
    const goal = s.goal;
    const pct = Math.min(100, Math.round(done / goal * 100));
    const isRamadan = s.key === 'ramadan' || s.key === 'ramadan_last10';
    const toEid = isRamadan ? SE.daysUntilHijri(10, 1, S.db.settings.hijriOffset || 0)
                            : SE.daysUntilHijri(12, 10, S.db.settings.hijriOffset || 0);
    const eidName = isRamadan ? 'عيد الفطر' : 'عيد الأضحى';

    c.innerHTML = `
      <div class="season-head"><span class="season-icon">${s.icon}</span>
        <div><h3 class="season-title">${esc(s.title)}</h3>
        <p class="season-blurb">${esc(s.blurb)}</p></div></div>
      <div class="season-prog">
        <div class="season-bar"><i style="width:${pct}%"></i></div>
        <span>${esc(s.goalText)} — ${done} من ${goal}</span>
      </div>
      ${done >= goal ? '<div class="season-done">✅ بلغتَ هدف اليوم. تقبّل الله.</div>' : ''}
      <div class="season-actions">
        ${isRamadan
          ? '<button class="btn btn-season" data-meal>🍽️ عزيمة إفطار</button>'
          : (s.countDua
              ? '<button class="btn btn-season" data-duaall>🤲 ادعُ لأرحامك</button>'
              : '<button class="btn btn-season" data-meal>🥩 وليمة الأضحى</button>')}
        <button class="btn btn-season-ghost" data-msg>✍️ تهنئة</button>
      </div>
      ${toEid !== null && toEid > 0 && toEid <= 40
        ? `<div class="season-foot">${isRamadan ? '🌙' : '🕋'} بقي ${esc(arDays(toEid))} على ${eidName}</div>` : ''}`;

    const meal = c.querySelector('[data-meal]');
    if (meal) meal.onclick = () => openGatheringSheet(null, isRamadan
      ? { title: 'عزيمة إفطار', time: '18:15', repeat: 'none',
          notes: 'الإفطار عند الأذان، ونصلّي المغرب جماعة بإذن الله.' }
      : { title: 'وليمة الأضحى', time: '13:00', repeat: 'none',
          notes: 'غداء الأضحى بعد صلاة العيد بإذن الله.' });

    const duaAll = c.querySelector('[data-duaall]');
    if (duaAll) duaAll.onclick = () => openDuaSheet();

    c.querySelector('[data-msg]').onclick = () => shareText(
      isRamadan ? SE.ramadanMessage('') : SE.eidMessage('', S.SEASON_ADHA || { key: 'eid_adha' }),
      'التهنئة');
  }

  /* الحجّاج من أرحامك — تظهر في مواسم ذي الحجة */
  if (s.hajj) {
    const list = S.pilgrims();
    const phase = S.hajjPhase();
    const box = el('div', 'hajj');
    if (list.length) {
      box.innerHTML = `<div class="hajj-head">🕋 الحجّاج من أرحامك <span>${list.length}</span></div>`;
      list.forEach(p => {
        const row = el('div', 'hajj-row');
        row.innerHTML = `
          <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
          <span class="hajj-n">${esc(p.name)}<span>${esc(R.REL_MAP[p.relation]?.label || '')}</span></span>
          <button class="gbtn" data-dua title="ادعُ له">🤲</button>
          <button class="gbtn" data-msg title="${phase === 'after' ? 'هنّئه بالعودة' : 'ودّعه'}">✍️</button>`;
        row.querySelector('[data-dua]').onclick = () => {
          S.addEvent(p.id, 'dua', 'دعاء للحاجّ'); haptic();
          toast('تقبّل الله دعاءك لـ' + p.name.split(' ')[0]); setTimeout(render, 650);
        };
        row.querySelector('[data-msg]').onclick = () => shareText(
          phase === 'after' ? SE.hajjReturnMessage(p.name.split(' ')[0])
                            : SE.hajjSendoffMessage(p.name.split(' ')[0]),
          'الرسالة');
        box.appendChild(row);
      });
    } else {
      box.innerHTML = `<div class="hajj-head">🕋 الحجّاج من أرحامك</div>
        <p class="hajj-empty">لم تُعلّم أحدًا. افتح صفحة القريب واضغط «يحجّ هذا العام» ليظهر هنا، فتذكّره بالدعاء والتهنئة.</p>`;
    }
    const pick = el('button', 'btn btn-season-ghost btn-block', list.length ? '＋ أضف حاجًّا' : '＋ علّم الحجّاج');
    pick.style.marginTop = '10px';
    pick.onclick = () => openHajjPicker();
    box.appendChild(pick);
    c.appendChild(box);
  }

  sec.appendChild(c);
  return sec;
}

/* ── اختيار الحجّاج ───────────────────────────────── */
function openHajjPicker() {
  const people = S.activePeople();
  const y = S.currentHijriYear();
  if (!people.length) return toast('أضف أرحامك أولًا');

  openSheet(`
    <h3>مَن يحجّ هذا العام؟</h3>
    <p class="sheet-sub">اختر من يحجّ في عام ${y}هـ — تُذكّرك صِلة بالدعاء له والتهنئة عند عودته.</p>
    <div class="guestbox">
      ${people.map(p => `
        <button class="guest" type="button" data-h="${p.id}" aria-pressed="${p.hajjYear === y}">
          <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
          <span class="guest-n">${esc(p.name)}<span>${esc(R.REL_MAP[p.relation]?.label || '')}</span></span>
          <span class="guest-c">✓</span></button>`).join('')}
    </div>
    <button class="btn btn-primary btn-lg" id="h-done" style="margin-top:14px">تم</button>`,
    b => {
      b.querySelectorAll('[data-h]').forEach(x => x.onclick = () => {
        const on = S.toggleHajj(x.dataset.h);
        x.setAttribute('aria-pressed', on); haptic();
      });
      b.querySelector('#h-done').onclick = () => { closeSheet(); render(); };
    });
}

/* ── دعاء جماعي ليوم عرفة ─────────────────────────── */
function openDuaSheet() {
  const rows = S.greetingOrder(null).slice(0, 12);
  openSheet(`
    <h3>ادعُ لأرحامك</h3>
    <p class="sheet-sub">اضغط الاسم لتسجيل دعوة له. مرتّبون بآكد الأرحام أولًا.</p>
    <div class="guestbox">
      ${rows.map(({ p }) => `
        <button class="guest" type="button" data-d="${p.id}" aria-pressed="false">
          <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
          <span class="guest-n">${esc(p.name)}<span>${esc(R.REL_MAP[p.relation]?.label || '')}</span></span>
          <span class="guest-c">🤲</span></button>`).join('')}
    </div>
    <button class="btn btn-primary btn-lg" id="d-done" style="margin-top:14px">تم</button>`,
    b => {
      b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => {
        if (x.getAttribute('aria-pressed') === 'true') return;
        S.addEvent(x.dataset.d, 'dua', 'دعاء يوم عرفة');
        x.setAttribute('aria-pressed', 'true'); haptic();
      });
      b.querySelector('#d-done').onclick = () => { closeSheet(); toast('تقبّل الله دعاءك'); render(); };
    });
}

/* مشاركة نص عام (تهنئة، دعوة…) */
async function shareText(text, label) {
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(text); toast('نُسخ ' + label); }
  catch (e) {
    openSheet(`<h3>${esc(label)}</h3><p class="sheet-sub">انسخه وأرسله لأهلك.</p>
      <textarea readonly style="width:100%;min-height:190px;padding:13px;border-radius:13px;border:1px solid var(--line);background:var(--card);font:inherit;line-height:1.9">${esc(text)}</textarea>`);
  }
}

/* ── صورة قائمة المعايدة ──────────────────────────
   تذكيرٌ جماعي يُرمى في قروب العائلة: الأسماء بدرجاتها فقط،
   أما مَن عايدتَ ومَن بقي فشأنك وحدك ولا يظهر. */
async function shareGreetingImage(season) {
  const rows = S.greetingOrder(null);
  if (!rows.length) return toast('أضف أرحامك أولًا');
  await document.fonts.ready;

  const W = 1080, PAD = 60, CHIP_H = 76, CHIP_GAP = 16, TIER_GAP = 40, LABEL_H = 54;
  const meas = document.createElement('canvas').getContext('2d');
  const font = (w, s) => `${w} ${s}px Cairo, sans-serif`;

  const tiers = [[], [], []];
  rows.forEach(({ p, s }) => tiers[(s.tier || 3) - 1].push(p));
  const blocks = tiers.map((list, i) => {
    meas.font = font(700, 28);
    const chips = list.map(p => ({
      name: p.name,
      w: Math.min(430, Math.max(140, meas.measureText(p.name).width + 52))
    }));
    const lines = [[]]; let x = 0;
    chips.forEach(c => {
      if (x + c.w > W - PAD * 2 && lines[lines.length - 1].length) { lines.push([]); x = 0; }
      lines[lines.length - 1].push(c); x += c.w + CHIP_GAP;
    });
    return { label: R.TIERS[i + 1].label, lines, count: list.length };
  }).filter(b => b.count);

  const HEAD = 240, FOOT = 110;
  const bodyH = blocks.reduce((a, b) =>
    a + LABEL_H + b.lines.length * (CHIP_H + CHIP_GAP) + TIER_GAP, 0);
  const H = HEAD + bodyH + FOOT;

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a6b52'); bg.addColorStop(1, '#0a3a2b');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  /* هلال العيد */
  g.strokeStyle = 'rgba(240,180,81,.9)'; g.lineWidth = 7;
  g.beginPath(); g.arc(W - 130, 118, 46, .55 * Math.PI, 1.75 * Math.PI); g.stroke();

  g.textAlign = 'center'; g.direction = 'rtl';
  g.fillStyle = '#ffffff'; g.font = font(800, 52);
  g.fillText(`معايدة ${season.label}`, W / 2, 100);
  g.fillStyle = '#f0b451'; g.font = font(600, 30);
  g.fillText(S.db.settings.myName ? `عائلة ${S.db.settings.myName}` : 'قائمة أرحامنا', W / 2, 156);
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = font(600, 24);
  g.fillText('لا تنسوا أحدًا من الصلة والمعايدة 🤍', W / 2, 202);

  let y = HEAD;
  blocks.forEach(b => {
    g.textAlign = 'right';
    g.fillStyle = '#f0b451'; g.font = font(700, 26);
    g.fillText(`${b.label} (${b.count})`, W - PAD, y + 30);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2;
    const tw = g.measureText(`${b.label} (${b.count})`).width;
    g.beginPath(); g.moveTo(PAD, y + 22); g.lineTo(W - PAD - tw - 22, y + 22); g.stroke();
    y += LABEL_H;
    b.lines.forEach(line => {
      const total = line.reduce((a, c) => a + c.w, 0) + (line.length - 1) * CHIP_GAP;
      let x = W - (W - total) / 2;
      line.forEach(c => {
        const cx = x - c.w;
        g.fillStyle = 'rgba(255,255,255,.13)';
        g.beginPath(); g.roundRect(cx, y, c.w, CHIP_H, 18); g.fill();
        g.textAlign = 'center';
        g.fillStyle = '#ffffff'; g.font = font(700, 28);
        g.fillText(c.name, cx + c.w / 2, y + 48, c.w - 22);
        x -= c.w + CHIP_GAP;
      });
      y += CHIP_H + CHIP_GAP;
    });
    y += TIER_GAP;
  });

  g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = font(600, 24);
  g.fillText('تقبّل الله منا ومنكم · تطبيق صِلة', W / 2, H - 46);

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  const file = new File([blob], 'قائمة-المعايدة.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'قائمة المعايدة' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'قائمة-المعايدة.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('نُزِّلت قائمة المعايدة 🖼️');
}

/* ── شاشة قائمة المعايدة ──────────────────────────── */
function viewGreeting(v) {
  const s = S.activeSeason();
  if (!s || !s.greeting) { go('today'); return; }

  const imgB = el('button', 'tb-btn', '🖼️ صورة');
  imgB.onclick = () => { toast('نجهّز الصورة…'); shareGreetingImage(s).catch(() => toast('تعذّر إنشاء الصورة')); };
  $('#tb-action').appendChild(imgB);

  const rows = S.greetingOrder(s);
  if (!rows.length) {
    v.appendChild(emptyBox('🎉', 'لا أحد في قائمتك بعد',
      'أضف أرحامك أولًا لترتّب لك صِلة قائمة معايدة بالأولوية.', 'أضف قريبًا', () => openAddSheet()));
    return;
  }

  const head = el('div', 'card');
  const rerender = () => { render(); };
  const done0 = S.greetedList(s).filter(id => S.getPerson(id)).length;
  head.innerHTML = `
    <div class="section-title" style="margin-bottom:4px">${s.icon} ${esc(s.title)}</div>
    <p class="muted">مرتّبة بالأولوية: آكد الأرحام أولًا، ثم الأطول انقطاعًا. اضغط الاسم لتعليمه.</p>
    <div class="season-prog light" style="margin-top:11px">
      <div class="season-bar"><i style="width:${rows.length ? done0 / rows.length * 100 : 0}%"></i></div>
      <span>${done0} من ${rows.length}</span>
    </div>`;
  v.appendChild(head);

  const byTier = { 1: [], 2: [], 3: [] };
  rows.forEach(r => byTier[r.s.tier || 3].push(r));

  Object.entries(byTier).forEach(([tier, list]) => {
    if (!list.length) return;
    const t = R.TIERS[tier];
    const sec = el('div', 'section');
    const remaining = list.filter(r => !S.hasGreeted(s, r.p.id)).length;
    sec.appendChild(el('div', 'section-head',
      `<span class="section-title">${esc(t.label)}</span><span class="muted">${remaining ? 'بقي ' + remaining : '✅ اكتملت'}</span>`));

    list.forEach(({ p }) => {
      const greeted = S.hasGreeted(s, p.id);
      const rel = R.REL_MAP[p.relation] || {};
      const row = el('div', 'greet' + (greeted ? ' done' : ''));
      row.innerHTML = `
        <button class="greet-main" data-tick>
          <span class="greet-check">✓</span>
          <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
          <span class="greet-n">${esc(p.name)}<span>${esc(rel.label || '')}${p.city ? ' · ' + esc(p.city) : ''}</span></span>
        </button>
        <div class="greet-acts">
          ${p.phone ? `<a class="gbtn" href="https://wa.me/${esc(p.phone.replace(/[^\d]/g, ''))}" target="_blank" rel="noopener" title="واتساب">💬</a>
                       <a class="gbtn" href="tel:${esc(p.phone)}" title="اتصال">📞</a>` : ''}
          <button class="gbtn" data-copy title="نسخ التهنئة">✍️</button>
        </div>`;

      const mark = () => {
        S.toggleGreeted(s, p.id);
        if (!greeted) { S.addEvent(p.id, 'message', 'معايدة ' + s.label); haptic(); }
        rerender();
      };
      row.querySelector('[data-tick]').onclick = mark;
      row.querySelector('[data-copy]').onclick = () =>
        shareText(window.SEASON.eidMessage(p.name.split(' ')[0], s), 'التهنئة');
      row.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        if (!S.hasGreeted(s, p.id)) { S.toggleGreeted(s, p.id); S.addEvent(p.id, 'message', 'معايدة ' + s.label); }
        setTimeout(rerender, 700);
      }));
      sec.appendChild(row);
    });
    v.appendChild(sec);
  });

  const note = el('div', 'card muted');
  note.innerHTML = '💡 كل تعليم يُسجَّل كصلة في سجل القريب، والقائمة تُصفَّر تلقائيًا في العيد القادم.';
  v.appendChild(note);
}

/* ══════════════════════════════════════════════════
   لقاءات العائلة
   ══════════════════════════════════════════════════ */
function fmtDate(ds) {
  const [y, m, d] = String(ds).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${AR_DAYS[dt.getDay()]} ${d} ${AR_MONTHS[m - 1]}`;
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'صباحًا' : 'مساءً'}`;
}

function countdown(n) {
  if (n === 0) return 'اليوم';
  if (n === 1) return 'غدًا';
  if (n === 2) return 'بعد يومين';
  if (n > 0) return `بعد ${arDays(n)}`;
  if (n === -1) return 'أمس';
  return `مضى ${arDays(-n)}`;
}

/* بطاقة اللقاء في شاشة اليوم */
function gatheringHero(g) {
  const n = S.daysUntil(g.date);
  const overdue = n <= 0;
  const guests = g.guests.map(id => S.getPerson(id)).filter(Boolean);
  const sec = el('div', 'section');
  const c = el('div', 'meet-hero');
  if (overdue) c.classList.add('due');

  c.innerHTML = `
    <div class="meet-badge">${overdue ? '📝 سجّل الحضور' : '🫂 لقاء قادم'}</div>
    <h3 class="meet-title">${esc(g.title)}</h3>
    <div class="meet-when">
      <span class="meet-count">${esc(countdown(n))}</span>
      <span>${esc(fmtDate(g.date))}${g.time ? ' · ' + esc(fmtTime(g.time)) : ''}</span>
    </div>
    ${g.place ? `<div class="meet-place">📍 ${esc(g.place)}</div>` : ''}
    <div class="meet-guests">👥 ${guests.length ? esc(guests.length + ' مدعوًّا: ' + guests.slice(0, 3).map(p => p.name.split(' ')[0]).join('، ') + (guests.length > 3 ? ' وآخرون' : '')) : 'لم تُحدَّد الدعوات بعد'}</div>
    <div class="meet-actions">
      ${overdue
        ? `<button class="btn btn-gold" data-att>✅ سجّل مَن حضر</button>`
        : `<button class="btn btn-gold" data-invite>📨 أرسل الدعوة</button>`}
      <button class="btn btn-ghost meet-ghost" data-open>التفاصيل</button>
    </div>`;

  const att = c.querySelector('[data-att]');
  if (att) att.onclick = () => openAttendanceSheet(g);
  const inv = c.querySelector('[data-invite]');
  if (inv) inv.onclick = () => shareInvite(g);
  c.querySelector('[data-open]').onclick = () => go('meets');
  sec.appendChild(c);
  return sec;
}

/* نص الدعوة الجاهز للواتساب */
function inviteText(g) {
  const n = S.daysUntil(g.date);
  return [
    `🌿 ${g.title}`,
    '',
    `📅 ${fmtDate(g.date)}${n >= 0 ? ' (' + countdown(n) + ')' : ''}`,
    g.time ? `🕗 ${fmtTime(g.time)}` : '',
    g.place ? `📍 ${g.place}` : '',
    g.notes ? '\n' + g.notes : '',
    '',
    'حيّاكم الله، ولا تحرمونا حضوركم 🤍',
    '«وَاتَّقُوا اللَّهَ الَّذِي تَسَاءَلُونَ بِهِ وَالْأَرْحَامَ»'
  ].filter(l => l !== '').join('\n');
}

async function shareInvite(g) {
  const text = inviteText(g);
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { return; /* أُلغيت المشاركة */ }
  try { await navigator.clipboard.writeText(text); toast('نُسخت الدعوة — الصقها في واتساب'); }
  catch (e) {
    openSheet(`<h3>نص الدعوة</h3><p class="sheet-sub">انسخه وأرسله لأهلك.</p>
      <textarea readonly style="width:100%;min-height:220px;padding:13px;border-radius:13px;border:1px solid var(--line);background:var(--card);font:inherit;line-height:1.9">${esc(text)}</textarea>`);
  }
}

function viewGatherings(v) {
  const addB = el('button', 'tb-btn primary', '＋ لمّة');
  addB.onclick = () => openGatheringSheet();
  $('#tb-action').appendChild(addB);

  const up = S.upcomingGatherings();
  const past = S.pastGatherings();

  if (!up.length && !past.length) {
    v.appendChild(emptyBox('🫂', 'رتّب لمّة عائلية',
      'حدّد موعدًا، ادعُ من تشاء من أرحامك، وأرسل الدعوة بضغطة. وبعد اللمّة سجّل مَن حضر — فتُحتسب زيارة لكل واحد منهم دفعة واحدة.',
      'رتّب أول لمّة', () => openGatheringSheet()));
    return;
  }

  if (up.length) {
    const s = el('div', 'section');
    s.appendChild(el('div', 'section-head', `<span class="section-title">القادمة</span><span class="muted">${up.length}</span>`));
    up.forEach(g => s.appendChild(gatheringRow(g)));
    v.appendChild(s);
  }

  if (past.length) {
    const s = el('div', 'section');
    s.appendChild(el('div', 'section-head', `<span class="section-title">لمّات سابقة</span><span class="muted">${past.length}</span>`));
    past.slice(0, 12).forEach(g => s.appendChild(gatheringRow(g)));
    v.appendChild(s);
  }

  const tip = el('div', 'card muted');
  tip.style.marginTop = '6px';
  tip.innerHTML = '💡 اللمّة المتكرّرة تُنشئ موعدها التالي تلقائيًا بمجرّد ما تسجّل حضور الحالية.';
  v.appendChild(tip);
}

function gatheringRow(g) {
  const n = S.daysUntil(g.date);
  const done = g.attended !== null;
  const guests = g.guests.map(id => S.getPerson(id)).filter(Boolean);
  const overdue = !done && n <= 0;

  const c = el('div', 'card meet-row');
  c.style.setProperty('--mc', done ? 'var(--ink-3)' : overdue ? 'var(--gold)' : 'var(--green)');
  c.innerHTML = `
    <div class="meet-row-top">
      <div class="meet-cal">
        <b>${String(g.date).split('-')[2]}</b>
        <span>${AR_MONTHS[Number(String(g.date).split('-')[1]) - 1].slice(0, 4)}</span>
      </div>
      <div class="pc-main">
        <div class="pc-name">${esc(g.title)}</div>
        <div class="pc-rel">${esc(fmtDate(g.date))}${g.time ? ' · ' + esc(fmtTime(g.time)) : ''}</div>
        <div class="pc-rel">${g.place ? '📍 ' + esc(g.place) + ' · ' : ''}👥 ${guests.length}${g.repeat !== 'none' ? ' · 🔁 ' + esc(S.REPEATS[g.repeat].label) : ''}</div>
      </div>
      <span class="meet-state">${done ? '✔️ تمّت' : overdue ? esc(countdown(n)) : esc(countdown(n))}</span>
    </div>
    ${done
      ? `<div class="meet-done">حضر ${g.attended.length} من ${g.guests.length} — سُجّلت زيارة لكل حاضر</div>`
      : `<div class="meet-actions">
           ${overdue ? '<button class="btn btn-gold" data-att>✅ سجّل مَن حضر</button>'
                     : '<button class="btn btn-primary" data-invite>📨 الدعوة</button>'}
           <button class="btn" data-edit>✏️ تعديل</button>
           <button class="btn btn-ghost" data-del style="flex:none;padding:12px 13px">🗑</button>
         </div>`}`;

  const q = s => c.querySelector(s);
  if (q('[data-att]')) q('[data-att]').onclick = () => openAttendanceSheet(g);
  if (q('[data-invite]')) q('[data-invite]').onclick = () => shareInvite(g);
  if (q('[data-edit]')) q('[data-edit]').onclick = () => openGatheringSheet(g);
  if (q('[data-del]')) q('[data-del]').onclick = () => confirmSheet({
    title: `حذف «${g.title}»؟`,
    body: `اللمّة يوم ${esc(fmtDate(g.date))}، و${guests.length} مدعوًّا. لن يتأثّر سجل أرحامك.`,
    confirm: '🗑 احذف اللمّة',
    cancel: 'أبقِها',
    danger: true,
    onConfirm: () => { S.deleteGathering(g.id); toast('حُذفت اللمّة'); render(); }
  });
  return c;
}

/* ── ورقة إنشاء/تعديل لمّة ────────────────────────── */
function openGatheringSheet(existing, preset) {
  const isEdit = !!existing;
  const people = S.activePeople();
  let picked = new Set(existing ? existing.guests : []);
  const seed = existing || preset || {};

  const d = new Date(Date.now() + (preset ? 1 : 7) * 86400000);
  const defDate = existing ? existing.date
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  /* اقتراحات سريعة لمن تدعوهم */
  const QUICK = [
    { k: 'cousins_p', label: 'عيال العمّ', test: p => ['c_uncle_p_m', 'c_uncle_p_f', 'c_aunt_p_m', 'c_aunt_p_f'].includes(p.relation) },
    { k: 'cousins_m', label: 'عيال الخال', test: p => ['c_uncle_m_m', 'c_uncle_m_f', 'c_aunt_m_m', 'c_aunt_m_f'].includes(p.relation) },
    { k: 'sibs',      label: 'الإخوة',     test: p => ['brother', 'sister'].includes(p.relation) },
    { k: 'unclesP',   label: 'الأعمام والعمّات', test: p => ['uncle_p', 'aunt_p'].includes(p.relation) },
    { k: 'unclesM',   label: 'الأخوال والخالات', test: p => ['uncle_m', 'aunt_m'].includes(p.relation) },
    { k: 'all',       label: 'الجميع',     test: () => true }
  ];

  openSheet(`
    <h3>${isEdit ? 'تعديل اللمّة' : 'لمّة عائلية جديدة'}</h3>
    <p class="sheet-sub">حدّد الموعد وادعُ مَن تشاء — وبعدها سجّل مَن حضر بضغطة.</p>

    <label class="field"><span>المناسبة *</span>
      <input id="g-title" type="text" placeholder="مثال: لمّة عيال العم" value="${esc(seed.title || '')}"></label>

    <div class="field-row">
      <label class="field"><span>التاريخ *</span>
        <input id="g-date" type="date" value="${esc(defDate)}"></label>
      <label class="field"><span>الوقت</span>
        <input id="g-time" type="time" value="${esc(seed.time || '20:00')}"></label>
    </div>

    <label class="field"><span>المكان</span>
      <input id="g-place" type="text" placeholder="مثال: استراحة أبو سعد — حي النرجس" value="${esc(seed.place || '')}"></label>

    <label class="field"><span>التكرار</span>
      <select id="g-repeat">
        ${Object.entries(S.REPEATS).map(([k, r]) =>
          `<option value="${k}"${(seed.repeat || 'none') === k ? ' selected' : ''}>${r.label}</option>`).join('')}
      </select></label>

    <div style="font-size:13px;font-weight:800;color:var(--ink-2);margin:14px 0 8px">
      المدعوّون <span id="g-count" class="badge g"></span></div>

    ${people.length ? `
      <div class="relchips" style="margin-bottom:11px">
        ${QUICK.map(q => `<button class="relchip" data-quick="${q.k}" type="button">+ ${q.label}</button>`).join('')}
        <button class="relchip" data-quick="clear" type="button">مسح الكل</button>
      </div>
      <div class="guestbox" id="g-guests">
        ${people.map(p => {
          const rel = R.REL_MAP[p.relation] || {};
          return `<button class="guest" type="button" data-g="${p.id}" aria-pressed="${picked.has(p.id)}">
            <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
            <span class="guest-n">${esc(p.name)}<span>${esc(rel.label || '')}</span></span>
            <span class="guest-c">✓</span></button>`;
        }).join('')}
      </div>`
      : '<div class="card muted">أضف أرحامك أولًا لتتمكّن من دعوتهم.</div>'}

    <label class="field" style="margin-top:14px"><span>ملاحظة تُرفق بالدعوة</span>
      <textarea id="g-notes" placeholder="مثال: العشاء الساعة ٩، ونرجو إحضار الأطفال">${esc(seed.notes || '')}</textarea></label>

    <button class="btn btn-primary btn-lg" id="g-save">${isEdit ? 'حفظ التعديلات' : 'أنشئ اللمّة'}</button>
  `, body => {
    const countEl = body.querySelector('#g-count');
    const refresh = () => {
      countEl.textContent = picked.size ? `${picked.size} مدعوًّا` : 'لم تختر أحدًا';
      body.querySelectorAll('[data-g]').forEach(b =>
        b.setAttribute('aria-pressed', picked.has(b.dataset.g)));
    };
    body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      picked.has(b.dataset.g) ? picked.delete(b.dataset.g) : picked.add(b.dataset.g);
      refresh();
    });
    body.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => {
      const k = b.dataset.quick;
      if (k === 'clear') picked.clear();
      else people.filter(QUICK.find(q => q.k === k).test).forEach(p => picked.add(p.id));
      refresh(); haptic();
    });
    refresh();

    body.querySelector('#g-save').onclick = () => {
      const title = body.querySelector('#g-title').value.trim();
      const date = body.querySelector('#g-date').value;
      if (!title) return toast('اكتب اسم المناسبة');
      if (!date) return toast('حدّد التاريخ');
      const data = {
        title, date,
        time: body.querySelector('#g-time').value,
        place: body.querySelector('#g-place').value.trim(),
        repeat: body.querySelector('#g-repeat').value,
        notes: body.querySelector('#g-notes').value.trim(),
        guests: [...picked]
      };
      if (isEdit) { S.updateGathering(existing.id, data); toast('حُفظت التعديلات'); }
      else { S.addGathering(data); toast('أُنشئت اللمّة 🫂'); }
      closeSheet();
      go('meets');
    };
  });
}

/* ── ورقة تسجيل الحضور ────────────────────────────── */
function openAttendanceSheet(g) {
  const guests = g.guests.map(id => S.getPerson(id)).filter(Boolean);
  if (!guests.length) {
    confirmSheet({
      title: 'لا يوجد مدعوّون',
      body: 'هذه اللمّة بلا قائمة دعوات، فلا حضور يُسجَّل. تقدر تغلقها أو ترجع وتضيف المدعوّين.',
      confirm: 'أغلق اللمّة',
      cancel: 'ارجع',
      onConfirm: () => { S.recordAttendance(g.id, []); toast('أُغلقت اللمّة'); render(); }
    });
    return;
  }
  let came = new Set(guests.map(p => p.id));   /* الافتراض أن الجميع حضر — تُلغي الغائبين */

  openSheet(`
    <h3>مَن حضر «${esc(g.title)}»؟</h3>
    <p class="sheet-sub">ألغِ تحديد مَن لم يحضر. كل مَن يبقى محدَّدًا تُسجَّل له <b>زيارة</b> بتاريخ اللمّة.</p>
    <div class="guestbox">
      ${guests.map(p => {
        const rel = R.REL_MAP[p.relation] || {};
        return `<button class="guest" type="button" data-a="${p.id}" aria-pressed="true">
          <span class="avatar" style="--av:${avatarColor(p.id)}">${esc(initials(p.name))}</span>
          <span class="guest-n">${esc(p.name)}<span>${esc(rel.label || '')}</span></span>
          <span class="guest-c">✓</span></button>`;
      }).join('')}
    </div>
    <div class="hint" id="a-count" style="margin:11px 0 14px"></div>
    <button class="btn btn-primary btn-lg" id="a-save"></button>
  `, body => {
    const cnt = body.querySelector('#a-count');
    const btn = body.querySelector('#a-save');
    const refresh = () => {
      cnt.textContent = `${came.size} من ${guests.length} حضروا`;
      btn.textContent = came.size ? `✅ سجّل الحضور (${came.size})` : 'لم يحضر أحد — أغلق اللمّة';
    };
    body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      came.has(b.dataset.a) ? came.delete(b.dataset.a) : came.add(b.dataset.a);
      b.setAttribute('aria-pressed', came.has(b.dataset.a));
      refresh();
    });
    refresh();
    btn.onclick = () => {
      S.recordAttendance(g.id, [...came]);
      haptic(); closeSheet();
      toast(came.size ? `سُجّلت زيارة لـ${came.size} من أرحامك — تقبّل الله` : 'أُغلقت اللمّة');
      render();
    };
  });
}

/* ══════════════════════════════════════════════════
   ٩) المناسبات
   ══════════════════════════════════════════════════ */
function viewOccasions(v) {
  const occ = S.upcomingOccasions(400);
  if (!occ.length) {
    v.appendChild(emptyBox('🎉', 'لا مناسبات مسجّلة',
      'افتح صفحة أي قريب وأضف ميلاده أو زواجه أو ذكرى وفاة ليصلك التذكير.', 'اذهب إلى أرحامي', () => go('people')));
    return;
  }
  const soon = occ.filter(o => o.inDays <= 30);
  const later = occ.filter(o => o.inDays > 30);

  if (soon.length) {
    const s = el('div', 'section');
    s.appendChild(el('div', 'section-head', '<span class="section-title">خلال ٣٠ يومًا</span>'));
    soon.forEach(o => s.appendChild(occRow(o)));
    v.appendChild(s);
  }
  if (later.length) {
    const s = el('div', 'section');
    s.appendChild(el('div', 'section-head', '<span class="section-title">لاحقًا</span>'));
    later.forEach(o => s.appendChild(occRow(o)));
    v.appendChild(s);
  }
}

/* ══════════════════════════════════════════════════
   ١٠) النسخ الاحتياطي
   ══════════════════════════════════════════════════ */
function viewBackup(v) {
  const info = el('div', 'card');
  info.innerHTML = `<p class="muted">بياناتك محفوظة داخل متصفح هذا الجهاز فقط. إن مسحت بيانات المتصفح أو غيّرت الجهاز، ستفقدها.
    <b style="color:var(--ink)">صدّر نسخة احتياطية بين حين وآخر</b> واحتفظ بالملف.</p>`;
  v.appendChild(info);

  const exp = el('button', 'btn btn-primary btn-lg', '⬇️ تصدير نسخة احتياطية');
  exp.style.marginTop = '12px';
  exp.onclick = () => {
    S.exportJSON();
    S.db.settings.backup = { ...(S.db.settings.backup || {}), lastExport: new Date().toISOString() };
    S.save();
    toast('نُزِّل الملف — احتفظ به في مكان آمن');
  };
  v.appendChild(exp);

  const lbl = el('label', 'btn btn-lg', '⬆️ استيراد من ملف');
  lbl.style.marginTop = '9px';
  const inp = el('input');
  inp.type = 'file'; inp.accept = '.json,application/json'; inp.hidden = true;
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    let text;
    try { text = await f.text(); } catch (e) { inp.value = ''; return failSheet(e.message); }
    inp.value = '';

    /* استعرض محتوى الملف قبل أي تغيير، واجعل كل خيار يقول أثره صراحةً */
    let incoming;
    try {
      incoming = JSON.parse(text);
      if (!incoming || !Array.isArray(incoming.people)) throw new Error('الملف لا يحتوي بيانات «صِلة».');
    } catch (e) { return failSheet(e.message); }

    /* ملف شجرة عائلية؟ مساره أبسط: إضافة الجديد فقط، لا استبدال أصلًا */
    if (incoming.kind === 'silah-tree') {
      confirmSheet({
        title: incoming.from ? `شجرة من ${incoming.from} 🌳` : 'شجرة عائلية 🌳',
        body: `فيها <b>${esc(arPeople(incoming.people.length))}</b>. يُضاف الجديد فقط —
               من عندك يبقى كما هو، ولا يُستبدل شيء.`,
        confirm: '🌿 أضِف الجديد',
        cancel: 'إلغاء',
        onConfirm: () => {
          try {
            const r = S.importTreeShare(incoming);
            toast(r.added
              ? `أُضيف ${arPeople(r.added)}${r.skipped ? ' · تُخطّي ' + r.skipped + ' موجودًا' : ''} 🌿`
              : 'كلهم عندك بالفعل — لم يُضَف أحد');
            go('tree');
          } catch (e) { failSheet(e.message); }
        }
      });
      return;
    }

    const run = mode => {
      try { S.importJSON(text, mode); toast('تم الاستيراد بنجاح'); go('today'); }
      catch (e) { failSheet(e.message); }
    };

    optionSheet({
      title: 'كيف نستورد الملف؟',
      body: `الملف يحتوي <b>${esc(arPeople(incoming.people.length))}</b> و<b>${esc(arLogs((incoming.events || []).length))}</b>.
             وعندك الآن <b>${esc(arPeople(S.db.people.length))}</b> و<b>${esc(arLogs(S.db.events.length))}</b>.`,
      options: [
        { icon: '➕', label: 'دمج مع بياناتي',
          desc: 'يضيف الجديد ويُبقي كل ما عندك كما هو',
          run: () => run('merge') },
        { icon: '⚠️', label: 'استبدال بياناتي',
          desc: `يمسح أرحامك الـ${S.db.people.length} الحاليين نهائيًا ويضع محتوى الملف مكانهم`,
          danger: true,
          run: () => confirmSheet({
            title: 'تأكيد الاستبدال',
            body: `سيُمسح <b>${S.db.people.length}</b> من أرحامك و<b>${S.db.events.length}</b> تسجيل صلة نهائيًا.`,
            confirm: '⚠️ استبدل',
            cancel: 'لا',
            danger: true,
            onConfirm: () => run('replace')
          }) }
      ]
    });
  };
  lbl.appendChild(inp);
  v.appendChild(lbl);

  const stats = el('div', 'card');
  stats.style.marginTop = '16px';
  stats.innerHTML = `<div class="section-title" style="margin-bottom:6px">حجم بياناتك</div>
    <p class="muted">${S.db.people.length} قريبًا · ${S.db.events.length} تسجيل صلة</p>`;
  v.appendChild(stats);
}

/* ══════════════════════════════════════════════════
   الإقلاع
   ══════════════════════════════════════════════════ */
function boot() {
  S.load();
  S.onSaveError = () => failSheet(
    'تعذّر حفظ التغيير — مساحة التخزين في المتصفح ممتلئة. احذف بيانات مواقع لا تحتاجها، أو صدّر نسخة احتياطية ثم امسح البيانات القديمة.');

  /* نسخة العرض التوضيحي: تفتح معبّأة بالنموذج مباشرة بدل شاشة الترحيب */
  if (window.SILAH_DEMO && !S.db.settings.myName && S.db.people.length === 0) {
    S.db.settings.myName = 'عبدالله';
    S.save();
    seedDemo();
  }

  applyFont();
  applySeasonTheme();

  /* التذكير: يُعوَّض ما فات عند الفتح، ويُحدَّث الملخّص لعامل الخدمة.
     وعند العودة للتطبيق بعد غياب، يُعاد الفحص. */
  if (window.NOTIFY) {
    setTimeout(() => window.NOTIFY.checkAndFire().catch(() => {}), 1200);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) window.NOTIFY.checkAndFire().catch(() => {});
    });
  }

  /* اختصارات أيقونة التطبيق: ?go=… تفتح الوجهة مباشرة */
  const dest = new URLSearchParams(location.search).get('go');
  const DEST = { today: 'today', people: 'people', tree: 'tree', log: 'today' };

  const needsOnboard = !S.db.settings.myName && S.db.people.length === 0;
  $('#onboard').hidden = !needsOnboard;
  if (needsOnboard) {
    const start = () => {
      S.db.settings.myName = $('#ob-name').value.trim();
      S.save();
      $('#onboard').hidden = true;
      go('today');
    };
    $('#ob-start').onclick = start;
    $('#ob-name').onkeydown = e => { if (e.key === 'Enter') start(); };
  }

  go(DEST[dest] || 'today');
  /* لا يبقى ?go= في الشريط فيعيد الفتح على الوجهة نفسها بعد التنقّل */
  if (dest) history.replaceState(null, '', location.pathname);
  if (dest === 'log' && !needsOnboard) {
    const first = S.suggestions(1)[0];
    if (first) setTimeout(() => openLogSheet(first.p), 350);
  }
}

boot();
})();
