/* =====================================================================
   صِلة — نظام القرابة
   tier 1 = رحم واجب الصلة بقوة  |  tier 2 = رحم مؤكد  |  tier 3 = رحم موسّع
   level  = الطبقة في الشجرة (-2 أجداد، -1 آباء، 0 أنا، +1 أبناء، +2 أحفاد)
   cadence = دورة الصلة المقترحة بالأيام (المستخدم يقدر يغيّرها لكل شخص)
   ===================================================================== */

const SIDES = {
  father: { label: 'جهة الأب', short: 'من الأب', color: '#0e7a5f' },
  mother: { label: 'جهة الأم', short: 'من الأم', color: '#8a5cf6' },
  self:   { label: 'أسرتي',   short: 'أسرتي', color: '#c9821f' },
  other:  { label: 'قرابة أخرى', short: 'أخرى', color: '#5b7083' }
};

const TIERS = {
  1: { label: 'رحم واجب الصلة', desc: 'الوالدان والأبناء والإخوة والأجداد — آكد الأرحام', color: '#0e7a5f' },
  2: { label: 'رحم مؤكد', desc: 'الأعمام والعمّات والأخوال والخالات وأبناء الإخوة', color: '#c9821f' },
  3: { label: 'رحم موسّع', desc: 'أبناء الأعمام والأخوال ومن بعدهم', color: '#5b7083' }
};

const RELATIONS = [
  /* ── الأصول ─────────────────────────────────────────── */
  { key: 'father',    label: 'الأب',              g: 'm', tier: 1, cadence: 1,  level: -1, side: 'father', order: 1 },
  { key: 'mother',    label: 'الأم',              g: 'f', tier: 1, cadence: 1,  level: -1, side: 'mother', order: 0 },
  { key: 'gf_f',      label: 'الجد (أبو الأب)',   g: 'm', tier: 1, cadence: 7,  level: -2, side: 'father', order: 2 },
  { key: 'gm_f',      label: 'الجدة (أم الأب)',   g: 'f', tier: 1, cadence: 7,  level: -2, side: 'father', order: 3 },
  { key: 'gf_m',      label: 'الجد (أبو الأم)',   g: 'm', tier: 1, cadence: 7,  level: -2, side: 'mother', order: 4 },
  { key: 'gm_m',      label: 'الجدة (أم الأم)',   g: 'f', tier: 1, cadence: 7,  level: -2, side: 'mother', order: 5 },

  /* ── الإخوة ─────────────────────────────────────────── */
  { key: 'brother',   label: 'أخ',                g: 'm', tier: 1, cadence: 7,  level: 0,  side: 'self',   order: 10 },
  { key: 'sister',    label: 'أخت',               g: 'f', tier: 1, cadence: 7,  level: 0,  side: 'self',   order: 11 },

  /* ── الفروع ─────────────────────────────────────────── */
  { key: 'son',       label: 'ابن',               g: 'm', tier: 1, cadence: 1,  level: 1,  side: 'self',   order: 20 },
  { key: 'daughter',  label: 'بنت',               g: 'f', tier: 1, cadence: 1,  level: 1,  side: 'self',   order: 21 },
  { key: 'gson',      label: 'حفيد',              g: 'm', tier: 1, cadence: 14, level: 2,  side: 'self',   order: 22 },
  { key: 'gdaughter', label: 'حفيدة',             g: 'f', tier: 1, cadence: 14, level: 2,  side: 'self',   order: 23 },

  /* ── جهة الأب ───────────────────────────────────────── */
  { key: 'uncle_p',   label: 'عمّ',               g: 'm', tier: 2, cadence: 30, level: -1, side: 'father', order: 30 },
  { key: 'aunt_p',    label: 'عمّة',              g: 'f', tier: 2, cadence: 30, level: -1, side: 'father', order: 31 },
  { key: 'c_uncle_p_m',  label: 'ابن العمّ',      g: 'm', tier: 3, cadence: 90, level: 0,  side: 'father', order: 32 },
  { key: 'c_uncle_p_f',  label: 'بنت العمّ',      g: 'f', tier: 3, cadence: 90, level: 0,  side: 'father', order: 33 },
  { key: 'c_aunt_p_m',   label: 'ابن العمّة',     g: 'm', tier: 3, cadence: 90, level: 0,  side: 'father', order: 34 },
  { key: 'c_aunt_p_f',   label: 'بنت العمّة',     g: 'f', tier: 3, cadence: 90, level: 0,  side: 'father', order: 35 },

  /* ── جهة الأم ───────────────────────────────────────── */
  { key: 'uncle_m',   label: 'خال',               g: 'm', tier: 2, cadence: 30, level: -1, side: 'mother', order: 40 },
  { key: 'aunt_m',    label: 'خالة',              g: 'f', tier: 2, cadence: 30, level: -1, side: 'mother', order: 41 },
  { key: 'c_uncle_m_m',  label: 'ابن الخال',      g: 'm', tier: 3, cadence: 90, level: 0,  side: 'mother', order: 42 },
  { key: 'c_uncle_m_f',  label: 'بنت الخال',      g: 'f', tier: 3, cadence: 90, level: 0,  side: 'mother', order: 43 },
  { key: 'c_aunt_m_m',   label: 'ابن الخالة',     g: 'm', tier: 3, cadence: 90, level: 0,  side: 'mother', order: 44 },
  { key: 'c_aunt_m_f',   label: 'بنت الخالة',     g: 'f', tier: 3, cadence: 90, level: 0,  side: 'mother', order: 45 },

  /* ── أبناء الإخوة ───────────────────────────────────── */
  { key: 'nephew_b',  label: 'ابن الأخ',          g: 'm', tier: 2, cadence: 30, level: 1,  side: 'self',   order: 50 },
  { key: 'niece_b',   label: 'بنت الأخ',          g: 'f', tier: 2, cadence: 30, level: 1,  side: 'self',   order: 51 },
  { key: 'nephew_s',  label: 'ابن الأخت',         g: 'm', tier: 2, cadence: 30, level: 1,  side: 'self',   order: 52 },
  { key: 'niece_s',   label: 'بنت الأخت',         g: 'f', tier: 2, cadence: 30, level: 1,  side: 'self',   order: 53 },

  /* ── الأهل والقرابة الأخرى ──────────────────────────── */
  { key: 'spouse_m',  label: 'زوج',               g: 'm', tier: 1, cadence: 1,  level: 0,  side: 'self',   order: 60, notRahim: true },
  { key: 'spouse_f',  label: 'زوجة',              g: 'f', tier: 1, cadence: 1,  level: 0,  side: 'self',   order: 61, notRahim: true },
  { key: 'inlaw_m',   label: 'قريب بالمصاهرة',    g: 'm', tier: 3, cadence: 90, level: 0,  side: 'other',  order: 70, notRahim: true },
  { key: 'inlaw_f',   label: 'قريبة بالمصاهرة',   g: 'f', tier: 3, cadence: 90, level: 0,  side: 'other',  order: 71, notRahim: true },
  { key: 'other_m',   label: 'قريب (أخرى)',       g: 'm', tier: 3, cadence: 90, level: 0,  side: 'other',  order: 80 },
  { key: 'other_f',   label: 'قريبة (أخرى)',      g: 'f', tier: 3, cadence: 90, level: 0,  side: 'other',  order: 81 }
];

const REL_MAP = Object.fromEntries(RELATIONS.map(r => [r.key, r]));

/* مجموعات الاختيار في نموذج الإضافة */
const REL_PICKER = [
  { title: 'الوالدان والأصول', keys: ['father', 'mother', 'gf_f', 'gm_f', 'gf_m', 'gm_m'] },
  { title: 'الإخوة والأبناء',  keys: ['brother', 'sister', 'son', 'daughter', 'gson', 'gdaughter', 'spouse_m', 'spouse_f'] },
  { title: 'جهة الأب',          keys: ['uncle_p', 'aunt_p', 'c_uncle_p_m', 'c_uncle_p_f', 'c_aunt_p_m', 'c_aunt_p_f'] },
  { title: 'جهة الأم',          keys: ['uncle_m', 'aunt_m', 'c_uncle_m_m', 'c_uncle_m_f', 'c_aunt_m_m', 'c_aunt_m_f'] },
  { title: 'أبناء الإخوة',      keys: ['nephew_b', 'niece_b', 'nephew_s', 'niece_s'] },
  { title: 'قرابة أخرى',        keys: ['inlaw_m', 'inlaw_f', 'other_m', 'other_f'] }
];

/* أنواع الصلة القابلة للتسجيل */
const ACTIONS = [
  { key: 'visit',   label: 'زيارة',  icon: '🏠', resets: true  },
  { key: 'call',    label: 'اتصال',  icon: '📞', resets: true  },
  { key: 'message', label: 'رسالة',  icon: '💬', resets: true  },
  { key: 'gift',    label: 'هديّة',  icon: '🎁', resets: true  },
  { key: 'dua',     label: 'دعاء',   icon: '🤲', resets: false }
];
const ACTION_MAP = Object.fromEntries(ACTIONS.map(a => [a.key, a]));

const OCCASION_KINDS = [
  { key: 'birth',   label: 'ميلاد',      icon: '🎂', note: 'تهنئة' },
  { key: 'wedding', label: 'زواج',       icon: '💍', note: 'مباركة' },
  { key: 'death',   label: 'ذكرى وفاة',  icon: '🤲', note: 'دعاء وترحّم' },
  { key: 'other',   label: 'مناسبة',     icon: '⭐', note: 'تواصل' }
];
const OCCASION_MAP = Object.fromEntries(OCCASION_KINDS.map(o => [o.key, o]));

window.REL = { SIDES, TIERS, RELATIONS, REL_MAP, REL_PICKER, ACTIONS, ACTION_MAP, OCCASION_KINDS, OCCASION_MAP };
