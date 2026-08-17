/* =====================================================================
   صِلة — طبقة التخزين والحسابات
   التخزين محلي بالكامل (localStorage). لا يخرج أي بيان من جهازك.
   ===================================================================== */

const KEY = 'silah.v1';
const DAY = 86400000;

const DEFAULT_DB = {
  version: 3,
  /* seasonMode: 'auto' يكتشف الموسم من التقويم؛ أو مفتاح موسم لمعاينته يدويًا.
     hijriOffset: تعديل ±يوم لمن يتبع رؤية محلية تختلف عن أم القرى. */
  settings: { myName: '', started: null, theme: 'auto', seasonMode: 'auto', hijriOffset: 0 },
  people: [],
  events: [],
  gatherings: [],
  greetings: {}   /* { 'eid_fitr-1448': [personId, …] } — تُصفَّر كل عام تلقائيًا */
};

let DB = null;

/* مخزن احتياطي في الذاكرة إن مُنع التخزين المحلي (تصفّح خاص أو إطار محجوب) */
const memStore = { data: {} };
let storageOK = true;
const store = {
  get(k) { return storageOK ? localStorage.getItem(k) : memStore.data[k] ?? null; },
  set(k, v) { if (storageOK) localStorage.setItem(k, v); else memStore.data[k] = v; }
};
try { localStorage.setItem('silah.probe', '1'); localStorage.removeItem('silah.probe'); }
catch (e) { storageOK = false; }

/* ── تحميل وحفظ ─────────────────────────────────────── */
function load() {
  try {
    const raw = store.get(KEY);
    DB = raw ? JSON.parse(raw) : structuredClone(DEFAULT_DB);
  } catch (e) {
    console.warn('تعذّر قراءة البيانات، بدأنا من جديد', e);
    DB = structuredClone(DEFAULT_DB);
  }
  if (!DB.settings) DB.settings = structuredClone(DEFAULT_DB.settings);
  if (!Array.isArray(DB.people)) DB.people = [];
  if (!Array.isArray(DB.events)) DB.events = [];
  if (!Array.isArray(DB.gatherings)) DB.gatherings = [];   // أُضيفت في الإصدار ٢
  if (!DB.greetings || typeof DB.greetings !== 'object') DB.greetings = {};  // الإصدار ٣
  if (DB.settings.seasonMode === undefined) DB.settings.seasonMode = 'auto';
  if (DB.settings.hijriOffset === undefined) DB.settings.hijriOffset = 0;
  if (!DB.settings.started) DB.settings.started = new Date().toISOString();
  return DB;
}

/* الطبقة لا تلمس DOM — تُبلّغ الواجهة عبر خطّاف تسجّله app.js */
let onSaveError = null;

function save() {
  try {
    store.set(KEY, JSON.stringify(DB));
    return true;
  } catch (e) {
    if (onSaveError) onSaveError(e);
    return false;
  }
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ── الأشخاص ───────────────────────────────────────── */
function addPerson(data) {
  const rel = window.REL.REL_MAP[data.relation];
  const p = {
    id: uid(),
    name: (data.name || '').trim(),
    relation: data.relation,
    phone: (data.phone || '').trim(),
    city: (data.city || '').trim(),
    notes: (data.notes || '').trim(),
    cadence: Number(data.cadence) || (rel ? rel.cadence : 30),
    occasions: data.occasions || [],
    createdAt: new Date().toISOString(),
    archived: false
  };
  DB.people.push(p);
  save();
  return p;
}

function updatePerson(id, patch) {
  const p = DB.people.find(x => x.id === id);
  if (!p) return null;
  Object.assign(p, patch);
  save();
  return p;
}

function deletePerson(id) {
  DB.people = DB.people.filter(p => p.id !== id);
  DB.events = DB.events.filter(e => e.personId !== id);
  save();
}

const getPerson = id => DB.people.find(p => p.id === id) || null;
const activePeople = () => DB.people.filter(p => !p.archived);

/* ── الأحداث (تسجيل الصلة) ─────────────────────────── */
function addEvent(personId, type, note, at) {
  const ev = {
    id: uid(),
    personId,
    type,
    note: (note || '').trim(),
    at: at || new Date().toISOString()
  };
  DB.events.push(ev);
  rememberEvent(ev);
  save();
  return ev;
}

function deleteEvent(id) {
  DB.events = DB.events.filter(e => e.id !== id);
  save();
}

/* لإلحاق ملاحظة بعد التسجيل — «وش صار؟» تُكتب بعد المكالمة لا قبلها */
function updateEventNote(id, note) {
  const e = DB.events.find(x => x.id === id);
  if (!e) return null;
  e.note = String(note || '').trim();
  save();
  return e;
}

/* ── التراجع ────────────────────────────────────────
   يحتفظ بآخر تسجيل ليُلغى بضغطة، فالخطأ في الشريط السريع
   لا يُصلَّح إلا بفتح صفحة الشخص. */
let lastEvent = null;
const rememberEvent = ev => { lastEvent = { id: ev.id, personId: ev.personId, at: Date.now() }; };
const undoable = () => lastEvent && Date.now() - lastEvent.at < 20000 ? lastEvent : null;
function undoLastEvent() {
  const l = undoable();
  if (!l) return null;
  deleteEvent(l.id);
  lastEvent = null;
  return l;
}

/* ── كشف التكرار ────────────────────────────────────
   المقارنة على الاسم مجرَّدًا من التشكيل والألف واللام والهمزات،
   فـ«عبد الله» و«عبدالله» و«عبداللّه» اسم واحد. */
function normalizeName(s) {
  return String(s || '')
    .replace(/[ً-ْٰ]/g, '')   // تشكيل
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/^ال/, '')
    .replace(/\s+/g, '')
    .trim().toLowerCase();
}

function findDuplicates(name, relation) {
  const n = normalizeName(name);
  if (!n) return [];
  return activePeople().filter(p =>
    normalizeName(p.name) === n && (!relation || p.relation === relation));
}

const eventsOf = id =>
  DB.events.filter(e => e.personId === id).sort((a, b) => new Date(b.at) - new Date(a.at));

/* آخر تواصل فعلي (الدعاء لا يُصفّر العدّاد، لكنه يُسجَّل كحسنة) */
function lastContact(id) {
  const list = DB.events
    .filter(e => e.personId === id && window.REL.ACTION_MAP[e.type]?.resets)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  return list[0] || null;
}

function lastDua(id) {
  const list = DB.events
    .filter(e => e.personId === id && e.type === 'dua')
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  return list[0] || null;
}

/* ── حرارة الصلة ───────────────────────────────────── */
/*  ratio = الأيام منذ آخر تواصل ÷ الدورة المقترحة
    ≤ 0.75  موصول (أخضر)  |  ≤ 1.25 قارب (أصفر)  |  > 1.25 منقطع (أحمر) */
function statusOf(person) {
  const rel = window.REL.REL_MAP[person.relation] || { tier: 3, cadence: 90 };
  const cadence = Math.max(1, Number(person.cadence) || rel.cadence);
  const last = lastContact(person.id);
  const since = last ? new Date(last.at) : new Date(person.createdAt);
  const days = Math.floor((Date.now() - since.getTime()) / DAY);
  const ratio = days / cadence;

  let state, label;
  if (!last) {
    state = days <= cadence ? 'new' : 'cold';
    label = days <= cadence ? 'لم تُسجَّل صلة بعد' : 'لم تصله منذ إضافته';
  } else if (ratio <= 0.75) {
    state = 'warm'; label = 'موصول';
  } else if (ratio <= 1.25) {
    state = 'due'; label = 'قارب موعد الصلة';
  } else {
    state = 'cold'; label = 'يحتاج صلة';
  }

  return { state, label, days, cadence, ratio, last, tier: rel.tier };
}

const STATE_META = {
  warm: { color: '#16a34a', bg: 'rgba(22,163,74,.12)', dot: '🟢', text: 'موصول' },
  due:  { color: '#d97706', bg: 'rgba(217,119,6,.13)', dot: '🟡', text: 'قارب' },
  cold: { color: '#dc2626', bg: 'rgba(220,38,38,.12)', dot: '🔴', text: 'منقطع' },
  new:  { color: '#5b7083', bg: 'rgba(91,112,131,.12)', dot: '⚪', text: 'جديد' }
};

/* أولوية الاقتراح: كل ما زاد التأخير وعلَت درجة الرحم، صعد الترتيب */
function priorityOf(person) {
  const s = statusOf(person);
  const tierWeight = { 1: 3.0, 2: 1.8, 3: 1.0 }[s.tier] || 1;
  const overdue = Math.max(0, s.ratio - 0.75);
  return (overdue + 0.05) * tierWeight;
}

/* التأجيل: قريبٌ مسافرٌ أو متعذّرٌ الوصول إليه يظلّ يُقترح كل يوم بلا فائدة،
   فيُسكَت أسبوعًا دون أن يُحسب موصولًا — حرارته تبقى كما هي. */
const isSnoozed = p => p.snoozeUntil && new Date(p.snoozeUntil) > new Date();

function snooze(personId, days = 7) {
  const p = getPerson(personId);
  if (!p) return null;
  p.snoozeUntil = new Date(Date.now() + days * DAY).toISOString();
  save();
  return p.snoozeUntil;
}

function unsnooze(personId) {
  const p = getPerson(personId);
  if (p) { p.snoozeUntil = null; save(); }
}

/* أصحاب الجفوة لا يظهرون هنا — لهم مسارهم ونبرتهم */
function suggestions(limit = 3) {
  return activePeople()
    .filter(p => !hasRift(p) && !isSnoozed(p))
    .map(p => ({ p, s: statusOf(p), pr: priorityOf(p) }))
    .filter(x => x.s.state !== 'warm')
    .sort((a, b) => b.pr - a.pr)
    .slice(0, limit);
}

/* ── المناسبات ─────────────────────────────────────── */
/* التواريخ تُخزَّن 'MM-DD' (سنوية) — نعيدها مع عدد الأيام المتبقية */
function upcomingOccasions(withinDays = 14) {
  const out = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  activePeople().forEach(p => {
    (p.occasions || []).forEach(oc => {
      if (!oc.date) return;
      const [mm, dd] = oc.date.split('-').map(Number);
      if (!mm || !dd) return;
      let next = new Date(today.getFullYear(), mm - 1, dd);
      if (next < today) next = new Date(today.getFullYear() + 1, mm - 1, dd);
      const inDays = Math.round((next - today) / DAY);
      if (inDays <= withinDays) out.push({ person: p, oc, inDays, date: next });
    });
  });
  return out.sort((a, b) => a.inDays - b.inDays);
}

/* ══ اللقاءات العائلية ══════════════════════════════
   date  : 'YYYY-MM-DD'    time : 'HH:MM' (٢٤ ساعة)
   guests: [personId]      attended: [personId] بعد تسجيل الحضور
   repeat: none | weekly | monthly | quarterly | yearly
   ═════════════════════════════════════════════════ */
const REPEATS = {
  none:      { label: 'لا يتكرر' },
  weekly:    { label: 'كل أسبوع' },
  monthly:   { label: 'كل شهر' },
  quarterly: { label: 'كل ٣ أشهر' },
  yearly:    { label: 'كل سنة' }
};

function addGathering(d) {
  const g = {
    id: uid(),
    title: (d.title || 'لمّة العائلة').trim(),
    date: d.date,
    time: d.time || '',
    place: (d.place || '').trim(),
    guests: d.guests || [],
    attended: null,
    repeat: d.repeat || 'none',
    notes: (d.notes || '').trim(),
    createdAt: new Date().toISOString()
  };
  DB.gatherings.push(g);
  save();
  return g;
}

function updateGathering(id, patch) {
  const g = DB.gatherings.find(x => x.id === id);
  if (!g) return null;
  Object.assign(g, patch);
  save();
  return g;
}

function deleteGathering(id) {
  DB.gatherings = DB.gatherings.filter(g => g.id !== id);
  save();
}

const getGathering = id => DB.gatherings.find(g => g.id === id) || null;

/* عدد الأيام حتى اللقاء: سالب = مضى */
function daysUntil(dateStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = String(dateStr).split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - today) / DAY);
}

/* موعد التكرار التالي بعد تسجيل الحضور */
function nextDate(dateStr, repeat) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (repeat === 'weekly') dt.setDate(dt.getDate() + 7);
  else if (repeat === 'monthly') dt.setMonth(dt.getMonth() + 1);
  else if (repeat === 'quarterly') dt.setMonth(dt.getMonth() + 3);
  else if (repeat === 'yearly') dt.setFullYear(dt.getFullYear() + 1);
  else return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/* اللقاءات القادمة (وما مضى منها ولم يُسجَّل حضوره بعد) */
function upcomingGatherings() {
  return DB.gatherings
    .filter(g => g.attended === null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function pastGatherings() {
  return DB.gatherings
    .filter(g => g.attended !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* اللقاء الذي يستحق الاهتمام الآن: مضى ولم يُسجَّل، أو قادم خلال ٣٠ يومًا */
function activeGathering() {
  const list = upcomingGatherings();
  const due = list.filter(g => daysUntil(g.date) <= 0);
  if (due.length) return due[due.length - 1];
  return list.find(g => daysUntil(g.date) <= 30) || null;
}

/* تسجيل الحضور: زيارة واحدة لكل حاضر — ثم تقديم الموعد إن كان متكررًا */
function recordAttendance(id, attendedIds) {
  const g = getGathering(id);
  if (!g) return null;
  const at = new Date(g.date + 'T' + (g.time || '20:00')).toISOString();
  attendedIds.forEach(pid => {
    if (getPerson(pid)) addEvent(pid, 'visit', 'حضر: ' + g.title, at);
  });
  g.attended = attendedIds;
  const next = nextDate(g.date, g.repeat);
  if (next) {
    addGathering({ title: g.title, date: next, time: g.time, place: g.place,
                   guests: g.guests, repeat: g.repeat, notes: g.notes });
  }
  save();
  return g;
}

/* ══ نيّة الصلح ═════════════════════════════════════
   القطيعة ليست مكالمةً فائتة، فلا تُعامَل معاملتها. مَن بينك وبينه
   جفوة يُرفَع من قائمة «من يستحق صلتك» — لأن صاحبه يعلم — ويُنقَل
   إلى مسارٍ خاص: خطواتٌ صغيرة متدرّجة، وتذكيرٌ أسبوعي لا يومي.
   ═════════════════════════════════════════════════ */
const RIFT_STEPS = [
  { i: 1, icon: '🤲', label: 'دعوتُ له بظهر الغيب', hint: 'أيسر الطريق وأولُه، ولا يعلمه إلا الله.' },
  { i: 2, icon: '🕊️', label: 'ألقيتُ عليه السلام',   hint: 'كلمةٌ واحدة تفتح بابًا.' },
  { i: 3, icon: '💬', label: 'أرسلتُ له رسالة',       hint: 'سطرٌ يسأل عن حاله، بلا عتاب ولا تذكيرٍ بما مضى.' },
  { i: 4, icon: '📞', label: 'كلّمتُه',                hint: 'الصوت أقرب من الحرف.' },
  { i: 5, icon: '🏠', label: 'زرتُه',                  hint: 'وهذه غاية ما يُرجى.' }
];

const WEEK = 7 * DAY;

function hasRift(p) { return !!(p && p.rift && !p.rift.resolved); }
const riftPeople = () => activePeople().filter(hasRift);

function setRift(personId, on, note) {
  const p = getPerson(personId);
  if (!p) return null;
  if (on) {
    p.rift = p.rift && !p.rift.resolved
      ? { ...p.rift, note: note != null ? note : p.rift.note }
      : { since: new Date().toISOString(), note: note || '', step: 0, marks: {}, lastNudge: null, resolved: null };
  } else {
    p.rift = null;
  }
  save();
  return p.rift;
}

/* الخطوة تُسجَّل بتاريخها، ويُسجَّل الدعاء والتواصل في سجل القريب أيضًا */
function markRiftStep(personId, step) {
  const p = getPerson(personId);
  if (!hasRift(p)) return null;
  const now = new Date().toISOString();
  p.rift.marks[step] = now;
  p.rift.step = Math.max(p.rift.step, step);
  if (step === 1) addEvent(p.id, 'dua', 'دعاء نيّة الصلح');
  if (step === 3) addEvent(p.id, 'message', 'أول رسالة بعد الجفوة');
  if (step === 4) addEvent(p.id, 'call', 'أول اتصال بعد الجفوة');
  if (step === 5) addEvent(p.id, 'visit', 'أول زيارة بعد الجفوة');
  save();
  return p.rift;
}

function resolveRift(personId) {
  const p = getPerson(personId);
  if (!hasRift(p)) return null;
  p.rift.resolved = new Date().toISOString();
  save();
  return p;
}

/* التذكير أسبوعي: واحدٌ فقط في المرة، وأطولهم جفوةً أولًا */
function riftNudge() {
  const due = riftPeople().filter(p => {
    const last = p.rift.lastNudge ? new Date(p.rift.lastNudge).getTime() : 0;
    return Date.now() - last > WEEK;
  });
  if (!due.length) return null;
  due.sort((a, b) => new Date(a.rift.since) - new Date(b.rift.since));
  return due[0];
}

function markNudged(personId) {
  const p = getPerson(personId);
  if (hasRift(p)) { p.rift.lastNudge = new Date().toISOString(); save(); }
}

/* ══ المواسم والمعايدة ══════════════════════════════ */

/* الموسم النشط: يدويًا إن اختاره المستخدم، وإلا يُكتشف من التقويم */
function activeSeason() {
  const S = window.SEASON;
  if (!S) return null;
  const mode = DB.settings.seasonMode || 'auto';
  if (mode === 'off') return null;
  if (mode !== 'auto') return S.SEASONS[mode] || null;
  return S.detectSeason(DB.settings.hijriOffset || 0);
}

/* مفتاح يخصّ هذا الموسم في هذه السنة، فتُصفَّر القائمة تلقائيًا كل عام */
function seasonKey(season) {
  const h = window.SEASON?.hijri(new Date(), DB.settings.hijriOffset || 0);
  return `${season.key}-${h ? h.year : new Date().getFullYear()}`;
}

const greetedList = season => DB.greetings[seasonKey(season)] || [];
const hasGreeted = (season, personId) => greetedList(season).includes(personId);

function toggleGreeted(season, personId) {
  const k = seasonKey(season);
  const list = DB.greetings[k] || [];
  DB.greetings[k] = list.includes(personId)
    ? list.filter(id => id !== personId)
    : list.concat([personId]);
  save();
  return DB.greetings[k].includes(personId);
}

/* ترتيب المعايدة: من لم تُعايده أولًا، ثم آكد الأرحام، ثم الأطول انقطاعًا.
   وضع المُعايَدين في ذيل مجموعتهم صراحةً — لولا ذلك لأعاد تسجيلُ المعايدة
   ترتيبَهم فيقفز الصف تحت إصبع المستخدم لحظة الضغط. */
function greetingOrder(season) {
  const done = season ? new Set(greetedList(season)) : new Set();
  return activePeople()
    .map(p => ({ p, s: statusOf(p), done: done.has(p.id) }))
    .sort((a, b) =>
      (a.done - b.done) || (a.s.tier - b.s.tier) || (b.s.ratio - a.s.ratio));
}

/* عدد من وصلتَهم اليوم — لهدف رمضان والعشر */
function reachedToday() {
  const today = new Date().toDateString();
  const ids = DB.events
    .filter(e => new Date(e.at).toDateString() === today && window.REL.ACTION_MAP[e.type]?.resets)
    .map(e => e.personId);
  return new Set(ids).size;
}

/* من دعوتَ لهم اليوم — هدف يوم عرفة */
function duaToday() {
  const today = new Date().toDateString();
  const ids = DB.events
    .filter(e => e.type === 'dua' && new Date(e.at).toDateString() === today)
    .map(e => e.personId);
  return new Set(ids).size;
}

/* ── الحجّاج من الأرحام ─────────────────────────────
   p.hajjYear = السنة الهجرية التي يحجّ فيها. */
function currentHijriYear() {
  const h = window.SEASON?.hijri(new Date(), DB.settings.hijriOffset || 0);
  return h ? h.year : null;
}

function pilgrims() {
  const y = currentHijriYear();
  return activePeople().filter(p => p.hajjYear && p.hajjYear === y);
}

function toggleHajj(personId) {
  const p = getPerson(personId);
  if (!p) return false;
  const y = currentHijriYear();
  p.hajjYear = p.hajjYear === y ? null : y;
  save();
  return p.hajjYear === y;
}

/* بعد يوم النحر يصير الحاجّ عائدًا، فتتبدّل الرسالة من توديع إلى تهنئة */
function hajjPhase() {
  const h = window.SEASON?.hijri(new Date(), DB.settings.hijriOffset || 0);
  if (!h || h.month !== 12) return 'before';
  return h.day >= 10 ? 'after' : 'before';
}

/* ── إحصاءات ───────────────────────────────────────── */
function monthStats() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const evs = DB.events.filter(e => new Date(e.at).getTime() >= start);
  const byType = {};
  window.REL.ACTIONS.forEach(a => (byType[a.key] = 0));
  evs.forEach(e => { if (byType[e.type] !== undefined) byType[e.type]++; });
  const people = activePeople();
  const counts = { warm: 0, due: 0, cold: 0, new: 0 };
  people.forEach(p => counts[statusOf(p).state]++);
  return {
    total: evs.length,
    byType,
    peopleCount: people.length,
    reached: new Set(evs.map(e => e.personId)).size,
    counts
  };
}

function streakDays() {
  const days = new Set(DB.events.map(e => new Date(e.at).toDateString()));
  let n = 0;
  const d = new Date();
  // يُحسب اليوم إن سُجّل فيه شيء، وإلا نبدأ من الأمس
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ── النسخ الاحتياطي ───────────────────────────────── */
function exportJSON() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `صلة-نسخة-${d}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importJSON(text, mode = 'replace') {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.people)) throw new Error('ملف غير صالح');
  if (mode === 'merge') {
    const ids = new Set(DB.people.map(p => p.id));
    data.people.forEach(p => { if (!ids.has(p.id)) DB.people.push(p); });
    const evIds = new Set(DB.events.map(e => e.id));
    (data.events || []).forEach(e => { if (!evIds.has(e.id)) DB.events.push(e); });
  } else {
    DB = Object.assign(structuredClone(DEFAULT_DB), data);
  }
  save();
}

function wipe() {
  DB = structuredClone(DEFAULT_DB);
  DB.settings.started = new Date().toISOString();
  save();
}

window.STORE = {
  get db() { return DB; },
  get persistent() { return storageOK; },
  set onSaveError(fn) { onSaveError = fn; },
  load, save, uid,
  addPerson, updatePerson, deletePerson, getPerson, activePeople,
  addEvent, deleteEvent, updateEventNote, eventsOf, lastContact, lastDua,
  undoable, undoLastEvent, findDuplicates, normalizeName,
  isSnoozed, snooze, unsnooze,
  statusOf, STATE_META, priorityOf, suggestions,
  upcomingOccasions, monthStats, streakDays,
  REPEATS, addGathering, updateGathering, deleteGathering, getGathering,
  daysUntil, upcomingGatherings, pastGatherings, activeGathering, recordAttendance,
  RIFT_STEPS, hasRift, riftPeople, setRift, markRiftStep, resolveRift, riftNudge, markNudged,
  activeSeason, seasonKey, greetedList, hasGreeted, toggleGreeted, greetingOrder,
  reachedToday, duaToday, currentHijriYear, pilgrims, toggleHajj, hajjPhase,
  exportJSON, importJSON, wipe
};
