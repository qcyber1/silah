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
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2100);
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

  switch (route.name) {
    case 'today':   title.textContent = 'صِلة';        viewToday(v); break;
    case 'people':  title.textContent = 'أرحامي';      viewPeople(v); break;
    case 'tree':    title.textContent = 'شجرة الأرحام'; viewTree(v); break;
    case 'more':    title.textContent = 'المزيد';      viewMore(v); break;
    case 'texts':   title.textContent = 'آيات وأحاديث'; backBtn('more'); viewTexts(v); break;
    case 'stats':   title.textContent = 'سجل الصلة';   backBtn('more'); viewStats(v); break;
    case 'occ':     title.textContent = 'المناسبات';   backBtn('more'); viewOccasions(v); break;
    case 'meets':   title.textContent = 'لقاءات العائلة'; backBtn('more'); viewGatherings(v); break;
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

  const people = S.activePeople();
  if (!people.length) {
    const box = emptyBox('👥', 'ابدأ ببناء شجرة أرحامك',
      'أضف والديك وإخوتك وأعمامك وأخوالك — وصِلة تتكفّل بتذكيرك بمن يستحق صلتك.',
      'أضف أول قريب', () => openAddSheet());
    const demo = el('button', 'btn btn-ghost btn-block', '👁️ استعرض بمثال تجريبي');
    demo.style.marginTop = '9px';
    demo.onclick = () => { seedDemo(); toast('بيانات تجريبية — امسحها من «المزيد» متى شئت'); render(); };
    box.appendChild(demo);
    v.appendChild(box);
    v.appendChild(textOfDay());
    return;
  }

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

  /* نص اليوم */
  v.appendChild(textOfDay());
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
    <div class="sug-actions">
      ${p.phone ? `<a class="btn btn-primary" href="tel:${esc(p.phone)}" data-call>📞 اتصل الآن</a>` : `<button class="btn btn-primary" data-log>✔️ سجّل صلة</button>`}
      <button class="btn" data-open>التفاصيل</button>
    </div>`;

  const callBtn = c.querySelector('[data-call]');
  if (callBtn) callBtn.onclick = () => { S.addEvent(p.id, 'call'); haptic(); toast('سُجّل اتصالك بـ' + p.name + ' — تقبّل الله'); setTimeout(render, 700); };
  const logBtn = c.querySelector('[data-log]');
  if (logBtn) logBtn.onclick = () => openLogSheet(p);
  c.querySelector('[data-open]').onclick = () => go('person', p.id);
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
      const q = pQuery.trim();
      rows = rows.filter(r => r.p.name.includes(q) || (R.REL_MAP[r.p.relation]?.label || '').includes(q));
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
    b.onclick = () => {
      S.addEvent(p.id, a.key); haptic();
      toast(a.key === 'dua' ? 'تقبّل الله دعاءك 🤲' : `سُجّلت ${a.label} — بارك الله فيك`);
      setTimeout(render, 650);
    };
    acts.appendChild(b);
  });
  logSec.appendChild(acts);
  logSec.appendChild(el('div', 'hint', '🤲 الدعاء يُسجَّل كحسنة ولا يُصفِّر عدّاد التواصل — الصلة تحتاج تواصلًا.'));
  v.appendChild(logSec);

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
        <div class="pc-rel">${dd || '?'} ${AR_MONTHS[(mm || 1) - 1]} — سنويًا</div></div>
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
  openSheet(`
    <h3>سجّل صلة مع ${esc(p.name)}</h3>
    <p class="sheet-sub">اختر نوع الصلة — ضغطة واحدة تكفي.</p>
    <div class="acts">
      ${R.ACTIONS.map(a => `<button class="act big" data-a="${a.key}"><span class="e">${a.icon}</span><span>${a.label}</span></button>`).join('')}
    </div>
    <label class="field" style="margin-top:14px"><span>ملاحظة (اختياري)</span>
      <input id="lognote" type="text" placeholder="مثال: سألته عن صحته"></label>`,
    body => {
      body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        S.addEvent(p.id, b.dataset.a, body.querySelector('#lognote').value);
        haptic(); closeSheet(); toast('سُجّلت الصلة — تقبّل الله'); render();
      });
    });
}

/* ── ورقة المناسبة ────────────────────────────────── */
function openOccasionSheet(p) {
  openSheet(`
    <h3>مناسبة لـ${esc(p.name)}</h3>
    <p class="sheet-sub">تُذكِّرك صِلة قبل موعدها.</p>
    <div class="relchips" id="okinds" style="margin-bottom:14px">
      ${R.OCCASION_KINDS.map((k, i) => `<button class="relchip" data-k="${k.key}" aria-pressed="${i === 0}">${k.icon} ${k.label}</button>`).join('')}
    </div>
    <label class="field"><span>العنوان</span><input id="otitle" type="text" placeholder="مثال: ميلاد أبي"></label>
    <div class="field-row">
      <label class="field"><span>اليوم</span><input id="oday" type="number" min="1" max="31" inputmode="numeric" placeholder="١٥"></label>
      <label class="field"><span>الشهر</span>
        <select id="omonth">${AR_MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label>
    </div>
    <button class="btn btn-primary btn-lg" id="osave">حفظ المناسبة</button>`,
    body => {
      let kind = R.OCCASION_KINDS[0].key;
      body.querySelectorAll('#okinds .relchip').forEach(b => b.onclick = () => {
        kind = b.dataset.k;
        body.querySelectorAll('#okinds .relchip').forEach(x => x.setAttribute('aria-pressed', x === b));
      });
      body.querySelector('#osave').onclick = () => {
        const d = Number(body.querySelector('#oday').value);
        const m = Number(body.querySelector('#omonth').value);
        if (!d || d < 1 || d > 31) return toast('أدخل يومًا صحيحًا');
        const list = (p.occasions || []).concat([{
          id: S.uid(), kind,
          title: body.querySelector('#otitle').value.trim() || R.OCCASION_MAP[kind].label,
          date: String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
        }]);
        S.updatePerson(p.id, { occasions: list });
        closeSheet(); toast('أُضيفت المناسبة'); render();
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
    ${isEdit ? '' : '<button class="btn btn-ghost btn-block" id="f-save-more" style="margin-top:9px">حفظ وإضافة آخر</button>'}
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
  const items = [
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
    b.onclick = () => go(r);
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

/* ══════════════════════════════════════════════════
   ٧) النصوص
   ══════════════════════════════════════════════════ */
let textTab = 'hadith';
function viewTexts(v) {
  const tabs = el('div', 'texttabs');
  [['hadith', `أحاديث (${T.HADITHS.length})`], ['verse', `آيات (${T.VERSES.length})`], ['dua', `أدعية (${T.DUAS.length})`]]
    .forEach(([k, l]) => {
      const b = el('button', 'fchip', l);
      b.setAttribute('aria-pressed', textTab === k);
      b.onclick = () => { textTab = k; render(); };
      tabs.appendChild(b);
    });
  v.appendChild(tabs);

  const note = el('div', 'card');
  note.style.marginBottom = '12px';
  note.innerHTML = `<p class="muted">🛡️ سياسة التوثيق: الأحاديث المعروضة من <b>صحيح البخاري وصحيح مسلم</b> فقط، مع رقم الحديث والراوي. لا يُعرض هنا حديث ضعيف.</p>`;
  v.appendChild(note);

  if (textTab === 'hadith') {
    T.HADITHS.forEach(h => {
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
    T.VERSES.forEach(x => {
      const c = el('div', 'tcard');
      c.innerHTML = `<div class="body q">${esc(x.text)}</div>
        <div class="foot"><span class="badge g">${esc(x.ref)}</span>${x.tag ? `<span class="badge o">${esc(x.tag)}</span>` : ''}</div>`;
      c.appendChild(shareBtn(`${x.text}\n\n— ${x.ref}`));
      v.appendChild(c);
    });
  } else {
    T.DUAS.forEach(x => {
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

  /* من لم تصله أبدًا */
  const never = people.filter(p => !S.lastContact(p.id));
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
function openGatheringSheet(existing) {
  const isEdit = !!existing;
  const people = S.activePeople();
  let picked = new Set(existing ? existing.guests : []);

  const d = new Date(Date.now() + 7 * 86400000);
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
      <input id="g-title" type="text" placeholder="مثال: لمّة عيال العم" value="${esc(existing?.title || '')}"></label>

    <div class="field-row">
      <label class="field"><span>التاريخ *</span>
        <input id="g-date" type="date" value="${esc(defDate)}"></label>
      <label class="field"><span>الوقت</span>
        <input id="g-time" type="time" value="${esc(existing?.time || '20:00')}"></label>
    </div>

    <label class="field"><span>المكان</span>
      <input id="g-place" type="text" placeholder="مثال: استراحة أبو سعد — حي النرجس" value="${esc(existing?.place || '')}"></label>

    <label class="field"><span>التكرار</span>
      <select id="g-repeat">
        ${Object.entries(S.REPEATS).map(([k, r]) =>
          `<option value="${k}"${existing?.repeat === k ? ' selected' : ''}>${r.label}</option>`).join('')}
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
      <textarea id="g-notes" placeholder="مثال: العشاء الساعة ٩، ونرجو إحضار الأطفال">${esc(existing?.notes || '')}</textarea></label>

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
  exp.onclick = () => { S.exportJSON(); toast('نُزِّل الملف'); };
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
  go('today');
}

boot();
})();
