/* ============================================================
   NEWS.JS — Zueitina Oil Company
   Full news page functionality:
     1. Render news cards from shared data
     2. Live search
     3. Category filter buttons
     4. Sort (newest / oldest)
     5. Bookmark toggle + bookmarks panel
     6. Comments (add / delete, stored in localStorage)
   ============================================================ */

'use strict';

/* ── Wait for shared.js to be ready ── */
document.addEventListener('DOMContentLoaded', () => {

  const { NEWS_DATA, currentLang, isBookmarked, toggleBookmark,
          getBookmarks, showToast } = window.ZOC;

  /* ── DOM refs ─────────────────────────────────────────────── */
  const searchInput   = document.getElementById('news-search');
  const filterBtns    = document.querySelectorAll('.filter-btn');
  const sortSelect    = document.getElementById('news-sort');
  const newsGrid      = document.getElementById('news-grid');
  const resultsCount  = document.getElementById('results-count');
  const bkPanel       = document.getElementById('bookmarks-panel');
  const bkList        = document.getElementById('bookmarks-list');
  const bkBadge       = document.getElementById('bk-badge');
  const commentForm   = document.getElementById('comment-form');
  const commentsList  = document.getElementById('comments-list');

  /* ── State ─────────────────────────────────────────────────── */
  let activeFilter = 'all';
  let activeSort   = 'newest';
  let searchQuery  = '';

  /* ─────────────────────────────────────────────────────────────
     RENDER CARDS
     ───────────────────────────────────────────────────────────── */
  function renderCards() {
    const lang = currentLang();

    /* 1. Filter by category */
    let list = NEWS_DATA.filter(item =>
      activeFilter === 'all' ? true : item.category === activeFilter
    );

    /* 2. Filter by search query */
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(item =>
        item.titleAr.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.summaryAr.toLowerCase().includes(q) ||
        item.summaryEn.toLowerCase().includes(q)
      );
    }

    /* 3. Sort */
    list = [...list].sort((a, b) =>
      activeSort === 'newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

    /* 4. Results count */
    if (resultsCount) {
      resultsCount.textContent = lang === 'ar'
        ? `${list.length} نتيجة`
        : `${list.length} result${list.length !== 1 ? 's' : ''}`;
    }

    /* 5. Render */
    if (!list.length) {
      newsGrid.innerHTML = `
        <div class="no-results" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
          </svg>
          <p>${lang === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching results.'}</p>
        </div>`;
      return;
    }

    newsGrid.innerHTML = list.map(item => cardHTML(item, lang)).join('');

    /* 6. Wire bookmark buttons */
    newsGrid.querySelectorAll('.card-bookmark').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = Number(btn.dataset.id);
        const now = toggleBookmark(id);
        btn.classList.toggle('active', now);
        btn.setAttribute('aria-pressed', String(now));
        showToast(now
          ? (lang === 'ar' ? '🔖 تمت الإضافة إلى المفضلة' : '🔖 Bookmarked')
          : (lang === 'ar' ? '🗑️ تمت الإزالة من المفضلة' : '🗑️ Removed from bookmarks')
        );
        renderBookmarksPanel();
      });
    });
  }

  /* ── Build a single card's HTML ──────────────────────────── */
  function cardHTML(item, lang) {
    const bm      = isBookmarked(item.id);
    const title   = lang === 'ar' ? item.titleAr   : item.titleEn;
    const summary = lang === 'ar' ? item.summaryAr  : item.summaryEn;
    const cat     = lang === 'ar' ? item.catAr      : item.catEn;
    const date    = lang === 'ar' ? item.dateAr     : item.dateEn;
    const readMore = lang === 'ar' ? 'اقرأ المزيد' : 'Read more';
    const bmLabel  = bm
      ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove bookmark')
      : (lang === 'ar' ? 'إضافة للمفضلة'    : 'Add bookmark');

    return `
    <article class="news-full-card" data-id="${item.id}">
      <div class="card-thumb">
        <img src="${item.image}" alt="${title}" loading="lazy">
        <span class="card-category">${cat}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <time datetime="${item.date}">${date}</time>
        </div>
        <h3>${title}</h3>
        <p>${summary}</p>
        <div class="card-footer">
          <a href="${item.url}" target="_blank" rel="noreferrer">${readMore} ←</a>
          <button class="card-bookmark ${bm ? 'active' : ''}"
                  data-id="${item.id}"
                  aria-label="${bmLabel}"
                  aria-pressed="${bm}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="${bm ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z"/>
            </svg>
          </button>
        </div>
      </div>
    </article>`;
  }

  /* ─────────────────────────────────────────────────────────────
     BOOKMARKS PANEL
     ───────────────────────────────────────────────────────────── */
  function renderBookmarksPanel() {
    const lang = currentLang();
    const ids  = getBookmarks();
    const items = NEWS_DATA.filter(n => ids.includes(n.id));

    if (!bkPanel || !bkList || !bkBadge) return;
    bkBadge.textContent = ids.length;
    bkPanel.hidden = ids.length === 0;

    if (!items.length) {
      bkList.innerHTML = `<p class="bookmarks-empty">${
        lang === 'ar' ? 'لا توجد مفضلات بعد.' : 'No bookmarks yet.'
      }</p>`;
      return;
    }

    bkList.innerHTML = items.map(item => `
      <div class="bookmark-item" data-id="${item.id}">
        <span>${lang === 'ar' ? item.titleAr : item.titleEn}</span>
        <time datetime="${item.date}">${lang === 'ar' ? item.dateAr : item.dateEn}</time>
        <button class="remove-bookmark" data-id="${item.id}"
                aria-label="${lang === 'ar' ? 'إزالة' : 'Remove'}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>`).join('');

    /* Wire remove buttons */
    bkList.querySelectorAll('.remove-bookmark').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        toggleBookmark(id); // removes it
        renderCards();
        renderBookmarksPanel();
        showToast(lang === 'ar' ? '🗑️ تمت الإزالة' : '🗑️ Removed');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     COMMENTS  (persisted in localStorage as array of objects)
     ───────────────────────────────────────────────────────────── */
  function getComments() {
    try { return JSON.parse(localStorage.getItem('zoc-comments') || '[]'); }
    catch { return []; }
  }
  function saveComments(arr) {
    localStorage.setItem('zoc-comments', JSON.stringify(arr));
  }

  function renderComments() {
    const lang     = currentLang();
    const comments = getComments();
    if (!commentsList) return;
    if (!comments.length) {
      commentsList.innerHTML = `<p style="color:var(--text-muted)">${
        lang === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلّق!' : 'No comments yet. Be the first!'
      }</p>`;
      return;
    }
    commentsList.innerHTML = comments.map((c, i) => `
      <div class="comment-item" data-index="${i}">
        <div class="comment-header">
          <span class="comment-author">${escapeHTML(c.author)}</span>
          <span class="comment-date">${c.date}</span>
          <button class="delete-comment" data-index="${i}"
                  aria-label="${lang === 'ar' ? 'حذف التعليق' : 'Delete comment'}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3"/>
            </svg>
          </button>
        </div>
        <p class="comment-text">${escapeHTML(c.text)}</p>
      </div>`).join('');

    /* Wire delete buttons */
    commentsList.querySelectorAll('.delete-comment').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const all = getComments();
        all.splice(idx, 1);
        saveComments(all);
        renderComments();
        showToast(currentLang() === 'ar' ? '🗑️ تم حذف التعليق' : '🗑️ Comment deleted');
      });
    });
  }

  /* Comment form submit */
  if (commentForm) {
    commentForm.addEventListener('submit', e => {
      e.preventDefault();
      const lang       = currentLang();
      const authorInput = commentForm.querySelector('#comment-author');
      const textInput   = commentForm.querySelector('#comment-text');
      const author = authorInput.value.trim();
      const text   = textInput.value.trim();
      if (!author || !text) {
        showToast(lang === 'ar' ? '⚠️ يرجى ملء جميع الحقول' : '⚠️ Please fill all fields');
        return;
      }
      const all = getComments();
      all.unshift({
        author,
        text,
        date: new Date().toLocaleDateString(
          lang === 'ar' ? 'ar-LY' : 'en-GB',
          { year: 'numeric', month: 'long', day: 'numeric' }
        )
      });
      saveComments(all);
      authorInput.value = '';
      textInput.value   = '';
      renderComments();
      showToast(lang === 'ar' ? '✅ تم إضافة تعليقك' : '✅ Comment added');
    });
  }

  /* ── Utility: prevent XSS ──────────────────────────────────── */
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ─────────────────────────────────────────────────────────────
     EVENT LISTENERS
     ───────────────────────────────────────────────────────────── */

  /* Live search */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderCards();
    });
  }

  /* Category filters */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderCards();
    });
  });

  /* Sort */
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      renderCards();
    });
  }

  /* Re-render on language change (listen for the attribute mutation) */
  new MutationObserver(() => {
    renderCards();
    renderBookmarksPanel();
    renderComments();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  /* ── Initial render ─────────────────────────────────────────── */
  renderCards();
  renderBookmarksPanel();
  renderComments();

});
