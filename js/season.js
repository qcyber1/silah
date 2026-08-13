/* =====================================================================
   صِلة — المواسم (رمضان والعيد)
   يُكتشف الموسم من التقويم الهجري تلقائيًا، ويمكن تجاوزه يدويًا للمعاينة.
   ===================================================================== */

/* التاريخ الهجري (أم القرى). قد يختلف يومًا عن الرؤية المحلية — لذلك
   يستطيع المستخدم تعديل الإزاحة من الإعدادات. */
function hijri(date = new Date(), offsetDays = 0) {
  const d = new Date(date.getTime() + offsetDays * 86400000);
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'numeric', year: 'numeric'
    }).formatToParts(d);
    const get = t => Number(parts.find(p => p.type === t)?.value);
    const day = get('day'), month = get('month'), year = get('year');
    if (!day || !month || !year) return null;
    return { day, month, year };
  } catch (e) {
    return null;   /* متصفح لا يدعم التقويم الهجري */
  }
}

const HIJRI_MONTHS = ['محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'];

/* عدد الأيام الميلادية حتى يوم هجري قادم — تقدير كافٍ للعدّ التنازلي */
function daysUntilHijri(targetMonth, targetDay, offsetDays = 0) {
  for (let i = 0; i <= 400; i++) {
    const h = hijri(new Date(Date.now() + i * 86400000), offsetDays);
    if (h && h.month === targetMonth && h.day === targetDay) return i;
  }
  return null;
}

/* ── تعريف المواسم ───────────────────────────────── */
const SEASONS = {
  ramadan: {
    key: 'ramadan',
    label: 'رمضان',
    icon: '🌙',
    title: 'رمضان — موسم الصلة',
    blurb: 'شهرٌ تُضاعَف فيه الحسنات، وأقرب ما يكون القلب للين. اجعل لأرحامك نصيبًا من ليلك ونهارك.',
    accent: '#c9a227',
    grad: ['#1c2a52', '#101a33'],
    goal: 3,
    goalText: 'صِل ٣ من أرحامك اليوم'
  },
  ramadan_last10: {
    key: 'ramadan_last10',
    label: 'العشر الأواخر',
    icon: '✨',
    title: 'العشر الأواخر',
    blurb: 'أفضل ليالي العام. لا تدع رحمًا مقطوعًا يحجب عنك القبول — وصْلة اليوم أرجى من كل ليلة.',
    accent: '#e0b64a',
    grad: ['#241a4a', '#140f2c'],
    goal: 5,
    goalText: 'صِل ٥ من أرحامك اليوم'
  },
  ashr: {
    key: 'ashr',
    label: 'عشر ذي الحجة',
    icon: '🕋',
    title: 'العشر من ذي الحجة',
    blurb: 'أفضل أيام الدنيا؛ «ما مِن أيّامٍ العملُ الصالحُ فيهنّ أحبُّ إلى اللهِ من هذه الأيّامِ العشر» — وصِلةُ الرحمِ من أحبِّ العمل.',
    accent: '#e8b155',
    grad: ['#5a3c18', '#2d1d0a'],
    goal: 3,
    goalText: 'صِل ٣ من أرحامك اليوم',
    hajj: true
  },
  arafah: {
    key: 'arafah',
    label: 'يوم عرفة',
    icon: '🤍',
    title: 'يوم عرفة',
    blurb: 'ما من يومٍ يُعتِقُ اللهُ فيه من النارِ أكثرَ من يومِ عرفة. اجعل لأرحامك نصيبًا من دعائك — وابدأ بمن بينك وبينه جفوة.',
    accent: '#f2dda6',
    grad: ['#1d4034', '#0c211b'],
    goal: 5,
    goalText: 'ادعُ لخمسةٍ من أرحامك',
    countDua: true,
    hajj: true
  },
  eid_fitr: {
    key: 'eid_fitr',
    label: 'عيد الفطر',
    icon: '🎉',
    title: 'عيد الفطر المبارك',
    blurb: 'يوم المعايدة. رتّبنا لك أرحامك بالأولوية — عايِد ولا تنسَ أحدًا.',
    /* ذهب فاتح: يمرّ 3.47:1 على أخضر العيد — الأدكن كان يذوب في الخلفية */
    accent: '#f0b451',
    grad: ['#1a6b52', '#0d4536'],
    greeting: true
  },
  eid_adha: {
    key: 'eid_adha',
    label: 'عيد الأضحى',
    icon: '🎉',
    title: 'عيد الأضحى المبارك',
    blurb: 'أيام أكل وشرب وذكر لله. عايِد أرحامك وأدخل السرور عليهم.',
    /* ذهب فاتح: يمرّ 3.47:1 على أخضر العيد — الأدكن كان يذوب في الخلفية */
    accent: '#f0b451',
    grad: ['#1a6b52', '#0d4536'],
    greeting: true,
    hajj: true
  }
};

/* الموسم الحالي حسب التاريخ الهجري */
function detectSeason(offsetDays = 0) {
  const h = hijri(new Date(), offsetDays);
  if (!h) return null;
  if (h.month === 9) return h.day >= 21 ? SEASONS.ramadan_last10 : SEASONS.ramadan;
  if (h.month === 10 && h.day <= 4) return SEASONS.eid_fitr;
  if (h.month === 12) {
    if (h.day <= 8) return SEASONS.ashr;
    if (h.day === 9) return SEASONS.arafah;
    if (h.day <= 13) return SEASONS.eid_adha;
  }
  return null;
}

/* رسائل جاهزة */
function eidMessage(name, season) {
  const feast = season && season.key === 'eid_adha' ? 'أضحى' : 'عيد';
  return [
    `${name ? esc0(name) + '،' : ''} ${feast} مبارك 🌙`,
    '',
    'تقبّل الله منا ومنكم صالح الأعمال،',
    'وكل عام وأنتم إلى الله أقرب.',
    '',
    'ما نساكم من دعوة بظهر الغيب 🤍'
  ].filter(Boolean).join('\n');
}

function ramadanMessage(name) {
  return [
    `${name ? esc0(name) + '،' : ''} رمضان مبارك 🌙`,
    '',
    'بلّغنا الله وإياكم صيامه وقيامه،',
    'وجعلنا وإياكم من عتقائه من النار.',
    '',
    'لا تنسونا من دعائكم 🤍'
  ].filter(Boolean).join('\n');
}

/* تهنئة قبل السفر للحج */
function hajjSendoffMessage(name) {
  return [
    `${name ? esc0(name) + '،' : ''} تقبّل الله منك 🕋`,
    '',
    'بلّغك الله البيت سالمًا، ورزقك حجًّا مبرورًا وسعيًا مشكورًا وذنبًا مغفورًا.',
    '',
    'لا تنسانا من دعائك في المشاعر 🤍'
  ].filter(Boolean).join('\n');
}

/* تهنئة بعد العودة */
function hajjReturnMessage(name) {
  return [
    `${name ? esc0(name) + '،' : ''} الحمد لله على السلامة 🤍`,
    '',
    'تقبّل الله حجّك، وغفر ذنبك، وردّك إلى أهلك سالمًا غانمًا.',
    '',
    'اشتقنا لك، ومتى نراك؟'
  ].filter(Boolean).join('\n');
}

const esc0 = s => String(s == null ? '' : s);

window.SEASON = {
  hijri, HIJRI_MONTHS, daysUntilHijri, SEASONS, detectSeason,
  eidMessage, ramadanMessage, hajjSendoffMessage, hajjReturnMessage
};
