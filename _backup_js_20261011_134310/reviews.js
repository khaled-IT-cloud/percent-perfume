/* ============================================================
   PERCENT PERFUME — Product Reviews UI (Phase 4.1)
   Shows review form for delivered orders in customer-service.html
   ============================================================ */
(function(){
  'use strict';

  const SUPABASE_URL = 'https://iedmrzocqgscnybpvxed.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Q_vZjEcX-bN6Dkyee3jN5g_TWlovcPQ';
  const HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  function $(s, c){ c = c || document; return c.querySelector(s); }

  function esc(s){
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  /* ── Inject styles ── */
  function injectStyles(){
    if (document.getElementById('reviewsStyles')) return;
    const s = document.createElement('style');
    s.id = 'reviewsStyles';
    s.textContent = [
      '.reviews-section{display:none;margin-top:24px;padding:24px;background:#fff;border:1px solid rgba(10,17,40,.12);border-top:3px solid #d4af37;border-radius:16px;animation:rvFade .4s ease}',
      '@keyframes rvFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '.reviews-head{display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px dashed rgba(212,175,55,.3)}',
      '.reviews-head-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(145deg,#0a1128,#1d2c58);border:1px solid rgba(212,175,55,.4);display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:1.2rem;flex-shrink:0}',
      '.reviews-head h2{font-family:"Playfair Display",serif;font-size:1.2rem;color:#0a1128;margin:0 0 4px;letter-spacing:.5px}',
      '.reviews-head p{font-size:.82rem;color:#6b7280;margin:0;font-weight:700}',
      '.reviews-list{display:flex;flex-direction:column;gap:14px}',
      '.review-card{display:grid;grid-template-columns:72px 1fr;gap:14px;padding:16px;background:#fafbfc;border:1px solid #e5e7eb;border-radius:14px;transition:all .25s ease}',
      '.review-card.is-done{background:linear-gradient(140deg,#ecfdf5,#d1fae5);border-color:rgba(16,185,129,.35)}',
      '.review-thumb{width:72px;height:72px;border-radius:12px;overflow:hidden;background:linear-gradient(150deg,#0a1128,#1d2c58);display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:1.4rem}',
      '.review-thumb img{width:100%;height:100%;object-fit:cover}',
      '.review-body{min-width:0}',
      '.review-name{font-weight:800;color:#0a1128;font-size:.95rem;margin-bottom:10px}',
      '.review-stars{display:flex;gap:4px;margin-bottom:10px}',
      '.star-btn{background:none;border:none;padding:2px 4px;cursor:pointer;font-size:1.4rem;color:#d4d7dd;transition:all .2s ease}',
      '.star-btn:hover{transform:scale(1.15)}',
      '.star-btn .fas{color:#d4af37}',
      '.review-title-input,.review-comment-input{width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:inherit;font-size:.88rem;font-weight:700;color:#0a1128;background:#fff;outline:none;transition:all .2s ease;margin-bottom:8px;box-sizing:border-box}',
      '.review-comment-input{resize:vertical;min-height:70px;line-height:1.6}',
      '.review-title-input:focus,.review-comment-input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.12)}',
      '.review-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px}',
      '.review-error{color:#b91c1c;font-size:.78rem;font-weight:700;flex:1}',
      '.review-submit-btn{padding:10px 22px;border-radius:10px;background:#0a1128;color:#d4af37;border:none;cursor:pointer;font-family:inherit;font-weight:800;font-size:.82rem;display:inline-flex;align-items:center;gap:8px;transition:all .25s ease}',
      '.review-submit-btn:hover:not(:disabled){background:#1d2c58;transform:translateY(-2px)}',
      '.review-submit-btn:disabled{opacity:.6;cursor:not-allowed}',
      '.review-done-msg{display:flex;align-items:center;gap:8px;font-size:.88rem;color:#047857;font-weight:800;padding:12px;background:rgba(16,185,129,.08);border-radius:10px}',
      '.review-done-msg i{color:#10b981;font-size:1rem}',
      '@media(max-width:600px){.review-card{grid-template-columns:1fr}.review-thumb{width:56px;height:56px}.reviews-head{flex-direction:column;text-align:center}.review-footer{flex-direction:column;align-items:stretch}.review-submit-btn{width:100%;justify-content:center}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── Ensure container after support chat ── */
  function ensureContainer(){
    var el = document.getElementById('reviewsSection');
    if (el) return el;
    var chat = document.getElementById('supportChat');
    if (!chat || !chat.parentNode) return null;
    el = document.createElement('section');
    el.id = 'reviewsSection';
    el.className = 'reviews-section';
    chat.parentNode.insertBefore(el, chat.nextSibling);
    return el;
  }

  function hideContainer(){
    var el = document.getElementById('reviewsSection');
    if (el){ el.innerHTML = ''; el.style.display = 'none'; }
  }

  /* ── Render review form for order ── */
  async function renderForOrder(orderNumber){
    var container = ensureContainer();
    if (!container) return;

    var orders = (window.PercentCart && window.PercentCart.getOrders()) || [];
    var order = null;
    for (var i = 0; i < orders.length; i++){
      if (orders[i].orderNumber === orderNumber){ order = orders[i]; break; }
    }
    if (!order){ hideContainer(); return; }

    var status = order.status || 'pending';
    if (status !== 'delivered'){ hideContainer(); return; }

    var items = order.items || [];
    if (!items.length){ hideContainer(); return; }

    // Fetch already-reviewed product IDs for this order
    var reviewedIds = {};
    try {
      var r = await fetch(
        SUPABASE_URL + '/rest/v1/product_reviews?order_number=eq.' + encodeURIComponent(orderNumber) + '&select=product_id',
        { headers: HEADERS }
      );
      if (r.ok){
        var rows = await r.json();
        (rows || []).forEach(function(row){ reviewedIds[String(row.product_id)] = true; });
      }
    } catch(e){}

    var html = '' +
      '<div class="reviews-head">' +
        '<div class="reviews-head-icon"><i class="fas fa-star"></i></div>' +
        '<div>' +
          '<h2>قيّم منتجاتك</h2>' +
          '<p>رأيك يساعد الآخرين — قيّم كل منتج طلبته</p>' +
        '</div>' +
      '</div>' +
      '<div class="reviews-list">';

    items.forEach(function(it){
      var pid = String(it.id);
      var already = reviewedIds[pid];
      var name = it.nameAr || it.nameEn || '';
      var img = it.image ? '<img src="' + esc(it.image) + '" alt="" onerror="this.remove()">' : '<i class="fas fa-spray-can-sparkles"></i>';

      html += '<div class="review-card' + (already ? ' is-done' : '') + '" data-product-id="' + esc(pid) + '">' +
        '<div class="review-thumb">' + img + '</div>' +
        '<div class="review-body">' +
          '<div class="review-name">' + esc(name) + '</div>';

      if (already){
        html += '<div class="review-done-msg"><i class="fas fa-check-circle"></i> تم إرسال تقييمك — شكراً لك!</div>';
      } else {
        html += '' +
          '<div class="review-stars" data-rating="0">' +
            '<button type="button" class="star-btn" data-value="1"><i class="far fa-star"></i></button>' +
            '<button type="button" class="star-btn" data-value="2"><i class="far fa-star"></i></button>' +
            '<button type="button" class="star-btn" data-value="3"><i class="far fa-star"></i></button>' +
            '<button type="button" class="star-btn" data-value="4"><i class="far fa-star"></i></button>' +
            '<button type="button" class="star-btn" data-value="5"><i class="far fa-star"></i></button>' +
          '</div>' +
          '<input type="text" class="review-title-input" placeholder="عنوان التقييم (اختياري)" maxlength="80">' +
          '<textarea class="review-comment-input" placeholder="شاركنا رأيك في العطر..." rows="3" maxlength="500"></textarea>' +
          '<div class="review-footer">' +
            '<span class="review-error"></span>' +
            '<button type="button" class="review-submit-btn"><i class="fas fa-paper-plane"></i> إرسال التقييم</button>' +
          '</div>';
      }

      html += '</div></div>';
    });

    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';

    bindStars(container);
    bindSubmits(container, orderNumber);
  }

  function setStars(stars, val){
    var btns = stars.querySelectorAll('.star-btn');
    for (var i = 0; i < btns.length; i++){
      var v = parseInt(btns[i].getAttribute('data-value'), 10);
      var icon = btns[i].querySelector('i');
      icon.className = (v <= val) ? 'fas fa-star' : 'far fa-star';
    }
  }

  function bindStars(container){
    var groups = container.querySelectorAll('.review-stars');
    for (var i = 0; i < groups.length; i++){
      (function(stars){
        var btns = stars.querySelectorAll('.star-btn');
        for (var j = 0; j < btns.length; j++){
          (function(btn){
            btn.addEventListener('mouseenter', function(){
              setStars(stars, parseInt(btn.getAttribute('data-value'), 10));
            });
            btn.addEventListener('click', function(){
              var v = parseInt(btn.getAttribute('data-value'), 10);
              stars.setAttribute('data-rating', v);
              setStars(stars, v);
            });
          })(btns[j]);
        }
        stars.addEventListener('mouseleave', function(){
          setStars(stars, parseInt(stars.getAttribute('data-rating'), 10) || 0);
        });
      })(groups[i]);
    }
  }

  function bindSubmits(container, orderNumber){
    var btns = container.querySelectorAll('.review-submit-btn');
    for (var i = 0; i < btns.length; i++){
      (function(btn){
        btn.addEventListener('click', async function(){
          var card = btn.closest('.review-card');
          var productId = card.getAttribute('data-product-id');
          var stars = card.querySelector('.review-stars');
          var rating = parseInt(stars.getAttribute('data-rating'), 10) || 0;
          var title = card.querySelector('.review-title-input').value.trim();
          var comment = card.querySelector('.review-comment-input').value.trim();
          var errBox = card.querySelector('.review-error');

          if (rating < 1){ errBox.textContent = 'يرجى اختيار عدد النجوم'; return; }
          if (comment.length < 3){ errBox.textContent = 'اكتب تعليقاً (3 أحرف على الأقل)'; return; }

          errBox.textContent = '';
          btn.disabled = true;
          var original = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ الإرسال...';

          try {
            var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/submit_product_review', {
              method: 'POST',
              headers: HEADERS,
              body: JSON.stringify({
                p_product_id: productId,
                p_order_number: orderNumber,
                p_rating: rating,
                p_comment: comment,
                p_title: title || null
              })
            });
            var result = await res.json();
            if (result && result.ok){
              card.classList.add('is-done');
              var body = card.querySelector('.review-body');
              body.innerHTML = '<div class="review-done-msg"><i class="fas fa-check-circle"></i> تم إرسال تقييمك — سيظهر بعد مراجعة الإدارة</div>';
            } else {
              var reason = (result && result.reason) || 'unknown';
              var map = {
                invalid_rating: 'عدد النجوم غير صحيح',
                comment_too_short: 'التعليق قصير جداً',
                order_not_found: 'الطلب غير موجود',
                product_not_in_order: 'المنتج ليس في هذا الطلب',
                already_reviewed: 'قيّمت هذا المنتج مسبقاً',
                missing_customer_info: 'بيانات العميل ناقصة'
              };
              errBox.textContent = map[reason] || ('خطأ: ' + reason);
              btn.disabled = false;
              btn.innerHTML = original;
            }
          } catch(e){
            errBox.textContent = 'خطأ في الشبكة — حاول لاحقاً';
            btn.disabled = false;
            btn.innerHTML = original;
          }
        });
      })(btns[i]);
    }
  }

  /* ── Listen for order events ── */
  window.addEventListener('percent:orderOpened', function(e){
    var n = e && e.detail && e.detail.orderNumber;
    if (n) renderForOrder(n);
  });

  window.addEventListener('percent:orderClosed', function(){
    hideContainer();
  });

  /* ── Init ── */
  function init(){
    injectStyles();
    ensureContainer();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();