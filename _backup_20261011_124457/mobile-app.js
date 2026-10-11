/* ═══════════════════════════════════════════════════════════════
   PERCENT PERFUME — Mobile App Behaviors v2.0
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var isMobile = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
              || window.matchMedia('(max-width: 900px)').matches;
  if (!isMobile) return;

  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ═══ Haptic Feedback ═══ */
  function haptic(pattern){
    if (navigator.vibrate){
      try { navigator.vibrate(pattern || 10); } catch(e){}
    }
  }
  window.mHaptic = haptic;

  /* ═══ Page detection ═══ */
  var path = location.pathname.toLowerCase();
  function isPage(name){
    if (name === 'home') return /\/(index\.html)?$/.test(path) || path.endsWith('/');
    return path.indexOf(name) !== -1;
  }

  /* ═══ Bottom Navigation ═══ */
  function injectBottomNav(){
    if (document.querySelector('.m-bottom-nav')) return;
    if (isPage('admin') || isPage('customer-service')) return;

    var nav = document.createElement('nav');
    nav.className = 'm-bottom-nav';
    nav.setAttribute('aria-label', 'Main navigation');

    var items = [
      { href: 'index.html',  icon: 'fa-house-chimney',  label: 'الرئيسية', labelEn: 'Home',  key: 'home' },
      { href: 'women.html',  icon: 'fa-spa',            label: 'نسائي',    labelEn: 'Women', key: 'women' },
      { href: 'men.html',    icon: 'fa-shield-halved',  label: 'رجالي',    labelEn: 'Men',   key: 'men' },
      { href: 'loyalty.html',icon: 'fa-crown',          label: 'النادي',   labelEn: 'Club',  key: 'loyalty' },
      { href: '#cart',       icon: 'fa-bag-shopping',   label: 'السلة',    labelEn: 'Cart',  key: 'cart', isCart: true, badge: 'cart' }
    ];

    var currentKey = 'home';
    if (isPage('women')) currentKey = 'women';
    else if (isPage('men')) currentKey = 'men';
    else if (isPage('loyalty')) currentKey = 'loyalty';
    else if (isPage('product')) currentKey = 'home';

    items.forEach(function(it){
      var el = document.createElement('a');
      el.href = it.href;
      el.className = 'm-nav-item' + (currentKey === it.key ? ' active' : '');
      el.setAttribute('data-nav-key', it.key);
      el.innerHTML = '<i class="fas ' + it.icon + '"></i>' +
                     '<span class="lang-ar">' + it.label + '</span>' +
                     '<span class="lang-en">' + it.labelEn + '</span>' +
                     (it.badge ? '<span class="m-nav-badge" data-badge="' + it.badge + '"></span>' : '');

      if (it.isCart){
        el.addEventListener('click', function(e){
          e.preventDefault();
          haptic(12);
          var cartBtn = document.getElementById('cartBtn');
          if (cartBtn) cartBtn.click();
          else location.href = 'cart.html';
        });
      } else {
        el.addEventListener('click', function(){ haptic(8); });
      }

      nav.appendChild(el);
    });

    document.body.appendChild(nav);
    updateNavBadges();
  }

  /* ═══ Badge updates ═══ */
  function updateNavBadges(){
    if (!window.PercentCart) return;
    var count = 0;
    try { count = window.PercentCart.getCount(); } catch(e){}
    var badge = document.querySelector('[data-badge="cart"]');
    if (badge){
      badge.textContent = count > 0 ? count : '';
      badge.classList.toggle('show', count > 0);
    }
  }

  if (window.PercentCart && window.PercentCart.onChange){
    window.PercentCart.onChange(function(){ updateNavBadges(); });
  }

  /* ═══ Swipe Back gesture ═══ */
  (function swipeBack(){
    var startX = 0, startY = 0, tracking = false, threshold = 80, edge = 30;
    var isRTL = document.documentElement.dir === 'rtl';

    document.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) return;
      var x = e.touches[0].clientX;
      var fromEdge = isRTL ? (x <= edge) : (x >= window.innerWidth - edge);
      if (!fromEdge) return;
      startX = x;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e){
      if (!tracking) return;
      var dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > 60) tracking = false;
    }, { passive: true });

    document.addEventListener('touchend', function(e){
      if (!tracking) return;
      tracking = false;
      var dx = e.changedTouches[0].clientX - startX;
      var passed = isRTL ? (dx > threshold) : (dx < -threshold);
      if (passed){
        haptic(15);
        if (history.length > 1) history.back();
      }
    }, { passive: true });
  })();

  /* ═══ Pull to Refresh ═══ */
  (function pullToRefresh(){
    var indicator = document.createElement('div');
    indicator.className = 'm-ptr-indicator';
    indicator.innerHTML = '<i class="fas fa-arrows-rotate"></i>';
    document.body.appendChild(indicator);

    var startY = 0, pulling = false, triggered = false;

    document.addEventListener('touchstart', function(e){
      if (window.scrollY > 5) return;
      if (e.touches.length !== 1) return;
      if (document.body.style.overflow === 'hidden') return;
      startY = e.touches[0].clientY;
      pulling = true;
      triggered = false;
    }, { passive: true });

    document.addEventListener('touchmove', function(e){
      if (!pulling) return;
      if (window.scrollY > 5){ pulling = false; return; }
      var dy = e.touches[0].clientY - startY;
      if (dy > 20 && dy < 100) indicator.classList.add('pulling');
    }, { passive: true });

    document.addEventListener('touchend', function(e){
      if (!pulling) return;
      pulling = false;
      if (!indicator.classList.contains('pulling')) return;
      var dy = e.changedTouches[0].clientY - startY;
      if (dy > 70 && !triggered){
        triggered = true;
        indicator.classList.add('spinning');
        haptic([15, 30, 15]);
        setTimeout(function(){
          if (window.PercentProducts && window.PercentProducts.fetchProducts){
            window.PercentProducts.fetchProducts().then(function(){ location.reload(); }).catch(function(){ location.reload(); });
          } else {
            location.reload();
          }
        }, 400);
      } else {
        indicator.classList.remove('pulling');
      }
    }, { passive: true });
  })();

  /* ═══ Native Share ═══ */
  window.mShare = function(data){
    data = data || {};
    if (navigator.share){
      return navigator.share({
        title: data.title || document.title,
        text: data.text || '',
        url: data.url || location.href
      }).catch(function(){});
    }
    try {
      if (navigator.clipboard){
        navigator.clipboard.writeText(data.url || location.href);
        if (window.showToast) window.showToast('تم نسخ الرابط', 'fa-check-circle', 'success');
      }
    } catch(e){}
  };

  document.addEventListener('click', function(e){
    var sb = e.target.closest('#shareWhatsapp, #shareFacebook, #shareTwitter, #shareCopy, [data-share]');
    if (!sb) return;
    if (navigator.share){
      e.preventDefault();
      e.stopPropagation();
      haptic(10);
      window.mShare({ title: document.title, url: location.href });
    }
  }, true);

  /* ═══ Extra haptic on key actions ═══ */
  document.addEventListener('click', function(e){
    if (e.target.closest('#cartClose, #wishlistClose')) haptic(8);
    if (e.target.closest('.add-to-cart, .add-to-cart-main')) haptic([12, 20, 12]);
    if (e.target.closest('.qa-btn.wish, .wishlist-btn')) haptic(10);
  }, true);

  /* ═══ Auto-close nav menu ═══ */
  document.addEventListener('click', function(e){
    var nav = document.querySelector('.nav-links');
    var toggle = document.getElementById('menuToggle');
    if (!nav || !nav.classList.contains('active')) return;
    if (toggle && toggle.contains(e.target)) return;
    if (nav.contains(e.target)) return;
    nav.classList.remove('active');
  }, true);

  /* ═══ Scroll to focused input ═══ */
  document.addEventListener('focusin', function(e){
    var el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')){
      setTimeout(function(){
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(err){}
      }, 350);
    }
  });

  /* ═══ Orientation change fix ═══ */
  window.addEventListener('orientationchange', function(){
    setTimeout(function(){ window.scrollBy(0, 1); }, 300);
  });

  /* ═══ Init ═══ */
  function init(){
    injectBottomNav();
    setInterval(updateNavBadges, 2000);
    console.log('[Mobile App] Initialized ✅');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
/* ═══════════════════════════════════════════════════════════════
   PATCH v2.1 - Hide Netlify badge & fix safe areas
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function hideNetlifyBadge(){
    /* Netlify injects a badge - try multiple selectors */
    var selectors = [
      '#netlify-badge',
      '#netlify-identity-widget',
      'iframe[src*="netlify"]',
      '.netlify-badge',
      'a[href*="netlify.com"][target="_blank"]',
      'div[style*="position: fixed"][style*="bottom"][style*="right"]'
    ];

    selectors.forEach(function(sel){
      try {
        document.querySelectorAll(sel).forEach(function(el){
          /* Only hide if it looks like the Netlify badge */
          var text = (el.textContent || '').toLowerCase();
          var href = (el.href || '').toLowerCase();
          var src = (el.src || '').toLowerCase();

          if (text.indexOf('netlify') !== -1 ||
              href.indexOf('netlify') !== -1 ||
              src.indexOf('netlify') !== -1){
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          }
        });
      } catch(e){}
    });
  }

  /* Run immediately and observe DOM changes */
  hideNetlifyBadge();

  /* Netlify injects badge after load, so watch for it */
  if (window.MutationObserver){
    var observer = new MutationObserver(function(){
      hideNetlifyBadge();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    /* Stop observing after 10 seconds */
    setTimeout(function(){ observer.disconnect(); }, 10000);
  }

  /* Also check periodically for 10 seconds */
  var checks = 0;
  var interval = setInterval(function(){
    hideNetlifyBadge();
    checks++;
    if (checks >= 20) clearInterval(interval);
  }, 500);

  /* ═══ Fix safe-area for Android ═══ */
  function applySafeArea(){
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    var root = document.documentElement;

    if (!isIOS){
      /* On Android, don't add top padding (no notch) */
      root.style.setProperty('--m-safe-top', '0px');
      /* But keep bottom for gesture bar */
      var bottomInset = getComputedStyle(document.body).getPropertyValue('env(safe-area-inset-bottom)');
      if (!bottomInset || bottomInset === '') {
        root.style.setProperty('--m-safe-bottom', '0px');
      }
    }
  }
  applySafeArea();

  console.log('[Mobile Patch v2.1] ✅ Applied');
})();

/* ═══════════════════════════════════════════════════════════════
   PATCH v2.1 — Hide Netlify badge & fix safe areas
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function hideNetlifyBadge(){
    /* Netlify injects a badge — try multiple selectors */
    var selectors = [
      '#netlify-badge',
      '#netlify-identity-widget',
      'iframe[src*="netlify"]',
      '.netlify-badge',
      'a[href*="netlify.com"][target="_blank"]',
      'div[style*="position: fixed"][style*="bottom"][style*="right"]'
    ];

    selectors.forEach(function(sel){
      try {
        document.querySelectorAll(sel).forEach(function(el){
          /* Only hide if it looks like the Netlify badge */
          var text = (el.textContent || '').toLowerCase();
          var href = (el.href || '').toLowerCase();
          var src = (el.src || '').toLowerCase();

          if (text.indexOf('netlify') !== -1 ||
              href.indexOf('netlify') !== -1 ||
              src.indexOf('netlify') !== -1){
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          }
        });
      } catch(e){}
    });
  }

  /* Run immediately and observe DOM changes */
  hideNetlifyBadge();

  /* Netlify injects badge after load, so watch for it */
  if (window.MutationObserver){
    var observer = new MutationObserver(function(){
      hideNetlifyBadge();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    /* Stop observing after 10 seconds */
    setTimeout(function(){ observer.disconnect(); }, 10000);
  }

  /* Also check periodically for 10 seconds */
  var checks = 0;
  var interval = setInterval(function(){
    hideNetlifyBadge();
    checks++;
    if (checks >= 20) clearInterval(interval);
  }, 500);

  /* ═══ Fix safe-area for Android ═══ */
  function applySafeArea(){
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    var root = document.documentElement;

    if (!isIOS){
      /* On Android, don't add top padding (no notch) */
      root.style.setProperty('--m-safe-top', '0px');
      /* But keep bottom for gesture bar */
      var bottomInset = getComputedStyle(document.body).getPropertyValue('env(safe-area-inset-bottom)');
      if (!bottomInset || bottomInset === '') {
        root.style.setProperty('--m-safe-bottom', '0px');
      }
    }
  }
  applySafeArea();

  console.log('[Mobile Patch v2.1] ✅ Applied');
})();

/* ═══════════════════════════════════════════════════════════════
   PATCH v3.0 — Horizontal Overflow Diagnostic (dev only)
   Add ?debug=1 to URL to see what's overflowing
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (location.search.indexOf('debug=1') === -1) return;
  if (!window.matchMedia('(max-width: 900px)').matches) return;

  setTimeout(function(){
    var vw = document.documentElement.clientWidth;
    var overflowers = [];

    document.querySelectorAll('*').forEach(function(el){
      var rect = el.getBoundingClientRect();
      if (rect.right > vw + 1 || rect.left < -1){
        overflowers.push({
          el: el,
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 50),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        });
      }
    });

    if (overflowers.length){
      console.log('%c⚠️ HORIZONTAL OVERFLOW DETECTED:', 'color:#f00;font-weight:bold;font-size:14px');
      console.log('Viewport width:', vw + 'px');
      console.log('Overflowing elements:', overflowers.length);
      console.table(overflowers.map(function(o){
        return {
          Tag: o.tag,
          Class: o.cls,
          Left: o.left,
          Right: o.right,
          Width: o.width
        };
      }));
    } else {
      console.log('%c✅ No horizontal overflow detected!', 'color:#0a0;font-weight:bold');
    }
  }, 2000);
})();

/* ═══════════════════════════════════════════════════════════════
   PATCH v3.0 — Horizontal Overflow Diagnostic (dev only)
   Add ?debug=1 to URL to see what's overflowing
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (location.search.indexOf('debug=1') === -1) return;
  if (!window.matchMedia('(max-width: 900px)').matches) return;

  setTimeout(function(){
    var vw = document.documentElement.clientWidth;
    var overflowers = [];

    document.querySelectorAll('*').forEach(function(el){
      var rect = el.getBoundingClientRect();
      if (rect.right > vw + 1 || rect.left < -1){
        overflowers.push({
          el: el,
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 50),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        });
      }
    });

    if (overflowers.length){
      console.log('%c⚠️ HORIZONTAL OVERFLOW DETECTED:', 'color:#f00;font-weight:bold;font-size:14px');
      console.log('Viewport width:', vw + 'px');
      console.log('Overflowing elements:', overflowers.length);
      console.table(overflowers.map(function(o){
        return {
          Tag: o.tag,
          Class: o.cls,
          Left: o.left,
          Right: o.right,
          Width: o.width
        };
      }));
    } else {
      console.log('%c✅ No horizontal overflow detected!', 'color:#0a0;font-weight:bold');
    }
  }, 2000);
})();
