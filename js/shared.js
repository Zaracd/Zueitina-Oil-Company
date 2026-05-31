/* ============================================================
   SHARED.JS — Zueitina Oil Company
   Runs on EVERY page. Handles:
     1. Dark / Light theme toggle  (localStorage persisted)
     2. Language switcher AR ↔ EN  (localStorage persisted)
     3. Toast notification utility
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. DARK MODE
   ───────────────────────────────────────────────────────────── */

/**
 * Apply the stored theme on page load (before paint to avoid flash).
 * Called immediately so the class is set before the browser renders.
 */
(function applyStoredTheme() {
  const stored = localStorage.getItem('zoc-theme') || 'light';
  if (stored === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

/**
 * Wire up all .theme-toggle buttons on the page.
 * Multiple buttons (header + mobile) are all kept in sync.
 */
function initThemeToggle() {
  const btns = document.querySelectorAll('.theme-toggle');
  if (!btns.length) return;

  // Sync button aria-label to current state
  const sync = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btns.forEach(b => {
      b.setAttribute('aria-label', isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
      b.title = isDark ? 'Light mode' : 'Dark mode';
    });
  };

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next   = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('zoc-theme', next);
      sync();
      showToast(next === 'dark' ? '🌙 الوضع الداكن مفعّل' : '☀️ الوضع الفاتح مفعّل');
    });
  });
  sync();
}


/* ─────────────────────────────────────────────────────────────
   2. LANGUAGE SWITCHER (AR ↔ EN)

   Approach: every element that needs translation carries two
   data attributes:
     data-ar="النص العربي"
     data-en="English text"

   On toggle, we walk all such elements and swap .textContent.
   The <html> lang + dir attributes are also updated.
   ───────────────────────────────────────────────────────────── */

const TRANSLATIONS = {
  /* ── Navigation ── */
  'nav-about':      { ar: 'من نحن',         en: 'About Us' },
  'nav-operations': { ar: 'العمليات',        en: 'Operations' },
  'nav-market':     { ar: 'أسعار النفط',     en: 'Oil Prices' },
  'nav-news':       { ar: 'الأخبار',         en: 'News' },
  'nav-services':   { ar: 'الخدمات',         en: 'Services' },
  'nav-login':      { ar: 'تسجيل الدخول',    en: 'Login' },
  'nav-contact':    { ar: 'اتصل بنا',        en: 'Contact' },
  /* ── Hero ── */
  'hero-eyebrow':   { ar: 'Zueitina Oil Company', en: 'Zueitina Oil Company' },
  'hero-h1':        {
    ar: 'طاقة ليبية بخبرة تشغيلية تمتد من الحقول إلى ميناء الزويتينة.',
    en: 'Libyan energy with operational expertise spanning from the fields to Zueitina Port.'
  },
  'hero-p':         {
    ar: 'تدير الشركة عمليات إنتاج وتصدير النفط الخام والغاز عبر منظومة تشغيلية تمتد من الحقول إلى الميناء، مع التركيز على السلامة واستقرار الإمدادات وخدمة الاقتصاد الوطني.',
    en: 'Zueitina Oil Company operates crude oil and gas production and export activities through an integrated system that connects the fields with the port, with a focus on safety, reliable supply, and supporting the national economy.'
  },
  'hero-btn-news':  { ar: 'آخر الأخبار', en: 'Latest News' },
  'hero-btn-svc':   { ar: 'الخدمات',    en: 'Services' },
  /* ── About ── */
  'about-eyebrow':  { ar: 'من نحن',       en: 'About Us' },
  'about-h2':       { ar: 'شركة ليبية متخصصة في إنتاج وتصدير النفط الخام والغاز.', en: 'A Libyan company specialising in crude oil and gas production and export.' },
  'about-p':        { ar: 'تأسست شركة الزويتينة للنفط سنة 1986، وتدير أنشطة إنتاج الخام والمكثفات، وتشغيل ميناء الزويتينة، وتوفير الغاز المسال للسوق المحلي عبر منظومة تشغيلية تضم الحقول والميناء ومرافق الطاقة والتحلية.', en: 'Founded in 1986, Zueitina Oil Company manages crude and condensate production, operates Zueitina Port, and supplies LPG to the domestic market through a comprehensive operational system covering fields, port, power, and desalination facilities.' },
  /* ── Stats ── */
  'stat-1-label': { ar: 'برميل يوميا إنتاج الشركة',           en: 'barrels per day production' },
  'stat-2-label': { ar: 'متوسط الطاقة بالحقول والميناء',      en: 'avg. power at fields & port' },
  'stat-3-label': { ar: 'متر مكعب يوميا من مياه التحلية',     en: 'm³/day desalination output' },
  'stat-4-label': { ar: 'تقريبا من صادرات ليبيا عبر الميناء', en: 'of Libya\'s exports via port' },
  /* ── Operations ── */
  'ops-eyebrow':    { ar: 'العمليات والمواقع',     en: 'Operations & Sites' },
  'ops-h2':         { ar: 'من الحقول إلى ميناء الزويتينة النفطي.', en: 'From the fields to Zueitina Oil Port.' },
  'new-text':       { ar: ' يقع ميناء الزويتينة على خليج سرت، ويستخدم لتصدير الخام والغاز المسال. وتصل طاقة تخزين الخام إلى حوالي 4.0 مليون برميل إضافة إلى مرافق النفتا والبوتان والبروبان.',                en: ' The port of Zueitina is located on the Gulf of Sirte and is used for the export of crude oil and liquefied natural gas. It has a crude oil storage capacity of approximately 4.0 million barrels, as well as facilities for naphtha, butane and propane.' },
  
  /* ── News (home widget) ── */
  'news-eyebrow':   { ar: 'الأخبار',              en: 'News' },
  'news-h2':        { ar: 'أخبار شهر مايو 2026.', en: 'May 2026 News.' },
  'news-more-btn':  { ar: 'استعرض جميع الأخبار',  en: 'Browse all news' },
  /* ── Market ── */
  'ticker-label':   { ar: 'تحديث السوق العالمي', en: 'Global Oil Market Update' },
  'market-eyebrow': { ar: 'أسعار النفط', en: 'Oil Prices' },
  'market-h2':      { ar: 'متابعة مؤشرات الخام في السوق العالمية.', en: 'Global crude market indicators at a glance.' },
  'market-p':       { ar: 'تعرض هذه اللوحة أسعاراً إرشادية للخام لمساعدة الزائر على قراءة اتجاهات السوق ومقارنتها بخام Zueitina Blend.', en: 'This board presents indicative crude prices to help visitors follow market trends and compare them with Zueitina Blend.' },
  'market-zw-small': { ar: 'سعر إرشادي للتحديث', en: 'Indicative price feed' },
  /* ── Footer ── */
  'footer-links-h': { ar: 'روابط', en: 'Links' },
  'footer-contact-h': { ar: 'تواصل معنا', en: 'Contact Us' },
};

let currentLang = localStorage.getItem('zoc-lang') || 'ar';

/**
 * Apply the given language to all translatable elements.
 * @param {string} lang 'ar' | 'en'
 */
function applyLanguage(lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir  = lang === 'ar' ? 'rtl' : 'ltr';

  // Elements with data-i18n key
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
      el.textContent = TRANSLATIONS[key][lang];
    }
  });

  // Elements with inline data-ar / data-en attributes
  document.querySelectorAll('[data-ar]').forEach(el => {
    const text = lang === 'ar' ? el.dataset.ar : el.dataset.en;
    if (text !== undefined) el.textContent = text;
  });

  // Inputs / textareas with translated placeholders
  document.querySelectorAll('[data-placeholder-ar]').forEach(el => {
    const text = lang === 'ar' ? el.dataset.placeholderAr : el.dataset.placeholderEn;
    if (text !== undefined) el.setAttribute('placeholder', text);
  });

  // Update all lang-toggle button labels
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent    = lang === 'ar' ? 'EN' : 'عربي';
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
  });

  currentLang = lang;
  localStorage.setItem('zoc-lang', lang);
}

/**
 * Wire up all .lang-toggle buttons.
 */
function initLangToggle() {
  // Apply stored language immediately
  applyLanguage(currentLang);

  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(next);
      showToast(next === 'en' ? '🌐 Switched to English' : '🌐 تم التبديل إلى العربية');
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   3. TOAST NOTIFICATION
   ───────────────────────────────────────────────────────────── */

let toastTimer = null;

/**
 * Show a brief toast notification.
 * @param {string} msg    Message to display
 * @param {number} duration  Auto-dismiss after ms (default 2600)
 */
function showToast(msg, duration = 2600) {
  let toast = document.getElementById('zoc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zoc-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}


/* ─────────────────────────────────────────────────────────────
   4. SHARED NEWS DATA
   Used by both index.html (widget) and news.html (full page)
   ───────────────────────────────────────────────────────────── */

const NEWS_DATA = [
  {
    id: 1,
    date:     '2026-05-07',
    dateAr:   'الخميس، 07 مايو 2026',
    dateEn:   'Thursday, May 7, 2026',
    category: 'operations',
    catAr:    'العمليات',
    catEn:    'Operations',
    titleAr:  'صيانة مضخة مياه البحر بميناء الزويتينة النفطي لتعزيز استقرار عمليات معمل الغاز.',
    titleEn:  'Maintenance of seawater pump at Zueitina Oil Port to enhance gas plant stability.',
    summaryAr:'أجرت الشركة أعمال صيانة شاملة لمضخة مياه البحر الرئيسية في الميناء، ضمن متابعة جاهزية مرافق الغاز والتشغيل.',
    summaryEn:'The company carried out maintenance on the main seawater pump at the port as part of gas plant operational readiness.',
    image:    'https://www.zueitina.com.ly/images/zueitina/gallery/IMG_6404_13.jpg',
    url:      'https://www.zueitina.com.ly/ar/',
  },
  {
    id: 2,
    date:     '2026-05-07',
    dateAr:   'الخميس، 07 مايو 2026',
    dateEn:   'Thursday, May 7, 2026',
    category: 'corporate',
    catAr:    'الشركة',
    catEn:    'Corporate',
    titleAr:  'رئيس المؤسسة الوطنية للنفط يشيد بنجاح شركة الزويتينة في مضاعفة إنتاجها.',
    titleEn:  'NOC chairman praises Zueitina Oil Company for successfully doubling its production.',
    summaryAr:'خبر رئيسي من الصفحة الرئيسية يبرز الإنجازات التشغيلية للشركة خلال الفترة الأخيرة.',
    summaryEn:'A main homepage item highlighting the company’s recent operational achievements.',
    image:    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=80',
    url:      'https://www.zueitina.com.ly/ar/',
  },
  {
    id: 3,
    date:     '2026-05-05',
    dateAr:   'الثلاثاء، 05 مايو 2026',
    dateEn:   'Tuesday, May 5, 2026',
    category: 'hse',
    catAr:    'الصحة والسلامة',
    catEn:    'HSE',
    titleAr:  'لرفع الجاهزية الطبية.. ورشة عمل حول الإنعاش القلبي CPR بمواقع الشركة.',
    titleEn:  'To raise medical readiness: CPR workshop held at company sites.',
    summaryAr:'ورشة تدريبية في الإسعافات الأولية والإنعاش القلبي ضمن برامج الصحة والسلامة.',
    summaryEn:'A first aid and CPR training workshop as part of health and safety readiness programmes.',
    image:    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=900&q=80',
    url:      'https://www.zueitina.com.ly/ar/',
  },
  {
    id: 4,
    date:     '2026-05-05',
    dateAr:   'الثلاثاء، 05 مايو 2026',
    dateEn:   'Tuesday, May 5, 2026',
    category: 'corporate',
    catAr:    'الشركة',
    catEn:    'Corporate',
    titleAr:  'تعزيز الإنتاج وتطوير الكوادر الفنية في صدارة الاجتماع الدوري الشهري للشركة.',
    titleEn:  'Boosting production and developing technical staff tops the company monthly meeting.',
    summaryAr:'ناقش الاجتماع الشهري خطط تعزيز الإنتاج وبرامج تطوير الكوادر الفنية داخل الشركة.',
    summaryEn:'The monthly meeting discussed production enhancement plans and technical staff development.',
    image:    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
    url:      'https://www.zueitina.com.ly/ar/',
  },
  {
    id: 5,
    date:     '2026-03-02',
    dateAr:   'الاثنين، 02 مارس 2026',
    dateEn:   'Monday, March 2, 2026',
    category: 'projects',
    catAr:    'المشاريع',
    catEn:    'Projects',
    titleAr:  'مشروع نظام توزيع الطاقة لمنطقة EPSA (NC74).',
    titleEn:  'Power Distribution System for EPSA (NC74) Area.',
    summaryAr:'إعلان تأهيل لمشروع ترميم وترقية نظام توزيع كهرباء 34.5kV وربط الحقول بشبكة مستقرة، مع حلول طاقة شمسية للمخيمات السكنية.',
    summaryEn:'A prequalification notice for restoring and upgrading the 34.5kV power distribution system and adding solar PV solutions for residential camps.',
    image:    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=80',
    url:      'https://www.zueitina.com.ly/en/item/516-power-distribution-system-for-epsa-nc74-area',
  },
  {
    id: 6,
    date:     '2026-02-02',
    dateAr:   'الاثنين، 02 فبراير 2026',
    dateEn:   'Monday, February 2, 2026',
    category: 'projects',
    catAr:    'المشاريع',
    catEn:    'Projects',
    titleAr:  'استعادة مرافق تخزين خام فضة Fidda.',
    titleEn:  'Restoration of Fidda Crude Oil Storage Facility.',
    summaryAr:'يشمل نطاق المشروع استبدال خزاني تخزين خام ثابتين D-105 وD-107 وأعمال تنظيف وهدم وإصلاح مدنية وميكانيكية وكهربائية واختبارات تشغيل.',
    summaryEn:'The scope covers replacing fixed-roof crude tanks D-105 and D-107, cleaning, demolition, civil, mechanical, electrical and commissioning works.',
    image:    'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&w=900&q=80',
    url:      'https://www.zueitina.com.ly/en/item/508-restoration-of-fidda-crude-oil-storage-facility',
  },
  {
    id: 7,
    date:     '2025-09-03',
    dateAr:   'الأربعاء، 03 سبتمبر 2025',
    dateEn:   'Wednesday, September 3, 2025',
    category: 'operations',
    catAr:    'العمليات',
    catEn:    'Operations',
    titleAr:  'زيارة ميدانية للحقول والموانئ التي تشغلها شركة الزويتينة.',
    titleEn:  'Field visit to oil fields and ports operated by Zueitina Oil Company.',
    summaryAr:'زيارة ميدانية لمتابعة سير العمل والوقوف على الظروف التشغيلية والفنية والإدارية في الحقول والموانئ.',
    summaryEn:'A field visit to monitor workflows and review operational, technical and administrative conditions across fields and ports.',
    image: 'https://ar.libyaobserver.ly/sites/default/files/styles/wide/public/2025-12/%D8%A7%D9%84%D8%AD%D9%82%D9%84%20103.jpg?itok=IqSbeHqu' ,
    url:      'https://www.zueitina.com.ly/en/item/476-field-visit-by-the-chairman-and-members-of-the-operator-management-committee-to-the-oil-fields-and-ports-operated-by-zueitina-oil-company',
  },
  {
    id: 8,
    date:     '2025-07-09',
    dateAr:   'الأربعاء، 09 يوليو 2025',
    dateEn:   'Wednesday, July 9, 2025',
    category: 'tenders',
    catAr:    'العطاءات',
    catEn:    'Tenders',
    titleAr:  'دعوة للتأهيل المبدئي للشركات المتخصصة في النظافة العامة.',
    titleEn:  'Invitation for preliminary qualification for companies specialized in public cleaning.',
    summaryAr:'إعلان تأهيل لشركات متخصصة في مجال النظافة العامة ضمن متطلبات الخدمات التشغيلية.',
    summaryEn:'Prequalification announcement for companies specialized in public cleaning services.',
    image:    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    url:      'https://www.zueitina.com.ly/en/item/461-invitation-for-preliminary-qualification-for-companies-specialized-in-the-field-of-public-cleaning',
  }
];

/* Expose globally */
window.ZOC = window.ZOC || {};
window.ZOC.NEWS_DATA    = NEWS_DATA;
window.ZOC.currentLang  = () => currentLang;
window.ZOC.applyLanguage = applyLanguage;
window.ZOC.showToast    = showToast;
window.ZOC.TRANSLATIONS = TRANSLATIONS;


/* ─────────────────────────────────────────────────────────────
   5. BOOKMARKS  (shared across pages via localStorage)
   ───────────────────────────────────────────────────────────── */

function getBookmarks() {
  try { return JSON.parse(localStorage.getItem('zoc-bookmarks') || '[]'); }
  catch { return []; }
}
function saveBookmarks(arr) {
  localStorage.setItem('zoc-bookmarks', JSON.stringify(arr));
}
function isBookmarked(id) { return getBookmarks().includes(id); }
function toggleBookmark(id) {
  let bm = getBookmarks();
  if (bm.includes(id)) { bm = bm.filter(x => x !== id); }
  else                  { bm.push(id); }
  saveBookmarks(bm);
  return bm.includes(id);
}

window.ZOC.getBookmarks  = getBookmarks;
window.ZOC.saveBookmarks = saveBookmarks;
window.ZOC.isBookmarked  = isBookmarked;
window.ZOC.toggleBookmark = toggleBookmark;


/* ─────────────────────────────────────────────────────────────
   6. DOM READY — init shared features
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initLangToggle();
});
