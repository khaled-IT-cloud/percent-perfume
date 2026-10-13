/* ═══════════════════════════════════════════════════════════
   PERCENT PERFUME — Analytics (GA4 + Meta Pixel)
   - يحترم موافقة الكوكيز (GDPR)
   - يحمّل Async (لا يبطئ الموقع)
   - يتتبّع الأحداث التلقائية + يوفر API عام
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var CFG = window.PERCENT_CONFIG || {};
  var A   = CFG.ANALYTICS || {};
  var GA4_ID    = String(A.GA4_ID || '').trim();
  var PIXEL_ID  = String(A.META_PIXEL_ID || '').trim();
  var DEBUG     = !!A.DEBUG;

  var loadedGA4 = false;
  var loadedPixel = false;

  /* ─── Consent check ─── */
  function hasConsent(){
    try {
      var raw = localStorage.getItem('percent_cookie_consent');
      if (!raw) return false;
      var c = JSON.parse(raw);
      return !!(c && c.analytics === true);
    } catch(e){ return false; }
  }

  /* ─── Load Google Analytics 4 ─── */
  function loadGA4(){
    if (!GA4_ID || loadedGA4) return;
    loadedGA4 = true;
    if (DEBUG) console.log('[Analytics] Loading GA4:', GA4_ID);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_ID, {
      send_page_view: true,
      anonymize_ip: true
    });
  }

  /* ─── Load Meta Pixel ─── */
  function loadPixel(){
    if (!PIXEL_ID || loadedPixel) return;
    loadedPixel = true;
    if (DEBUG) console.log('[Analytics] Loading Meta Pixel:', PIXEL_ID);

    /* eslint-disable */
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
      t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  /* ─── Init tracking (with consent) ─── */
  function initTracking(){
    if (hasConsent()){
      loadGA4();
      loadPixel();
    }
    // Always listen for consent changes
    window.addEventListener('percent:consent', function(e){
      var ok = e && e.detail && e.detail.analytics;
      if (ok){
        loadGA4();
        loadPixel();
      }
    });
  }

  /* ─── Core track function ─── */
  function track(eventName, params){
    params = params || {};
    if (DEBUG) console.log('[Analytics]', eventName, params);

    if (window.gtag) window.gtag('event', eventName, params);

    if (window.fbq){
      var fbMap = {
        'view_item':      'ViewContent',
        'add_to_cart':    'AddToCart',
        'begin_checkout': 'InitiateCheckout',
        'purchase':       'Purchase',
        'search':         'Search',
        'view_cart':      'ViewCart'
      };
      var fbEvent = fbMap[eventName];
      if (fbEvent) window.fbq('track', fbEvent, params);
    }
  }

  /* ═══ Public API ═══ */
  function viewItem(product){
    if (!product) return;
    track('view_item', {
      currency: 'JOD',
      value: Number(product.price) || 0,
      items: [{
        item_id: String(product.id || ''),
        item_name: product.nameAr || product.nameEn || '',
        item_brand: product.brandLabel || product.brand || '',
        item_category: product.category || '',
        price: Number(product.price) || 0,
        quantity: 1
      }]
    });
  }

  function addToCart(item, qty){
    if (!item) return;
    qty = Math.max(1, parseInt(qty, 10) || 1);
    track('add_to_cart', {
      currency: 'JOD',
      value: (Number(item.price) || 0) * qty,
      items: [{
        item_id: String(item.id || ''),
        item_name: item.nameAr || item.nameEn || '',
        item_brand: item.brandLabel || item.brand || '',
        price: Number(item.price) || 0,
        quantity: qty
      }]
    });
  }

  function beginCheckout(cart){
    if (!cart) return;
    var items = (cart.items || []).map(function(i){
      return {
        item_id: String(i.id || ''),
        item_name: i.nameAr || i.nameEn || '',
        price: Number(i.price) || 0,
        quantity: Number(i.qty) || 1
      };
    });
    track('begin_checkout', {
      currency: 'JOD',
      value: Number(cart.total) || 0,
      coupon: cart.coupon ? cart.coupon.code : undefined,
      items: items
    });
  }

  function purchase(order){
    if (!order) return;
    var items = (order.items || []).map(function(i){
      return {
        item_id: String(i.id || ''),
        item_name: i.nameAr || i.nameEn || '',
        price: Number(i.price) || 0,
        quantity: Number(i.qty) || 1
      };
    });
    track('purchase', {
      transaction_id: String(order.orderNumber || ''),
      currency: 'JOD',
      value: Number(order.total) || 0,
      shipping: 0,
      coupon: order.coupon ? order.coupon.code : undefined,
      items: items
    });
  }

  function search(term){
    if (!term) return;
    track('search', { search_term: String(term).slice(0, 100) });
  }

  /* ═══ Auto-tracking hooks ═══ */

  // 1. Auto-track add-to-cart clicks (delegation)
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.add-to-cart, .add-to-cart-main, .sticky-add-btn');
    if (!btn) return;
    // Product page buttons carry data via window.__percentCurrentProduct
    if (window.__percentCurrentProduct){
      var qty = 1;
      var qtyInput = document.getElementById('qtyInput');
      if (qtyInput) qty = parseInt(qtyInput.value, 10) || 1;
      addToCart(window.__percentCurrentProduct, qty);
      return;
    }
    // Product card buttons
    var card = btn.closest('.product-card');
    if (card){
      addToCart({
        id: card.dataset.name,
        nameAr: card.dataset.nameAr,
        nameEn: card.dataset.nameEn,
        brandLabel: card.dataset.category,
        price: parseFloat(card.dataset.price) || 0
      }, 1);
    }
  }, true);

  // 2. Auto-track begin_checkout
  document.addEventListener('click', function(e){
    var btn = e.target.closest('#placeOrderBtn, #stickyOrderBtn');
    if (!btn) return;
    if (window.PercentCart && window.PercentCart.get){
      try { beginCheckout(window.PercentCart.get()); } catch(err){}
    }
  }, true);

  // 3. Auto-track purchase (watch success modal)
  function watchPurchase(){
    var modal = document.getElementById('successModal');
    if (!modal) return;
    var obs = new MutationObserver(function(){
      if (modal.classList.contains('show') && !window.__purchaseTracked){
        window.__purchaseTracked = true;
        try {
          var orders = (window.PercentCart && window.PercentCart.getOrders) ? window.PercentCart.getOrders() : [];
          if (orders && orders.length){
            purchase(orders[0]);
          }
        } catch(err){}
        // Reset flag after modal closes
        setTimeout(function(){ window.__purchaseTracked = false; }, 2000);
      }
    });
    obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  // 4. Auto-track product view (on product page)
  function watchProductView(){
    if (location.pathname.indexOf('product') === -1) return;
    var tries = 0;
    var maxTries = 30; // 15 seconds
    var iv = setInterval(function(){
      if (window.__percentCurrentProduct){
        viewItem(window.__percentCurrentProduct);
        clearInterval(iv);
        return;
      }
      if (++tries >= maxTries) clearInterval(iv);
    }, 500);
  }

  /* ═══ Bootstrap ═══ */
  function boot(){
    initTracking();
    watchPurchase();
    watchProductView();
    if (DEBUG) console.log('[Analytics] Ready');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ═══ Expose API ═══ */
  window.PercentAnalytics = {
    track: track,
    viewItem: viewItem,
    addToCart: addToCart,
    beginCheckout: beginCheckout,
    purchase: purchase,
    search: search,
    hasConsent: hasConsent,
    reload: initTracking,
    get IDs(){ return { GA4: GA4_ID, Pixel: PIXEL_ID }; },
    isLoaded: function(){ return { GA4: loadedGA4, Pixel: loadedPixel }; }
  };
})();