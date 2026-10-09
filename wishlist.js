/* ============================================================
   PERCENT PERFUME - Wishlist Module (Phase 5.2)
   - Supabase-backed
   - Visitor fingerprint + optional phone sync
   - Auto-injected drawer + header button
   ============================================================ */
(function(global){
  'use strict';

  const CFG = window.PERCENT_CONFIG;
  if (!CFG){
    console.warn('[Wishlist] PERCENT_CONFIG missing');
    return;
  }
  const SUPABASE_URL = CFG.SUPABASE_URL;
  const SUPABASE_KEY = CFG.SUPABASE_KEY;
  const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const VISITOR_KEY = 'percent_wishlist_id';
  const SESSION_KEY = 'percent_prive_session';

  /* ═══ Helpers ═══ */
  function $(s, c){ return (c || document).querySelector(s); }
  function esc(s){
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function getVisitorId(){
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id){
        id = 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch(e){
      return 'temp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }
  }

  function getCustomerPhone(){
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return (data && data.phone) ? String(data.phone) : null;
    } catch(e){
      return null;
    }
  }

  /* ═══ State ═══ */
  let cache = []; // [{ id, product_id, created_at }]
  let productsCache = {}; // { productId: productObject }
  const listeners = new Set();
  let initialized = false;

  function getProductsModule(){
    return global.PercentProducts || null;
  }

  function lookupProduct(productId){
    // 1. Already cached?
    if (productsCache[productId]) return productsCache[productId];
    // 2. From PercentProducts?
    const P = getProductsModule();
    if (P){
      const p = P.getById(productId);
      if (p){ productsCache[productId] = p; return p; }
    }
    return null;
  }

  /* ═══ API ═══ */
  async function fetchAll(){
    const visitorId = getVisitorId();
    const phone = getCustomerPhone();
    let url = SUPABASE_URL + '/rest/v1/wishlists?select=*&order=created_at.desc';
    if (phone){
      url += '&or=(user_identifier.eq.' + encodeURIComponent(visitorId) + ',customer_phone.eq.' + encodeURIComponent(phone) + ')';
    } else {
      url += '&user_identifier=eq.' + encodeURIComponent(visitorId);
    }
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok){
        console.warn('[Wishlist] fetch failed:', res.status);
        return cache;
      }
      cache = await res.json() || [];
      emit();
      return cache;
    } catch(e){
      console.warn('[Wishlist] fetch error:', e);
      return cache;
    }
  }

  async function add(product){
    if (!product || !product.id) return { ok: false, reason: 'invalid' };
    const visitorId = getVisitorId();
    const phone = getCustomerPhone();

    // Local check
    if (has(product.id)) return { ok: true, already: true };

    // Store product details locally for immediate UI
    productsCache[product.id] = product;

    const body = {
      user_identifier: visitorId,
      customer_phone: phone,
      product_id: String(product.id)
    };

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/wishlists', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body)
      });
      if (!res.ok && res.status !== 409){
        console.warn('[Wishlist] add failed:', res.status);
        return { ok: false, reason: 'server_' + res.status };
      }
      await fetchAll();
      return { ok: true };
    } catch(e){
      console.warn('[Wishlist] add error:', e);
      return { ok: false, reason: 'network' };
    }
  }

  async function remove(productId){
    if (!productId) return { ok: false, reason: 'invalid' };
    const visitorId = getVisitorId();
    const phone = getCustomerPhone();

    // Local optimistic update
    cache = cache.filter(x => String(x.product_id) !== String(productId));
    emit();

    // Build delete URL
    let url = SUPABASE_URL + '/rest/v1/wishlists?product_id=eq.' + encodeURIComponent(productId);
    if (phone){
      url += '&or=(user_identifier.eq.' + encodeURIComponent(visitorId) + ',customer_phone.eq.' + encodeURIComponent(phone) + ')';
    } else {
      url += '&user_identifier=eq.' + encodeURIComponent(visitorId);
    }

    try {
      const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
      return { ok: res.ok };
    } catch(e){
      console.warn('[Wishlist] remove error:', e);
      return { ok: false, reason: 'network' };
    }
  }

  async function toggle(product){
    if (has(product.id)){
      return remove(product.id);
    } else {
      return add(product);
    }
  }

  function has(productId){
    return cache.some(x => String(x.product_id) === String(productId));
  }

  function getCount(){
    return cache.length;
  }

  function getItems(){
    return cache.map(x => {
      const p = lookupProduct(x.product_id);
      return {
        wishlist_id: x.id,
        product_id: x.product_id,
        product: p,
        addedAt: x.created_at
      };
    });
  }

  async function clearAll(){
    const visitorId = getVisitorId();
    const phone = getCustomerPhone();
    let url = SUPABASE_URL + '/rest/v1/wishlists?user_identifier=eq.' + encodeURIComponent(visitorId);
    if (phone){
      url = SUPABASE_URL + '/rest/v1/wishlists?or=(user_identifier.eq.' + encodeURIComponent(visitorId) + ',customer_phone.eq.' + encodeURIComponent(phone) + ')';
    }
    cache = [];
    emit();
    try {
      const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
      return { ok: res.ok };
    } catch(e){
      return { ok: false };
    }
  }

  /* ═══ Toast ═══ */
  let toastTimer = null;
  function showToast(msg, icon, type){
    // Use existing toast if present
    let toast = $('#toast');
    if (!toast){
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.innerHTML = '<i class="fas fa-check-circle"></i><span id="toastText"></span>';
      document.body.appendChild(toast);
    }
    const textEl = toast.querySelector('#toastText') || toast.querySelector('span');
    if (textEl) textEl.textContent = msg;
    const i = toast.querySelector('i');
    if (i) i.className = 'fas ' + (icon || 'fa-check-circle');
    toast.classList.remove('error', 'success');
    if (type) toast.classList.add(type);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ═══ Inject CSS ═══ */
  function injectStyles(){
    if (document.getElementById('wishlistStyles')) return;
    const s = document.createElement('style');
    s.id = 'wishlistStyles';
    s.textContent = [
      /* Header button (heart) */
      '.wishlist-header-btn{width:42px;height:42px;border-radius:50%;border:1px solid rgba(10,10,10,.12);background:transparent;color:var(--black,#0a0a0a);cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;position:relative;transition:all .3s cubic-bezier(.22,1,.36,1)}',
      '.wishlist-header-btn:hover{background:#0a0a0a;color:#c9a961;border-color:#0a0a0a;transform:translateY(-3px)}',
      '.wishlist-header-btn.has-items{color:#b91c1c}',
      '.wishlist-count{position:absolute;top:-5px;inset-inline-end:-5px;min-width:20px;height:20px;background:#b91c1c;color:#fff;font-size:.7rem;font-weight:800;border-radius:20px;display:flex;align-items:center;justify-content:center;padding:0 5px;transform:scale(0);transition:transform .35s cubic-bezier(.22,1,.36,1)}',
      '.wishlist-count.show{transform:scale(1)}',
      '.wishlist-count.pop{animation:wishPop .45s cubic-bezier(.22,1,.36,1)}',
      '@keyframes wishPop{0%{transform:scale(1)}45%{transform:scale(1.5)}100%{transform:scale(1)}}',

      /* Overlay (reuse .overlay if exists) */
      '.wishlist-overlay{position:fixed;inset:0;background:rgba(5,5,5,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:all .4s ease;z-index:1450}',
      '.wishlist-overlay.show{opacity:1;visibility:visible}',

      /* Drawer */
      '.wishlist-drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,92vw);z-index:1550;background:#faf8f3;display:flex;flex-direction:column;transform:translateX(105%);transition:transform .55s cubic-bezier(.22,1,.36,1);box-shadow:-30px 0 70px rgba(0,0,0,.3)}',
      'html[dir="ltr"] .wishlist-drawer{right:auto;left:0;transform:translateX(-105%)}',
      'html[dir="ltr"] .wishlist-drawer.open{transform:translateX(0)}',
      '.wishlist-drawer.open{transform:translateX(0)}',
      '.wishlist-head{padding:22px 26px;display:flex;align-items:center;justify-content:space-between;background:#0a0a0a;color:#fff}',
      '.wishlist-head h3{font-size:1.1rem;color:#c9a961;font-family:\'Almarai\',sans-serif;font-weight:800;display:flex;align-items:center;gap:10px}',
      '.wishlist-head h3 i{color:#b91c1c}',
      '.wishlist-head-count{background:#c9a961;color:#0a0a0a;font-size:.72rem;font-weight:800;padding:2px 10px;border-radius:20px;margin-inline-start:6px}',
      '.wishlist-head button{background:transparent;border:none;color:#fff;font-size:1.1rem;cursor:pointer;transition:all .3s ease}',
      '.wishlist-head button:hover{color:#c9a961;transform:rotate(90deg)}',

      '.wishlist-body{flex:1;overflow-y:auto;padding:20px 24px}',
      '.wishlist-empty{text-align:center;padding:60px 10px;color:#6b6459}',
      '.wishlist-empty i{font-size:3rem;color:rgba(185,28,28,.35);margin-bottom:18px;display:block}',
      '.wishlist-empty p{font-size:.92rem;font-weight:700;margin-bottom:6px}',
      '.wishlist-empty small{font-size:.8rem;opacity:.7}',

      '.wishlist-item{display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(10,10,10,.08);animation:wishSlideIn .4s cubic-bezier(.22,1,.36,1)}',
      '@keyframes wishSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}',
      '.wishlist-item:last-child{border-bottom:none}',
      '.wishlist-thumb{width:60px;height:60px;border-radius:12px;flex-shrink:0;background:linear-gradient(150deg,#0a0a0a,#1a1a1a);display:flex;align-items:center;justify-content:center;color:#c9a961;overflow:hidden;position:relative}',
      '.wishlist-thumb img{width:100%;height:100%;object-fit:cover;border-radius:12px;position:relative;z-index:2}',
      '.wishlist-info{flex:1;min-width:0}',
      '.wishlist-info strong{display:block;font-size:.9rem;color:#0a0a0a;font-weight:800;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.wishlist-info small{display:block;font-size:.72rem;color:#6b6459;font-weight:700;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.wishlist-price{color:#a8874a;font-weight:800;font-size:.9rem;font-family:\'Playfair Display\',serif}',
      '.wishlist-item-actions{display:flex;flex-direction:column;gap:6px;flex-shrink:0}',
      '.wishlist-item-actions button{width:34px;height:34px;border-radius:9px;border:1px solid rgba(10,10,10,.1);background:transparent;color:#6b6459;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.82rem;transition:all .25s ease}',
      '.wishlist-item-actions button:hover{background:#0a0a0a;color:#c9a961;border-color:#0a0a0a}',
      '.wishlist-item-actions button.remove:hover{background:#b91c1c;color:#fff;border-color:#b91c1c}',

      '.wishlist-foot{padding:20px 24px;border-top:1px solid rgba(10,10,10,.08);background:#fff;display:flex;flex-direction:column;gap:8px}',
      '.wishlist-foot-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:12px;font-weight:800;font-size:.92rem;cursor:pointer;border:none;transition:all .3s ease;font-family:inherit}',
      '.wishlist-foot-btn.primary{background:linear-gradient(120deg,#0a0a0a,#16161a);color:#c9a961}',
      '.wishlist-foot-btn.primary:hover{background:linear-gradient(120deg,#c9a961,#e8d4a2);color:#0a0a0a;transform:translateY(-2px)}',
      '.wishlist-foot-btn.ghost{background:transparent;color:#6b6459;border:1.5px solid rgba(10,10,10,.12)}',
      '.wishlist-foot-btn.ghost:hover{border-color:#b91c1c;color:#b91c1c}',
      '.wishlist-foot-btn.ghost.confirm{background:#b91c1c;color:#fff;border-color:#b91c1c}',

      /* Heart on product cards - active state */
      '.qa-btn.wish.active{background:#b91c1c !important;color:#fff !important}',
      '.wishlist-btn.active{background:#b91c1c !important;border-color:#b91c1c !important;color:#fff !important}',

      '@media(max-width:520px){.wishlist-drawer{width:100%}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ═══ Inject Drawer ═══ */
  function injectDrawer(){
    if (document.getElementById('wishlistDrawer')) return;

    // Overlay
    const ov = document.createElement('div');
    ov.className = 'wishlist-overlay';
    ov.id = 'wishlistOverlay';
    document.body.appendChild(ov);

    // Drawer
    const drawer = document.createElement('aside');
    drawer.className = 'wishlist-drawer';
    drawer.id = 'wishlistDrawer';
    drawer.setAttribute('aria-label', 'Wishlist');
    drawer.innerHTML =
      '<div class="wishlist-head">' +
        '<h3><i class="fas fa-heart"></i> <span class="lang-ar">المفضلة</span><span class="lang-en">Wishlist</span> <span class="wishlist-head-count" id="wishlistHeadCount">0</span></h3>' +
        '<button id="wishlistClose" aria-label="Close"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="wishlist-body" id="wishlistBody"></div>' +
      '<div class="wishlist-foot" id="wishlistFoot"></div>';
    document.body.appendChild(drawer);

    ov.addEventListener('click', closeDrawer);
    drawer.querySelector('#wishlistClose').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
  }

  /* ═══ Inject Header Button ═══ */
  function injectHeaderButton(){
    if (document.getElementById('wishlistHeaderBtn')) return;
    const navIcons = $('.nav-icons');
    if (!navIcons) return;
    const btn = document.createElement('button');
    btn.className = 'wishlist-header-btn';
    btn.id = 'wishlistHeaderBtn';
    btn.setAttribute('aria-label', 'Wishlist');
    btn.innerHTML = '<i class="fas fa-heart"></i><span class="wishlist-count" id="wishlistCount">0</span>';
    // Insert before cart btn
    const cartBtn = navIcons.querySelector('#cartBtn, .icon-btn[aria-label="Cart"]');
    if (cartBtn){
      navIcons.insertBefore(btn, cartBtn);
    } else {
      navIcons.appendChild(btn);
    }
    btn.addEventListener('click', openDrawer);
  }

  /* ═══ Render Drawer ═══ */
  function renderDrawer(){
    const body = document.getElementById('wishlistBody');
    const foot = document.getElementById('wishlistFoot');
    const headCount = document.getElementById('wishlistHeadCount');
    if (!body || !foot) return;

    const items = getItems();
    if (headCount) headCount.textContent = items.length;

    if (!items.length){
      body.innerHTML =
        '<div class="wishlist-empty">' +
          '<i class="fas fa-heart"></i>' +
          '<p><span class="lang-ar">مفضلتك فارغة</span><span class="lang-en">Your wishlist is empty</span></p>' +
          '<small><span class="lang-ar">اضغط على ❤️ على أي منتج لإضافته</span><span class="lang-en">Click ❤️ on any product to add</span></small>' +
        '</div>';
      foot.innerHTML =
        '<button class="wishlist-foot-btn primary" id="wishlistBrowseBtn"><i class="fas fa-shopping-bag"></i>' +
        '<span class="lang-ar">تسوق الآن</span><span class="lang-en">Browse products</span></button>';
      const browse = document.getElementById('wishlistBrowseBtn');
      if (browse) browse.addEventListener('click', () => {
        location.href = 'women.html';
      });
      return;
    }

    body.innerHTML = items.map(it => {
      const p = it.product;
      if (!p){
        // Product not found - show placeholder with remove option
        return '<div class="wishlist-item" data-pid="' + esc(it.product_id) + '">' +
          '<div class="wishlist-thumb"><i class="fas fa-question"></i></div>' +
          '<div class="wishlist-info">' +
            '<strong>' + esc(it.product_id) + '</strong>' +
            '<small><span class="lang-ar">المنتج لم يعد متاحا</span><span class="lang-en">No longer available</span></small>' +
          '</div>' +
          '<div class="wishlist-item-actions">' +
            '<button class="remove" data-act="remove" data-pid="' + esc(it.product_id) + '" title="حذف"><i class="fas fa-trash-can"></i></button>' +
          '</div>' +
        '</div>';
      }
      const img = p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" onerror="this.remove()">' : '';
      return '<div class="wishlist-item" data-pid="' + esc(p.id) + '">' +
        '<div class="wishlist-thumb">' + (img || '<i class="fas fa-spray-can-sparkles"></i>') + '</div>' +
        '<div class="wishlist-info">' +
          '<strong><span class="lang-ar">' + esc(p.nameAr || p.nameEn) + '</span><span class="lang-en">' + esc(p.nameEn || p.nameAr) + '</span></strong>' +
          '<small>' + esc(p.brandLabel || p.brand || '') + '</small>' +
          '<span class="wishlist-price">' + Number(p.price).toFixed(2) + ' JOD</span>' +
        '</div>' +
        '<div class="wishlist-item-actions">' +
          '<button data-act="add-cart" data-pid="' + esc(p.id) + '" title="أضف للسلة"><i class="fas fa-bag-shopping"></i></button>' +
          '<button class="remove" data-act="remove" data-pid="' + esc(p.id) + '" title="حذف"><i class="fas fa-trash-can"></i></button>' +
        '</div>' +
      '</div>';
    }).join('');

    foot.innerHTML =
      '<button class="wishlist-foot-btn primary" id="wishlistAddAllBtn"><i class="fas fa-cart-plus"></i>' +
      '<span class="lang-ar">أضف الكل إلى السلة</span><span class="lang-en">Add all to cart</span></button>' +
      '<button class="wishlist-foot-btn ghost" id="wishlistClearBtn"><i class="fas fa-trash-can"></i>' +
      '<span class="lang-ar">إفراغ المفضلة</span><span class="lang-en">Clear wishlist</span></button>';

    // Bind item actions
    body.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const act = btn.dataset.act;
        const pid = btn.dataset.pid;
        if (act === 'remove'){
          await remove(pid);
          showToast(
            document.documentElement.dataset.lang === 'en' ? 'Removed from wishlist' : 'تم الحذف من المفضلة',
            'fa-heart-broken'
          );
        } else if (act === 'add-cart'){
          const p = lookupProduct(pid);
          if (p && global.PercentCart){
            global.PercentCart.add({
              id: p.id, nameAr: p.nameAr, nameEn: p.nameEn,
              price: p.price, qty: 1, category: p.brand || '', image: p.image || ''
            });
            showToast(
              document.documentElement.dataset.lang === 'en' ? 'Added to cart' : 'تمت الإضافة إلى السلة',
              'fa-check-circle', 'success'
            );
          }
        }
      });
    });

    // Bind footer actions
    const addAll = document.getElementById('wishlistAddAllBtn');
    if (addAll) addAll.addEventListener('click', () => {
      let added = 0;
      items.forEach(it => {
        if (it.product && global.PercentCart){
          global.PercentCart.add({
            id: it.product.id, nameAr: it.product.nameAr, nameEn: it.product.nameEn,
            price: it.product.price, qty: 1, category: it.product.brand || '', image: it.product.image || ''
          });
          added++;
        }
      });
      showToast(
        document.documentElement.dataset.lang === 'en' ? 'Added ' + added + ' items' : 'تمت إضافة ' + added + ' عنصر',
        'fa-check-circle', 'success'
      );
    });

    const clearBtn = document.getElementById('wishlistClearBtn');
    if (clearBtn){
      let confirming = false;
      clearBtn.addEventListener('click', async () => {
        if (!confirming){
          confirming = true;
          clearBtn.classList.add('confirm');
          clearBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span class="lang-ar">اضغط مرة أخرى للتأكيد</span><span class="lang-en">Click again to confirm</span>';
          setTimeout(() => {
            confirming = false;
            clearBtn.classList.remove('confirm');
            clearBtn.innerHTML = '<i class="fas fa-trash-can"></i><span class="lang-ar">إفراغ المفضلة</span><span class="lang-en">Clear wishlist</span>';
          }, 3000);
          return;
        }
        await clearAll();
        showToast(document.documentElement.dataset.lang === 'en' ? 'Wishlist cleared' : 'تم إفراغ المفضلة', 'fa-trash-can');
      });
    }
  }

  /* ═══ Counter + State ═══ */
  function updateCounter(){
    const count = getCount();
    const badge = document.getElementById('wishlistCount');
    const headerBtn = document.getElementById('wishlistHeaderBtn');
    if (badge){
      badge.textContent = count;
      badge.classList.toggle('show', count > 0);
    }
    if (headerBtn){
      headerBtn.classList.toggle('has-items', count > 0);
    }

    // Update all wish buttons on page
    document.querySelectorAll('.qa-btn.wish, .wishlist-btn').forEach(btn => {
      const pid = getBtnProductId(btn);
      if (!pid) return;
      const active = has(pid);
      btn.classList.toggle('active', active);
      const icon = btn.querySelector('i');
      if (icon){
        icon.className = active ? 'fas fa-heart' : 'far fa-heart';
      }
    });

    // Update drawer if open
    if (document.getElementById('wishlistDrawer')?.classList.contains('open')){
      renderDrawer();
    }
  }

  function getBtnProductId(btn){
    // 1. data-product-id (product.html wishlist btn)
    if (btn.dataset.productId) return btn.dataset.productId;
    // 2. On product cards
    const card = btn.closest('.product-card');
    if (card) return card.dataset.name || card.dataset.id;
    // 3. product.html wishlist button → use current product from URL
    if (btn.id === 'wishlistBtn'){
      const params = new URLSearchParams(location.search);
      return params.get('id');
    }
    return null;
  }

  /* ═══ Event Listener (pub/sub) ═══ */
  function emit(){
    updateCounter();
    listeners.forEach(fn => { try { fn({ items: getItems(), count: getCount() }); } catch(e){} });
  }
  function onChange(fn){
    listeners.add(fn);
    fn({ items: getItems(), count: getCount() });
    return () => listeners.delete(fn);
  }

  /* ═══ Drawer open/close ═══ */
  function openDrawer(){
    const d = document.getElementById('wishlistDrawer');
    const ov = document.getElementById('wishlistOverlay');
    if (!d) return;
    renderDrawer();
    d.classList.add('open');
    if (ov) ov.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(){
    const d = document.getElementById('wishlistDrawer');
    const ov = document.getElementById('wishlistOverlay');
    if (!d) return;
    d.classList.remove('open');
    if (ov) ov.classList.remove('show');
    document.body.style.overflow = '';
  }

  /* ═══ Global Click Handler (heart buttons) ═══ */
  function bindGlobalWishClicks(){
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.qa-btn.wish, .wishlist-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const pid = getBtnProductId(btn);
      if (!pid){
        showToast(
          document.documentElement.dataset.lang === 'en' ? 'Product not found' : 'المنتج غير موجود',
          'fa-triangle-exclamation', 'error'
        );
        return;
      }

      const P = getProductsModule();
      const product = (P && P.getById(pid)) || lookupProduct(pid);
      if (!product){
        showToast(
          document.documentElement.dataset.lang === 'en' ? 'Product not loaded yet' : 'المنتج لم يحمل بعد',
          'fa-triangle-exclamation', 'error'
        );
        return;
      }

      const already = has(pid);
      const res = await toggle(product);

      if (res && res.ok){
        // Visual feedback
        const icon = btn.querySelector('i');
        const nowActive = !already;
        btn.classList.toggle('active', nowActive);
        if (icon) icon.className = nowActive ? 'fas fa-heart' : 'far fa-heart';

        // Pop the counter
        const counter = document.getElementById('wishlistCount');
        if (counter && nowActive){
          counter.classList.remove('pop');
          void counter.offsetWidth;
          counter.classList.add('pop');
        }

        showToast(
          nowActive
            ? (document.documentElement.dataset.lang === 'en' ? 'Added to wishlist' : 'أضيف إلى المفضلة')
            : (document.documentElement.dataset.lang === 'en' ? 'Removed from wishlist' : 'أزيل من المفضلة'),
          nowActive ? 'fa-heart' : 'fa-heart-broken',
          nowActive ? 'success' : ''
        );
      } else {
        showToast(
          document.documentElement.dataset.lang === 'en' ? 'Failed, try again' : 'فشل حاول مرة أخرى',
          'fa-triangle-exclamation', 'error'
        );
      }
    }, true);
  }

  /* ═══ Init ═══ */
  async function init(){
    if (initialized) return;
    initialized = true;
    injectStyles();
    injectDrawer();
    injectHeaderButton();
    bindGlobalWishClicks();

    // Try to preload products first so we can show names
    const P = getProductsModule();
    if (P && P.fetchProducts){
      try { await P.fetchProducts(); } catch(e){}
    }

    await fetchAll();
    updateCounter();

    // Listen for product module changes (so newly-loaded products appear)
    if (P && P.onChange){
      P.onChange(() => {
        productsCache = {};
        emit();
      });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also re-render on language switch (buttons injected after lang applied)
  document.addEventListener('click', (e) => {
    if (e.target.closest('#langBtn, #langBtnMobile')){
      setTimeout(() => updateCounter(), 200);
    }
  });

  /* ═══ Public API ═══ */
  global.PercentWishlist = {
    add, remove, toggle, has,
    getItems, getCount, clearAll,
    fetchAll, refresh: fetchAll,
    openDrawer, closeDrawer,
    onChange
  };

})(window);