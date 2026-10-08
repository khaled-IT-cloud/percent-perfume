/* ============================================================
   PERCENT ADMIN — Reviews Management (Phase 4.1 Part 4)
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

  function getJWT(){
    return localStorage.getItem('percent_admin_token')
        || sessionStorage.getItem('percent_admin_token') || '';
  }

  function api(path, opts){
    opts = opts || {};
    const h = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + getJWT(),
      'Content-Type': 'application/json'
    };
    if (opts.headers) Object.assign(h, opts.headers);
    return fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, opts, { headers: h }));
  }

  let reviewsCache = [];
  let filterStatus = 'pending';
  let searchQuery = '';

  /* ── Inject CSS ── */
  function injectStyles(){
    if (document.getElementById('adminReviewsStyles')) return;
    const s = document.createElement('style');
    s.id = 'adminReviewsStyles';
    s.textContent = [
      '.rv-status-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:800;white-space:nowrap}',
      '.rv-status-badge.pending{background:rgba(245,158,11,.14);color:#b45309}',
      '.rv-status-badge.approved{background:rgba(16,185,129,.14);color:#047857}',
      '.rv-status-badge.rejected{background:rgba(239,68,68,.14);color:#b91c1c}',
      '.rv-stars-display{color:#d4af37;font-size:.85rem;letter-spacing:2px}',
      '.rv-comment-preview{font-size:.82rem;color:#374151;font-weight:700;max-width:340px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.rv-reply-box{margin-top:10px;padding:12px;background:linear-gradient(140deg,#fff9ec,#fdf3dd);border:1px solid rgba(212,175,55,.4);border-radius:10px;font-size:.82rem;color:#374151;font-weight:700}',
      '.rv-reply-box strong{display:block;color:#8f6b12;margin-bottom:4px}',
      '.rv-empty{padding:60px 20px;text-align:center;color:#6b7280}',
      '.rv-empty i{font-size:2.8rem;color:rgba(212,175,55,.4);display:block;margin-bottom:14px}',
      '.rv-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── Inject nav button ── */
  function injectNavButton(){
    if (document.getElementById('navReviews')) return;
    const nav = $('.sidebar-nav');
    if (!nav) return;

    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.id = 'navReviews';
    btn.setAttribute('data-section', 'reviews');
    btn.innerHTML = '<i class="fas fa-star"></i><span>التقييمات</span><span class="nav-badge" id="reviewsNavBadge"></span>';

    // Insert after coupons button
    const couponsBtn = nav.querySelector('[data-section="coupons"]');
    if (couponsBtn && couponsBtn.nextSibling){
      nav.insertBefore(btn, couponsBtn.nextSibling);
    } else {
      nav.appendChild(btn);
    }

    btn.addEventListener('click', function(){
      switchToSection('reviews');
    });
  }

  /* ── Inject section ── */
  function injectSection(){
    if (document.getElementById('reviewsSectionAdmin')) return;
    const main = $('.admin-main');
    if (!main) return;

    const section = document.createElement('section');
    section.className = 'admin-section';
    section.id = 'reviewsSectionAdmin';
    section.setAttribute('data-section', 'reviews');
    section.innerHTML = [
      '<div class="card">',
      '  <div class="filters-bar">',
      '    <div class="search-field">',
      '      <i class="fas fa-search"></i>',
      '      <input type="text" id="rvSearch" placeholder="ابحث بالاسم، الرقم، أو الطلب...">',
      '    </div>',
      '    <div class="filter-chips" id="rvFilters">',
      '      <button class="filter-chip active" data-rv-filter="pending"><span>بانتظار الموافقة</span><span class="count" id="rvCountPending">0</span></button>',
      '      <button class="filter-chip" data-rv-filter="approved"><span>موافق عليها</span><span class="count" id="rvCountApproved">0</span></button>',
      '      <button class="filter-chip" data-rv-filter="rejected"><span>مرفوضة</span><span class="count" id="rvCountRejected">0</span></button>',
      '      <button class="filter-chip" data-rv-filter="all"><span>الكل</span><span class="count" id="rvCountAll">0</span></button>',
      '    </div>',
      '    <button class="export-btn" id="rvRefreshBtn"><i class="fas fa-sync-alt"></i><span>تحديث</span></button>',
      '  </div>',
      '  <div class="card-body p-0">',
      '    <div class="table-wrap">',
      '      <table class="data-table">',
      '        <thead><tr>',
      '          <th>المنتج</th>',
      '          <th>العميل</th>',
      '          <th>الطلب</th>',
      '          <th>التقييم</th>',
      '          <th>التعليق</th>',
      '          <th>الحالة</th>',
      '          <th>التاريخ</th>',
      '          <th></th>',
      '        </tr></thead>',
      '        <tbody id="rvBody"></tbody>',
      '      </table>',
      '    </div>',
      '    <div id="rvEmpty"></div>',
      '  </div>',
      '</div>'
    ].join('');
    main.appendChild(section);
  }

  /* ── Custom section switcher ── */
  function switchToSection(name){
    // Deactivate all
    $$('.nav-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.section === name); });
    $$('.admin-section').forEach(function(s){ s.classList.toggle('active', s.dataset.section === name); });

    // Update title
    const titles = {
      reviews: { t: 'التقييمات', s: 'إدارة تقييمات العملاء والموافقة عليها' }
    };
    if (titles[name]){
      const t = $('#pageTitle'); const p = $('#pageSub');
      if (t) t.textContent = titles[name].t;
      if (p) p.textContent = titles[name].s;
    }

    if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
    loadReviews();
  }

  /* ── Fetch from Supabase ── */
  async function fetchReviews(){
    try {
      const res = await api('product_reviews?select=*&order=created_at.desc&limit=500');
      if (!res.ok){ console.error('fetchReviews:', res.status); return []; }
      const data = await res.json();
      reviewsCache = data || [];
      updateCounts();
      return reviewsCache;
    } catch(e){
      console.error('fetchReviews error:', e);
      return [];
    }
  }

  function updateCounts(){
    const counts = { pending: 0, approved: 0, rejected: 0, all: reviewsCache.length };
    reviewsCache.forEach(function(r){
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    const set = function(id, v){ const el = $(id); if (el) el.textContent = v; };
    set('#rvCountPending', counts.pending);
    set('#rvCountApproved', counts.approved);
    set('#rvCountRejected', counts.rejected);
    set('#rvCountAll', counts.all);

    // Sidebar badge = pending
    const badge = $('#reviewsNavBadge');
    if (badge){
      badge.textContent = counts.pending || '';
      if (counts.pending > 0){ badge.classList.add('danger'); }
      else { badge.classList.remove('danger'); }
    }
  }

  /* ── Render ── */
  function render(){
    const body = $('#rvBody');
    const empty = $('#rvEmpty');
    if (!body) return;

    let list = reviewsCache.slice();
    if (filterStatus !== 'all') list = list.filter(function(r){ return r.status === filterStatus; });
    if (searchQuery){
      const q = searchQuery.toLowerCase();
      list = list.filter(function(r){
        return [r.customer_name, r.customer_phone, r.order_number, r.comment, r.product_id]
          .filter(Boolean).join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (!list.length){
      body.innerHTML = '';
      empty.innerHTML = '<div class="rv-empty"><i class="fas fa-star"></i><strong style="display:block;color:#0a1128;margin-bottom:6px;font-size:1rem">' +
        (reviewsCache.length ? 'لا توجد نتائج مطابقة' : 'لا توجد تقييمات بعد') +
        '</strong><p style="font-size:.84rem">' +
        (reviewsCache.length ? 'جرب فلتراً آخر' : 'ستظهر التقييمات هنا بعد إرسال العملاء لها') +
        '</p></div>';
      return;
    }

    empty.innerHTML = '';
    body.innerHTML = list.map(function(r){
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const name = r.customer_name || '—';
      const initials = (name.trim().split(/\s+/).map(function(w){ return w[0]; }).slice(0,2).join('') || '?').toUpperCase();
      const date = new Date(r.created_at).toLocaleDateString('ar-JO', { year:'numeric', month:'2-digit', day:'2-digit' });
      const titleLine = r.title ? '<strong style="display:block;color:#0a1128;font-size:.86rem;margin-bottom:4px">' + esc(r.title) + '</strong>' : '';
      const replyBox = r.admin_reply
        ? '<div class="rv-reply-box"><strong><i class="fas fa-reply"></i> ردك:</strong>' + esc(r.admin_reply) + '</div>'
        : '';
      const statusLabel = { pending:'بانتظار الموافقة', approved:'موافق عليها', rejected:'مرفوضة' }[r.status] || r.status;

      return '<tr data-rv-id="' + esc(r.id) + '">' +
        '<td><span style="font-size:.78rem;color:#6b7280;font-weight:700;direction:ltr" title="' + esc(r.product_id) + '">' + esc(r.product_id.length > 24 ? r.product_id.slice(0,22) + '…' : r.product_id) + '</span></td>' +
        '<td><div class="customer-cell"><div class="customer-avatar">' + initials + '</div><div style="min-width:0"><strong>' + esc(name) + '</strong><small dir="ltr">' + esc(r.customer_phone || '') + '</small></div></div></td>' +
        '<td><span class="order-num" style="font-size:.78rem">' + esc(r.order_number) + '</span></td>' +
        '<td><span class="rv-stars-display">' + stars + '</span></td>' +
        '<td><div>' + titleLine + '<div class="rv-comment-preview">' + esc(r.comment) + '</div>' + replyBox + '</div></td>' +
        '<td><span class="rv-status-badge ' + r.status + '">' + statusLabel + '</span></td>' +
        '<td><span style="font-size:.78rem;color:#6b7280;font-weight:700">' + date + '</span></td>' +
        '<td><div class="rv-actions">' +
          (r.status === 'pending'
            ? '<button class="icon-action success" data-rv-act="approve" title="موافقة"><i class="fas fa-check"></i></button>' +
              '<button class="icon-action danger" data-rv-act="reject" title="رفض"><i class="fas fa-times"></i></button>'
            : '') +
          '<button class="icon-action gold" data-rv-act="reply" title="رد الإدارة"><i class="fas fa-reply"></i></button>' +
          '<button class="icon-action danger" data-rv-act="delete" title="حذف"><i class="fas fa-trash-can"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    // Bind actions
    $$('#rvBody [data-rv-act]').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        const tr = b.closest('tr');
        const id = tr && tr.getAttribute('data-rv-id');
        const act = b.getAttribute('data-rv-act');
        if (!id) return;
        if (act === 'approve') doAction(id, 'approved');
        else if (act === 'reject') doAction(id, 'rejected');
        else if (act === 'delete') doDelete(id);
        else if (act === 'reply') doReply(id);
      });
    });
  }

  async function doAction(id, status){
    try {
      const res = await api('product_reviews?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: status })
      });
      if (!res.ok){
        alert('فشل التحديث: ' + res.status);
        return;
      }
      // Update local cache
      for (let i = 0; i < reviewsCache.length; i++){
        if (reviewsCache[i].id === id) reviewsCache[i].status = status;
      }
      updateCounts();
      render();
      if (window.showToast) window.showToast(status === 'approved' ? 'تم قبول التقييم' : 'تم رفض التقييم', 'fa-check-circle', 'success');
    } catch(e){
      alert('خطأ: ' + e.message);
    }
  }

  async function doDelete(id){
    if (!confirm('حذف هذا التقييم نهائياً؟')) return;
    try {
      const res = await api('product_reviews?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      if (!res.ok){ alert('فشل الحذف: ' + res.status); return; }
      reviewsCache = reviewsCache.filter(function(r){ return r.id !== id; });
      updateCounts();
      render();
      if (window.showToast) window.showToast('تم حذف التقييم', 'fa-trash-can', 'success');
    } catch(e){ alert('خطأ: ' + e.message); }
  }

  async function doReply(id){
    const r = reviewsCache.find(function(x){ return x.id === id; });
    if (!r) return;
    const current = r.admin_reply || '';
    const reply = prompt('اكتب رد الإدارة على هذا التقييم:', current);
    if (reply === null) return;
    const trimmed = reply.trim();
    try {
      const res = await api('product_reviews?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          admin_reply: trimmed || null,
          admin_reply_at: trimmed ? new Date().toISOString() : null
        })
      });
      if (!res.ok){ alert('فشل الحفظ: ' + res.status); return; }
      r.admin_reply = trimmed || null;
      r.admin_reply_at = trimmed ? new Date().toISOString() : null;
      render();
      if (window.showToast) window.showToast('تم حفظ الرد', 'fa-check-circle', 'success');
    } catch(e){ alert('خطأ: ' + e.message); }
  }

  async function loadReviews(){
    await fetchReviews();
    render();
  }

  /* ── Init ── */
  function init(){
    injectStyles();
    injectNavButton();
    injectSection();

    // Filter chips
    $$('#rvFilters [data-rv-filter]').forEach(function(b){
      b.addEventListener('click', function(){
        filterStatus = b.getAttribute('data-rv-filter');
        $$('#rvFilters .filter-chip').forEach(function(x){ x.classList.toggle('active', x === b); });
        render();
      });
    });

    // Search
    const searchInput = $('#rvSearch');
    if (searchInput){
      let timer = null;
      searchInput.addEventListener('input', function(e){
        clearTimeout(timer);
        timer = setTimeout(function(){
          searchQuery = e.target.value.trim().toLowerCase();
          render();
        }, 220);
      });
    }

    // Refresh
    const refreshBtn = $('#rvRefreshBtn');
    if (refreshBtn){
      refreshBtn.addEventListener('click', async function(){
        const icon = refreshBtn.querySelector('i');
        icon.style.transition = 'transform .6s ease';
        icon.style.transform = 'rotate(360deg)';
        await loadReviews();
        setTimeout(function(){ icon.style.transform = ''; }, 650);
      });
    }

    // Initial load (silent — updates badge)
    fetchReviews().then(function(){ render(); });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Wait a bit for admin app to be ready
    setTimeout(init, 400);
  }
})();