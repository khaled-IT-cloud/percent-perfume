/* ============================================================
   PERCENT PERFUME — Reviews Display (Phase 4.1 Part 3)
   Shows approved reviews on product cards + modal
   ============================================================ */
(function(){
  'use strict';

  const SUPABASE_URL = 'https://iedmrzocqgscnybpvxed.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Q_vZjEcX-bN6Dkyee3jN5g_TWlovcPQ';

  function $(s, c){ c = c || document; return c.querySelector(s); }
  function $$(s, c){ c = c || document; return Array.from(c.querySelectorAll(s)); }
  function esc(s){
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  // Stats cache: { productId: { avg: 4.5, count: 12 } }
  const statsCache = {};

  /* ── Inject CSS ── */
  function injectStyles(){
    if (document.getElementById('rdStyles')) return;
    const s = document.createElement('style');
    s.id = 'rdStyles';
    s.textContent = [
      '.rd-stars{cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:2px 4px;border-radius:6px;transition:all .2s ease;user-select:none}',
      '.rd-stars:hover{background:rgba(212,175,55,.10)}',
      '.rd-stars .rd-icons{color:#c9a961;font-size:.82rem;letter-spacing:2px;font-family:inherit}',
      '.rd-stars .rd-count{color:#6b6459;font-size:.72rem;font-weight:800}',
      '.rd-stars.rd-empty .rd-icons{color:#c8ccd3}',
      '.rd-modal{position:fixed;inset:0;z-index:3000;background:rgba(5,9,20,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;visibility:hidden;transition:opacity .3s ease,visibility .3s ease}',
      '.rd-modal.show{opacity:1;visibility:visible}',
      '.rd-modal-card{background:#fff;border-radius:22px;max-width:680px;width:100%;max-height:88vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 40px 100px rgba(0,0,0,.45);transform:scale(.94);transition:transform .4s cubic-bezier(.22,1,.36,1)}',
      '.rd-modal.show .rd-modal-card{transform:scale(1)}',
      '.rd-modal-head{padding:22px 26px;border-bottom:1px solid #e5e7eb;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;position:relative}',
      '.rd-modal-head::before{content:"";position:absolute;top:0;inset-inline-start:0;width:100%;height:3px;background:linear-gradient(90deg,#a8874a,#c9a961,#e8d4a2,#c9a961,#a8874a);border-radius:22px 22px 0 0}',
      '.rd-modal-title{flex:1;min-width:0}',
      '.rd-modal-title h3{font-family:"Playfair Display",serif;font-size:1.25rem;color:#0a0a0a;margin:0 0 6px;letter-spacing:.5px}',
      '.rd-modal-summary{display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:700;color:#6b6459}',
      '.rd-modal-summary strong{color:#a8874a;font-family:"Playfair Display",serif;font-size:1.3rem}',
      '.rd-modal-summary .rd-big-stars{color:#c9a961;letter-spacing:2px;font-size:1rem}',
      '.rd-modal-close{width:38px;height:38px;border-radius:50%;background:#f4f5f7;color:#6b6459;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.95rem;transition:all .25s ease;flex-shrink:0}',
      '.rd-modal-close:hover{background:#ef4444;color:#fff;transform:rotate(90deg)}',
      '.rd-modal-body{padding:20px 26px;overflow-y:auto;flex:1}',
      '.rd-list{display:flex;flex-direction:column;gap:14px}',
      '.rd-review{padding:16px;border:1px solid #e5e7eb;border-radius:14px;background:#fafbfc}',
      '.rd-review-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;flex-wrap:wrap}',
      '.rd-review-author{font-weight:800;color:#0a0a0a;font-size:.9rem;display:flex;align-items:center;gap:8px}',
      '.rd-verified{display:inline-flex;align-items:center;gap:4px;font-size:.68rem;font-weight:800;color:#047857;padding:2px 8px;border-radius:20px;background:rgba(16,185,129,.12)}',
      '.rd-review-stars{color:#c9a961;letter-spacing:1.5px;font-size:.85rem}',
      '.rd-review-date{font-size:.72rem;color:#6b6459;font-weight:700}',
      '.rd-review-title{font-weight:800;color:#0a0a0a;font-size:.9rem;margin-bottom:6px}',
      '.rd-review-comment{font-size:.88rem;color:#374151;line-height:1.7;font-weight:600}',
      '.rd-reply{margin-top:12px;padding:12px 14px;background:linear-gradient(140deg,#fff9ec,#fdf3dd);border:1px solid rgba(212,175,55,.4);border-radius:10px;font-size:.82rem}',
      '.rd-reply strong{color:#a8874a;display:block;margin-bottom:4px;font-weight:800}',
      '.rd-reply span{color:#374151;font-weight:600;line-height:1.6}',
      '.rd-empty{padding:60px 20px;text-align:center;color:#6b6459}',
      '.rd-empty i{font-size:2.6rem;color:rgba(212,175,55,.4);display:block;margin-bottom:14px}',
      '.rd-loading{padding:60px 20px;text-align:center;color:#6b6459}',
      '.rd-loading i{font-size:2rem;color:#c9a961;display:block;margin-bottom:12px;animation:rdSpin 1.2s linear infinite}',
      '@keyframes rdSpin{to{transform:rotate(360deg)}}',
      '@media(max-width:600px){.rd-modal{padding:0}.rd-modal-card{border-radius:0;max-height:100vh;height:100%}.rd-modal-head{border-radius:0}.rd-modal-head h3{font-size:1.1rem}.rd-modal-body{padding:16px 18px}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── Modal ── */
  let modal = null;
  function ensureModal(){
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'rd-modal';
    modal.id = 'rdModal';
    modal.innerHTML = [
      '<div class="rd-modal-card">',
      '  <div class="rd-modal-head">',
      '    <div class="rd-modal-title">',
      '      <h3 id="rdModalName">—</h3>',
      '      <div class="rd-modal-summary" id="rdModalSummary"></div>',
      '    </div>',
      '    <button type="button" class="rd-modal-close" id="rdModalClose"><i class="fas fa-times"></i></button>',
      '  </div>',
      '  <div class="rd-modal-body" id="rdModalBody"></div>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);

    $('#rdModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });
    return modal;
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  async function openModal(productId){
    ensureModal();
    const card = document.querySelector('.product-card[data-name="' + productId + '"]');
    const name = card ? (card.getAttribute('data-name-ar') || card.getAttribute('data-name-en') || productId) : productId;
    const stats = statsCache[productId] || { avg: 0, count: 0 };

    $('#rdModalName').textContent = name;
    $('#rdModalSummary').innerHTML = stats.count > 0
      ? '<strong>' + stats.avg.toFixed(1) + '</strong><span class="rd-big-stars">' + renderStars(Math.round(stats.avg)) + '</span><span>(' + stats.count + ' تقييم)</span>'
      : '<span>لا توجد تقييمات بعد</span>';

    $('#rdModalBody').innerHTML = '<div class="rd-loading"><i class="fas fa-spinner"></i> جارٍ التحميل...</div>';

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Fetch reviews via RPC
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_product_reviews', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_product_id: productId, p_limit: 50, p_offset: 0 })
      });
      if (!res.ok) throw new Error('server_' + res.status);
      const rows = await res.json();

      if (!rows || !rows.length){
        $('#rdModalBody').innerHTML = '<div class="rd-empty"><i class="fas fa-star"></i><strong style="display:block;color:#0a0a0a;margin-bottom:6px">لا توجد تقييمات بعد</strong><p style="font-size:.85rem">كن أول من يقيّم هذا المنتج</p></div>';
        return;
      }

      const list = rows.map(function(r){
        const stars = renderStars(r.rating);
        const date = new Date(r.created_at).toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric' });
        const verified = r.verified_purchase ? '<span class="rd-verified"><i class="fas fa-check-circle"></i> شراء موثّق</span>' : '';
        const title = r.title ? '<div class="rd-review-title">' + esc(r.title) + '</div>' : '';
        const reply = r.admin_reply
          ? '<div class="rd-reply"><strong><i class="fas fa-reply"></i> رد PERCENT:</strong><span>' + esc(r.admin_reply) + '</span></div>'
          : '';

        return '<div class="rd-review">' +
          '<div class="rd-review-head">' +
            '<div class="rd-review-author">' + esc(r.customer_name || 'عميل') + verified + '</div>' +
            '<div class="rd-review-stars">' + stars + '</div>' +
          '</div>' +
          '<div class="rd-review-date">' + date + '</div>' +
          title +
          '<div class="rd-review-comment">' + esc(r.comment) + '</div>' +
          reply +
        '</div>';
      }).join('');

      $('#rdModalBody').innerHTML = '<div class="rd-list">' + list + '</div>';
    } catch(e){
      console.error('openModal error:', e);
      $('#rdModalBody').innerHTML = '<div class="rd-empty"><i class="fas fa-exclamation-triangle"></i><strong style="display:block;color:#b91c1c">فشل تحميل التقييمات</strong><p style="font-size:.85rem">حاول لاحقاً</p></div>';
    }
  }

  function renderStars(n){
    n = Math.max(0, Math.min(5, Math.round(n)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  /* ── Fetch stats for all products (batch) ── */
  async function fetchStatsBatch(productIds){
    if (!productIds.length) return;
    // Use direct select since RLS allows reading approved reviews
    try {
      const idsFilter = productIds.map(function(id){ return '"' + id + '"'; }).join(',');
      const url = SUPABASE_URL + '/rest/v1/product_reviews?select=product_id,rating&status=eq.approved&product_id=in.(' + encodeURIComponent(idsFilter) + ')';
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      });
      if (!res.ok){ console.warn('fetchStatsBatch:', res.status); return; }
      const rows = await res.json();
      const agg = {};
      (rows || []).forEach(function(r){
        const pid = String(r.product_id);
        if (!agg[pid]) agg[pid] = { sum: 0, count: 0 };
        agg[pid].sum += Number(r.rating) || 0;
        agg[pid].count += 1;
      });
      Object.keys(agg).forEach(function(pid){
        statsCache[pid] = {
          avg: agg[pid].count > 0 ? (agg[pid].sum / agg[pid].count) : 0,
          count: agg[pid].count
        };
      });
    } catch(e){
      console.warn('fetchStatsBatch error:', e);
    }
  }

  /* ── Update product cards ── */
  function updateCards(){
    const cards = $$('.product-card[data-name]');
    cards.forEach(function(card){
      const pid = card.getAttribute('data-name');
      if (!pid) return;
      const stats = statsCache[pid] || { avg: 0, count: 0 };

      // Find existing stars element
      let starsEl = card.querySelector('.stars');
      if (!starsEl){
        // Create one in .product-body
        const body = card.querySelector('.product-body');
        if (!body) return;
        starsEl = document.createElement('div');
        starsEl.className = 'stars';
        body.appendChild(starsEl);
      }

      // Replace with our own clickable version
      const isRTL = document.documentElement.dir === 'rtl';
      starsEl.className = 'stars rd-stars' + (stats.count === 0 ? ' rd-empty' : '');
      starsEl.setAttribute('data-product-id', pid);
      starsEl.innerHTML =
        '<span class="rd-icons">' + renderStars(stats.avg) + '</span>' +
        '<span class="rd-count">(' + stats.count + ')</span>';

      // Remove old listener via clone
      const clone = starsEl.cloneNode(true);
      starsEl.parentNode.replaceChild(clone, starsEl);

      clone.addEventListener('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        openModal(pid);
      });
    });
  }

  /* ── Init ── */
  async function init(){
    injectStyles();
    ensureModal();

    // Wait for product cards (products.js loads async)
    let attempts = 0;
    const waitForCards = setInterval(async function(){
      attempts++;
      const cards = $$('.product-card[data-name]');
      if (cards.length > 0 || attempts > 30){
        clearInterval(waitForCards);
        const ids = cards.map(function(c){ return c.getAttribute('data-name'); }).filter(Boolean);
        if (ids.length){
          await fetchStatsBatch(ids);
          updateCards();
        }
      }
    }, 500);

    // Re-run when products change
    if (window.PercentProducts && window.PercentProducts.onChange){
      window.PercentProducts.onChange(function(){
        setTimeout(async function(){
          const cards = $$('.product-card[data-name]');
          const ids = cards.map(function(c){ return c.getAttribute('data-name'); }).filter(Boolean);
          if (ids.length){
            const missing = ids.filter(function(id){ return !statsCache[id]; });
            if (missing.length){
              await fetchStatsBatch(missing);
            }
            updateCards();
          }
        }, 300);
      });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();