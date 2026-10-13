/* ============================================================
   PERCENT PERFUME — Live Search Module
   - Self-contained (injects own CSS + HTML)
   - Searches products by name, brand, notes
   - Keyboard navigation (↑↓ Enter Esc)
   - Category filter (all / women / men)
   ============================================================ */
(function(){
  'use strict';
  if (window.__percentSearchLoaded) return;
  window.__percentSearchLoaded = true;

  /* ═══════════════════════════════════════════════════════
     CSS
     ═══════════════════════════════════════════════════════ */
  function injectStyles(){
    if (document.getElementById('percent-search-styles')) return;
    var style = document.createElement('style');
    style.id = 'percent-search-styles';
    style.textContent = `
      /* Overlay */
      .psearch-overlay {
        position: fixed;
        inset: 0;
        background: rgba(5, 5, 5, .65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99990;
        opacity: 0;
        visibility: hidden;
        transition: opacity .3s ease, visibility .3s ease;
      }
      .psearch-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      /* Modal */
      .psearch-modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 99995;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 80px 20px 40px;
        opacity: 0;
        visibility: hidden;
        transition: opacity .3s ease, visibility .3s ease;
        pointer-events: none;
      }
      .psearch-modal.open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .psearch-card {
        width: 100%;
        max-width: 640px;
        max-height: calc(100vh - 120px);
        background: #faf8f3;
        border-radius: 22px;
        border: 1px solid rgba(201, 169, 97, .35);
        box-shadow: 0 40px 100px rgba(0, 0, 0, .5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(-20px) scale(.96);
        transition: transform .38s cubic-bezier(.22, 1, .36, 1);
      }
      .psearch-modal.open .psearch-card {
        transform: translateY(0) scale(1);
      }

      /* Head */
      .psearch-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: linear-gradient(135deg, #0a0a0a, #16161a);
        border-bottom: 2px solid rgba(201, 169, 97, .35);
        position: relative;
        flex-shrink: 0;
      }
      .psearch-head::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, #a8874a, #e8d4a2, #c9a961, #a8874a);
      }
      .psearch-head > i {
        color: #c9a961;
        font-size: 1rem;
        flex-shrink: 0;
      }
      .psearch-input {
        flex: 1;
        min-width: 0;
        padding: 10px 0;
        background: transparent;
        border: none;
        outline: none;
        color: #f5f1e8;
        font-family: inherit;
        font-size: 1rem;
        font-weight: 700;
      }
      .psearch-input::placeholder {
        color: #6a6357;
        font-weight: 400;
      }
      .psearch-close {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, .08);
        color: #c9a961;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all .28s ease;
        flex-shrink: 0;
        font-size: .9rem;
      }
      .psearch-close:hover {
        background: #c9a961;
        color: #0a0a0a;
        transform: rotate(90deg);
      }

      /* Filters */
      .psearch-filters {
        display: flex;
        gap: 6px;
        padding: 12px 20px;
        background: #f5f1e8;
        border-bottom: 1px solid rgba(201, 169, 97, .18);
        flex-shrink: 0;
      }
      .psearch-filter {
        padding: 7px 16px;
        border-radius: 30px;
        border: 1px solid rgba(201, 169, 97, .3);
        background: transparent;
        color: #6b6459;
        font-family: inherit;
        font-size: .78rem;
        font-weight: 800;
        cursor: pointer;
        transition: all .25s ease;
      }
      .psearch-filter:hover {
        border-color: #c9a961;
        color: #a8874a;
      }
      .psearch-filter.active {
        background: #0a0a0a;
        color: #c9a961;
        border-color: #0a0a0a;
      }

      /* Results */
      .psearch-results {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 8px;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      .psearch-results::-webkit-scrollbar {
        width: 6px;
      }
      .psearch-results::-webkit-scrollbar-thumb {
        background: linear-gradient(#c9a961, #a8874a);
        border-radius: 10px;
      }
      .psearch-results::-webkit-scrollbar-track {
        background: #ebe5d6;
      }

      .psearch-item {
        display: flex;
        gap: 14px;
        align-items: center;
        padding: 12px 14px;
        border-radius: 14px;
        cursor: pointer;
        transition: background .18s ease, transform .18s ease;
        border: 1.5px solid transparent;
      }
      .psearch-item:hover,
      .psearch-item.active {
        background: #ffffff;
        border-color: rgba(201, 169, 97, .5);
        transform: translateY(-1px);
      }

      .psearch-thumb {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: linear-gradient(150deg, #0a0a0a, #1a1a1a);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        border: 1px solid rgba(201, 169, 97, .25);
      }
      .psearch-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        position: relative;
        z-index: 2;
      }
      .psearch-thumb::after {
        content: 'P';
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c9a961;
        font-family: 'Playfair Display', serif;
        font-weight: 800;
        font-size: 1.4rem;
        z-index: 1;
      }
      .psearch-thumb:has(img) ::after { display: none; }

      .psearch-info {
        flex: 1;
        min-width: 0;
      }
      .psearch-name {
        display: block;
        font-size: .92rem;
        color: #0a0a0a;
        font-weight: 800;
        margin-bottom: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .psearch-brand {
        display: block;
        font-size: .72rem;
        color: #6b6459;
        font-weight: 700;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .psearch-price {
        font-family: 'Playfair Display', serif;
        font-size: .95rem;
        color: #a8874a;
        font-weight: 800;
      }

      .psearch-cat {
        padding: 3px 10px;
        border-radius: 20px;
        font-size: .65rem;
        font-weight: 800;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .psearch-cat.men {
        background: rgba(44, 62, 80, .12);
        color: #2c3e50;
      }
      .psearch-cat.women {
        background: rgba(232, 196, 196, .35);
        color: #a8874a;
      }

      /* Empty */
      .psearch-empty {
        padding: 60px 20px;
        text-align: center;
        color: #6b6459;
      }
      .psearch-empty i {
        font-size: 2.8rem;
        color: rgba(201, 169, 97, .35);
        display: block;
        margin-bottom: 14px;
      }
      .psearch-empty strong {
        display: block;
        color: #0a0a0a;
        font-size: 1rem;
        font-weight: 800;
        margin-bottom: 6px;
      }
      .psearch-empty p {
        font-size: .82rem;
        font-weight: 700;
      }

      /* Foot */
      .psearch-foot {
        padding: 10px 20px;
        background: #f5f1e8;
        border-top: 1px solid rgba(201, 169, 97, .18);
        font-size: .7rem;
        color: #6b6459;
        font-weight: 700;
        text-align: center;
        flex-shrink: 0;
        letter-spacing: .3px;
      }
      .psearch-foot kbd {
        display: inline-block;
        padding: 1px 6px;
        background: #fff;
        border: 1px solid rgba(10, 10, 10, .15);
        border-radius: 4px;
        font-family: inherit;
        font-size: .68rem;
        font-weight: 800;
        color: #0a0a0a;
        margin: 0 2px;
      }

      /* Loading */
      .psearch-loading {
        padding: 40px 20px;
        text-align: center;
        color: #6b6459;
      }
      .psearch-loading i {
        font-size: 1.6rem;
        color: #c9a961;
        animation: psearchSpin 1s linear infinite;
        display: block;
        margin-bottom: 10px;
      }
      @keyframes psearchSpin {
        to { transform: rotate(360deg); }
      }

      /* Mobile */
      @media (max-width: 640px) {
        .psearch-modal {
          padding: 0;
          align-items: flex-end;
        }
        .psearch-card {
          max-width: 100vw;
          max-height: 92vh;
          max-height: 92dvh;
          border-radius: 24px 24px 0 0;
          border-bottom: none;
          transform: translateY(100%);
        }
        .psearch-modal.open .psearch-card {
          transform: translateY(0);
        }
        .psearch-head {
          padding: 16px 18px;
          border-radius: 24px 24px 0 0;
        }
        .psearch-head::after {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 38px;
          height: 4px;
          border-radius: 4px;
          background: rgba(201, 169, 97, .5);
        }
        .psearch-filters {
          padding: 10px 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .psearch-filter {
          flex-shrink: 0;
        }
        .psearch-input {
          font-size: 16px;
        }
        .psearch-foot {
          padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
        }
        .psearch-foot .kbd-hint-desktop {
          display: none;
        }
      }
      @media (min-width: 641px) {
        .psearch-foot .kbd-hint-mobile {
          display: none;
        }
      }

      /* Dark mode */
      html.dark-mode .psearch-card {
        background: #16161a;
        border-color: rgba(201, 169, 97, .4);
      }
      html.dark-mode .psearch-filters {
        background: #0f0f0f;
        border-bottom-color: rgba(201, 169, 97, .15);
      }
      html.dark-mode .psearch-filter {
        color: #a8a29b;
        border-color: rgba(201, 169, 97, .25);
      }
      html.dark-mode .psearch-filter.active {
        background: #c9a961;
        color: #0a0a0a;
        border-color: #c9a961;
      }
      html.dark-mode .psearch-item:hover,
      html.dark-mode .psearch-item.active {
        background: #1a1a1e;
        border-color: rgba(201, 169, 97, .4);
      }
      html.dark-mode .psearch-name {
        color: #f5f1e8;
      }
      html.dark-mode .psearch-brand {
        color: #a8a29b;
      }
      html.dark-mode .psearch-empty {
        color: #a8a29b;
      }
      html.dark-mode .psearch-empty strong {
        color: #f5f1e8;
      }
      html.dark-mode .psearch-foot {
        background: #0f0f0f;
        color: #a8a29b;
        border-top-color: rgba(201, 169, 97, .15);
      }
      html.dark-mode .psearch-foot kbd {
        background: #1a1a1e;
        border-color: rgba(201, 169, 97, .3);
        color: #c9a961;
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .psearch-modal,
        .psearch-card,
        .psearch-overlay,
        .psearch-item {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════
     HTML
     ═══════════════════════════════════════════════════════ */
  function injectHTML(){
    if (document.getElementById('psearchModal')) return;
    var html = '' +
      '<div class="psearch-overlay" id="psearchOverlay"></div>' +
      '<div class="psearch-modal" id="psearchModal" role="dialog" aria-modal="true" aria-label="البحث">' +
      '  <div class="psearch-card">' +
      '    <div class="psearch-head">' +
      '      <i class="fas fa-magnifying-glass"></i>' +
      '      <input type="text" class="psearch-input" id="psearchInput" placeholder="ابحث عن عطر، ماركة، أو نوتة..." autocomplete="off">' +
      '      <button type="button" class="psearch-close" id="psearchClose" aria-label="إغلاق"><i class="fas fa-times"></i></button>' +
      '    </div>' +
      '    <div class="psearch-filters" id="psearchFilters">' +
      '      <button type="button" class="psearch-filter active" data-cat="all">الكل</button>' +
      '      <button type="button" class="psearch-filter" data-cat="women">نسائي</button>' +
      '      <button type="button" class="psearch-filter" data-cat="men">رجالي</button>' +
      '    </div>' +
      '    <div class="psearch-results" id="psearchResults"></div>' +
      '    <div class="psearch-foot">' +
      '      <span class="kbd-hint-desktop"><kbd>↑</kbd><kbd>↓</kbd> للتنقل · <kbd>Enter</kbd> للاختيار · <kbd>Esc</kbd> للإغلاق</span>' +
      '      <span class="kbd-hint-mobile">اضغط على أي نتيجة للانتقال إليها</span>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ═══════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════ */
  var isOpen = false;
  var currentCat = 'all';
  var currentResults = [];
  var activeIndex = -1;
  var debounceTimer = null;

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */
  function esc(s){
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getProducts(){
    if (!window.PercentProducts) return [];
    return window.PercentProducts.getActive ? window.PercentProducts.getActive() : [];
  }

  function normalize(s){
    return String(s || '').toLowerCase()
      .replace(/[\u064B-\u0652]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ═══════════════════════════════════════════════════════
     SEARCH LOGIC
     ═══════════════════════════════════════════════════════ */
  function searchProducts(query, category){
    var products = getProducts();
    var q = normalize(query);

    var filtered = products.filter(function(p){
      if (category && category !== 'all' && p.category !== category) return false;
      if (!q) return true;

      var haystack = normalize([
        p.nameAr, p.nameEn, p.subEn, p.brand, p.brandLabel,
        (p.notes || []).join(' '),
        p.category === 'men' ? 'رجالي' : (p.category === 'women' ? 'نسائي' : '')
      ].filter(Boolean).join(' '));

      return haystack.indexOf(q) !== -1;
    });

    // Score & sort: name match first, then brand, then rest
    if (q){
      filtered.sort(function(a, b){
        var aName = normalize((a.nameAr || '') + ' ' + (a.nameEn || ''));
        var bName = normalize((b.nameAr || '') + ' ' + (b.nameEn || ''));
        var aScore = aName.indexOf(q) !== -1 ? 0 : 1;
        var bScore = bName.indexOf(q) !== -1 ? 0 : 1;
        return aScore - bScore;
      });
    }

    return filtered.slice(0, 30);
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  function renderResults(query){
    var box = document.getElementById('psearchResults');
    if (!box) return;

    currentResults = searchProducts(query, currentCat);
    activeIndex = -1;

    if (!currentResults.length){
      box.innerHTML = '' +
        '<div class="psearch-empty">' +
          '<i class="fas fa-magnifying-glass"></i>' +
          '<strong>' + (query ? 'لا توجد نتائج مطابقة' : 'ابدأ الكتابة للبحث') + '</strong>' +
          '<p>' + (query ? 'جرب كلمة أخرى أو غيّر الفئة' : 'مثال: عود، مسك، رجالي، نسائي...') + '</p>' +
        '</div>';
      return;
    }

    box.innerHTML = currentResults.map(function(p, i){
      var img = p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" onerror="this.remove()">' : '';
      var catLabel = p.category === 'men' ? 'رجالي' : (p.category === 'women' ? 'نسائي' : '');
      var catClass = p.category === 'men' ? 'men' : 'women';
      return '' +
        '<div class="psearch-item" data-id="' + esc(p.id) + '" data-index="' + i + '">' +
          '<div class="psearch-thumb">' + img + '</div>' +
          '<div class="psearch-info">' +
            '<span class="psearch-name">' + esc(p.nameAr || p.nameEn) + '</span>' +
            '<span class="psearch-brand">' + esc(p.brandLabel || p.brand || '') + '</span>' +
            '<span class="psearch-price">' + Number(p.price || 0).toFixed(2) + ' JOD</span>' +
          '</div>' +
          (catLabel ? '<span class="psearch-cat ' + catClass + '">' + catLabel + '</span>' : '') +
        '</div>';
    }).join('');

    // Bind clicks
    box.querySelectorAll('.psearch-item').forEach(function(el){
      el.addEventListener('click', function(){
        var id = el.dataset.id;
        if (id) navigateToProduct(id);
      });
    });
  }

  function updateActive(){
    var box = document.getElementById('psearchResults');
    if (!box) return;
    var items = box.querySelectorAll('.psearch-item');
    items.forEach(function(el, i){
      el.classList.toggle('active', i === activeIndex);
      if (i === activeIndex){
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  function navigateToProduct(id){
    if (!id) return;
    try {
      sessionStorage.setItem('percent_last_search', JSON.stringify({
        query: document.getElementById('psearchInput').value,
        ts: Date.now()
      }));
    } catch(e){}
    window.location.href = 'product.html?id=' + encodeURIComponent(id);
  }

  /* ═══════════════════════════════════════════════════════
     OPEN / CLOSE
     ═══════════════════════════════════════════════════════ */
  function openSearch(){
    if (isOpen) return;
    isOpen = true;

    var overlay = document.getElementById('psearchOverlay');
    var modal = document.getElementById('psearchModal');
    var input = document.getElementById('psearchInput');

    if (overlay) overlay.classList.add('open');
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Load products if not loaded
    if (window.PercentProducts && window.PercentProducts.fetchProducts){
      var products = getProducts();
      if (!products.length){
        var box = document.getElementById('psearchResults');
        if (box){
          box.innerHTML = '<div class="psearch-loading"><i class="fas fa-spinner"></i> جارٍ التحميل...</div>';
        }
        window.PercentProducts.fetchProducts().then(function(){
          renderResults('');
        }).catch(function(){
          renderResults('');
        });
      } else {
        renderResults('');
      }
    } else {
      renderResults('');
    }

    setTimeout(function(){
      if (input){ input.value = ''; input.focus(); }
    }, 200);

    if (window.mHaptic) window.mHaptic(12);
  }

  function closeSearch(){
    if (!isOpen) return;
    isOpen = false;

    var overlay = document.getElementById('psearchOverlay');
    var modal = document.getElementById('psearchModal');
    var input = document.getElementById('psearchInput');

    if (overlay) overlay.classList.remove('open');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    if (input) input.blur();

    if (window.mHaptic) window.mHaptic(8);
  }

  /* ═══════════════════════════════════════════════════════
     BIND EVENTS
     ═══════════════════════════════════════════════════════ */
  function bindEvents(){
    // All search buttons on the page
    document.addEventListener('click', function(e){
      var btn = e.target.closest('#searchBtn, [data-open-search]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      openSearch();
    }, true);

    // Close button
    var closeBtn = document.getElementById('psearchClose');
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    // Overlay click
    var overlay = document.getElementById('psearchOverlay');
    if (overlay) overlay.addEventListener('click', closeSearch);

    // Input typing (debounced)
    var input = document.getElementById('psearchInput');
    if (input){
      input.addEventListener('input', function(){
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function(){
          renderResults(input.value);
        }, 120);
      });

      input.addEventListener('keydown', function(e){
        if (e.key === 'ArrowDown'){
          e.preventDefault();
          if (currentResults.length){
            activeIndex = (activeIndex + 1) % currentResults.length;
            updateActive();
          }
        } else if (e.key === 'ArrowUp'){
          e.preventDefault();
          if (currentResults.length){
            activeIndex = activeIndex <= 0 ? currentResults.length - 1 : activeIndex - 1;
            updateActive();
          }
        } else if (e.key === 'Enter'){
          e.preventDefault();
          if (activeIndex >= 0 && currentResults[activeIndex]){
            navigateToProduct(currentResults[activeIndex].id);
          } else if (currentResults.length === 1){
            navigateToProduct(currentResults[0].id);
          }
        }
      });
    }

    // Filters
    var filters = document.getElementById('psearchFilters');
    if (filters){
      filters.addEventListener('click', function(e){
        var btn = e.target.closest('.psearch-filter');
        if (!btn) return;
        var cat = btn.dataset.cat || 'all';
        currentCat = cat;
        filters.querySelectorAll('.psearch-filter').forEach(function(b){
          b.classList.toggle('active', b.dataset.cat === cat);
        });
        var input = document.getElementById('psearchInput');
        renderResults(input ? input.value : '');
      });
    }

    // ESC key
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && isOpen) closeSearch();
    });

    // Ctrl+K / Cmd+K shortcut
    document.addEventListener('keydown', function(e){
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault();
        openSearch();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  function init(){
    injectStyles();
    injectHTML();
    bindEvents();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.PercentSearch = {
    open: openSearch,
    close: closeSearch,
    search: searchProducts
  };
})();