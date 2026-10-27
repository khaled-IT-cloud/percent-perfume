/* ============================================================
   PERCENT PERFUME — Testers Announcement Banner
   ============================================================ */
(function(){
  'use strict';

  // تحقق إذا كان الزبون قد أغلق الإعلان مسبقاً (يبقى مخفياً لمدة 3 أيام)
  var DISMISS_KEY = 'percent_testers_announced_v1';
  try {
    var dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && (Date.now() - parseInt(dismissed, 10)) < 3 * 24 * 60 * 60 * 1000) {
      return; // الإعلان مغلق مؤقتاً
    }
  } catch(e) {}

  function injectStyles(){
    if (document.getElementById('ptb-styles')) return;
    var style = document.createElement('style');
    style.id = 'ptb-styles';
    style.textContent = `
      .ptb-wrap {
        position: fixed;
        bottom: 24px;
        inset-inline-start: 24px;
        z-index: 99999;
        max-width: 400px;
        width: calc(100% - 48px);
        background: linear-gradient(145deg, #0a0a0a, #16161a);
        border: 1px solid rgba(201, 169, 97, 0.5);
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(201, 169, 97, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        transform: translateY(150%);
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        font-family: 'Almarai', sans-serif;
      }
      .ptb-wrap.show {
        transform: translateY(0);
      }
      .ptb-content {
        flex: 1;
        min-width: 0;
      }
      .ptb-title {
        display: block;
        color: #c9a961;
        font-weight: 800;
        font-size: 0.95rem;
        margin-bottom: 4px;
      }
      .ptb-desc {
        display: block;
        color: #a8a29b;
        font-size: 0.78rem;
        font-weight: 700;
        line-height: 1.5;
      }
      .ptb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        padding: 10px 18px;
        background: linear-gradient(120deg, #c9a961, #e8d4a2);
        color: #0a0a0a;
        font-weight: 800;
        font-size: 0.82rem;
        border-radius: 10px;
        text-decoration: none;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }
      .ptb-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(201, 169, 97, 0.3);
      }
      .ptb-close {
        position: absolute;
        top: -10px;
        inset-inline-end: -10px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #b91c1c;
        color: #fff;
        border: none;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        transition: transform 0.3s ease;
      }
      .ptb-close:hover {
        transform: scale(1.1) rotate(90deg);
      }

      /* هواتف: نرفع الإعلان فوق شريط التنقل السفلي */
      @media (max-width: 900px) {
        .ptb-wrap {
          bottom: calc(76px + env(safe-area-inset-bottom, 0px));
          inset-inline-start: 16px;
          width: calc(100% - 32px);
          flex-direction: column;
          align-items: stretch;
          text-align: center;
          padding: 16px;
          gap: 12px;
        }
        .ptb-btn {
          width: 100%;
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function injectBanner(){
    if (document.getElementById('ptb-wrap')) return;
    
    var banner = document.createElement('div');
    banner.id = 'ptb-wrap';
    banner.className = 'ptb-wrap';
    banner.innerHTML = `
      <button class="ptb-close" id="ptb-close" aria-label="إغلاق"><i class="fas fa-times"></i></button>
      <div class="ptb-content">
        <strong class="ptb-title">
          <span class="lang-ar">✨ عطور التست صارت متوفرة!</span>
          <span class="lang-en">✨ Testers are finally here!</span>
        </strong>
        <span class="ptb-desc">
          <span class="lang-ar">جرّب أي عطر قبل ما تشتريه — واختار 3 تيسترات بـ 6 دنانير.</span>
          <span class="lang-en">Try any scent before buying — pick 3 testers for 6 JOD.</span>
        </span>
      </div>
      <a href="testers.html" class="ptb-btn">
        <i class="fas fa-flask" style="margin-inline-end: 6px;"></i>
        <span class="lang-ar">اكتشف الآن</span>
        <span class="lang-en">Discover Now</span>
      </a>
    `;
    document.body.appendChild(banner);

    // تأثير الظهور بعد نصف ثانية
    setTimeout(function(){
      banner.classList.add('show');
    }, 500);

    // زر الإغلاق
    document.getElementById('ptb-close').addEventListener('click', function(){
      banner.classList.remove('show');
      try {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
      } catch(e) {}
      setTimeout(function(){
        banner.remove();
      }, 600);
    });
  }

  // التهيئة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      injectStyles();
      setTimeout(injectBanner, 1000); // تأخير بسيط حتى يثبت كود الموقع الأساسي
    });
  } else {
    injectStyles();
    setTimeout(injectBanner, 1000);
  }
})();