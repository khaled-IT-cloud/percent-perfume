/* ============================================================
   PERCENT PERFUME — Testers Coming Soon
   - Adds "Testers" nav link to every page
   - Opens a modal with "under construction" message
   - WhatsApp button with pre-written message
   - Hides brand text on mobile (logo only)
   ============================================================ */
(function(){
  'use strict';
  if (window.__percentTestersLoaded) return;
  window.__percentTestersLoaded = true;

  var WHATSAPP_NUMBER = '962794440551';
  var WHATSAPP_MESSAGE_AR = 'مرحباً، أريد الاستفسار عن عطور التست (5ml) — متى ستتوفر في المتجر؟';
  var WHATSAPP_MESSAGE_EN = 'Hello, I would like to ask about the testers (5ml) — when will they be available?';

  function getLang(){
    return document.documentElement.dataset.lang || document.documentElement.lang || 'ar';
  }

  /* ═══════════════════════════════════════════════
     CSS
     ═══════════════════════════════════════════════ */
  function injectStyles(){
    if (document.getElementById('testers-coming-soon-styles')) return;
    var style = document.createElement('style');
    style.id = 'testers-coming-soon-styles';
    style.textContent = `
      /* ═══ Hide brand text on mobile — logo only ═══ */
      @media (max-width: 900px) {
        .brand-text {
          display: none !important;
        }
        .brand {
          gap: 0 !important;
        }
        .brand-mark {
          width: 42px !important;
          height: 42px !important;
        }
      }

      /* ═══ Testers Modal Overlay ═══ */
      .pctest-overlay {
        position: fixed;
        inset: 0;
        background: rgba(5, 5, 5, .72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        transition: opacity .35s ease, visibility .35s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .pctest-overlay.show {
        opacity: 1;
        visibility: visible;
      }

      /* ═══ Modal Card ═══ */
      .pctest-modal {
        background: #faf8f3;
        border-radius: 24px;
        width: 100%;
        max-width: 480px;
        padding: 44px 34px 32px;
        text-align: center;
        position: relative;
        box-shadow: 0 40px 100px rgba(0, 0, 0, .5), 0 0 60px rgba(201, 169, 97, .08);
        border: 1px solid rgba(201, 169, 97, .35);
        transform: translateY(24px) scale(.94);
        transition: transform .4s cubic-bezier(.22, 1, .36, 1);
        overflow: hidden;
      }
      .pctest-overlay.show .pctest-modal {
        transform: translateY(0) scale(1);
      }
      .pctest-modal::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 4px;
        background: linear-gradient(90deg, #a8874a, #e8d4a2, #c9a961, #a8874a);
      }

      /* ═══ Icon ═══ */
      .pctest-icon {
        width: 92px;
        height: 92px;
        margin: 0 auto 22px;
        border-radius: 50%;
        background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
        border: 2px solid rgba(201, 169, 97, .5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c9a961;
        font-size: 2rem;
        position: relative;
        animation: pctestFloat 3.2s ease-in-out infinite;
      }
      @keyframes pctestFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .pctest-icon::after {
        content: '';
        position: absolute;
        inset: -14px;
        border-radius: 50%;
        border: 1px dashed rgba(201, 169, 97, .35);
        animation: pctestSpin 22s linear infinite;
      }
      @keyframes pctestSpin {
        to { transform: rotate(360deg); }
      }

      /* ═══ Badge ═══ */
      .pctest-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border-radius: 30px;
        background: rgba(201, 169, 97, .15);
        border: 1px solid rgba(201, 169, 97, .45);
        color: #a8874a;
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: 2px;
        margin-bottom: 16px;
        text-transform: uppercase;
      }
      .pctest-badge::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #c9a961;
        box-shadow: 0 0 0 3px rgba(201, 169, 97, .25);
        animation: pctestBlink 1.6s ease-in-out infinite;
      }
      @keyframes pctestBlink {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: .5; transform: scale(.85); }
      }

      /* ═══ Text ═══ */
      .pctest-modal h3 {
        font-family: 'Playfair Display', serif;
        font-size: 1.75rem;
        color: #0a0a0a;
        margin-bottom: 12px;
        line-height: 1.3;
        letter-spacing: .5px;
      }
      .pctest-modal p.pctest-sub {
        color: #6b6459;
        font-size: .93rem;
        line-height: 1.8;
        margin-bottom: 28px;
        font-weight: 700;
      }

      /* ═══ Actions ═══ */
      .pctest-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pctest-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 15px 22px;
        border-radius: 14px;
        font-family: inherit;
        font-weight: 800;
        font-size: .95rem;
        cursor: pointer;
        border: none;
        transition: all .3s cubic-bezier(.22, 1, .36, 1);
        text-decoration: none;
        letter-spacing: .3px;
      }
      .pctest-btn.whatsapp {
        background: linear-gradient(135deg, #25D366, #128C7E);
        color: #fff;
        box-shadow: 0 10px 28px rgba(37, 211, 102, .35);
      }
      .pctest-btn.whatsapp:hover {
        transform: translateY(-3px);
        box-shadow: 0 14px 34px rgba(37, 211, 102, .5);
      }
      .pctest-btn.home {
        background: linear-gradient(135deg, #0a0a0a, #16161a);
        color: #c9a961;
        box-shadow: 0 8px 20px rgba(10, 10, 10, .25);
        border: 1px solid rgba(201, 169, 97, .3);
      }
      .pctest-btn.home:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(10, 10, 10, .35);
        background: linear-gradient(135deg, #c9a961, #e8d4a2);
        color: #0a0a0a;
      }
      .pctest-btn i {
        font-size: 1.15rem;
      }

      /* ═══ Close ═══ */
      .pctest-close {
        position: absolute;
        top: 14px;
        inset-inline-end: 14px;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(10, 10, 10, .06);
        border: none;
        color: #6b6459;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: .88rem;
        transition: all .3s cubic-bezier(.22, 1, .36, 1);
        padding: 0;
      }
      .pctest-close:hover {
        background: #b91c1c;
        color: #fff;
        transform: rotate(90deg);
      }

      /* ═══ Mobile ═══ */
      @media (max-width: 480px) {
        .pctest-overlay {
          padding: 0;
          align-items: flex-end;
        }
        .pctest-modal {
          padding: 40px 22px calc(24px + env(safe-area-inset-bottom, 0px));
          border-radius: 24px 24px 0 0;
          max-width: 100%;
          transform: translateY(100%);
        }
        .pctest-overlay.show .pctest-modal {
          transform: translateY(0);
        }
        .pctest-modal h3 {
          font-size: 1.4rem;
        }
        .pctest-icon {
          width: 78px;
          height: 78px;
          font-size: 1.7rem;
        }
      }

      /* ═══ Dark Mode ═══ */
      html.dark-mode .pctest-modal {
        background: #16161a;
        border-color: rgba(201, 169, 97, .4);
      }
      html.dark-mode .pctest-modal::before {
        background: linear-gradient(90deg, #a8874a, #e8d4a2, #c9a961, #a8874a);
      }
      html.dark-mode .pctest-modal h3 {
        color: #f5f1e8;
      }
      html.dark-mode .pctest-modal p.pctest-sub {
        color: #a8a29b;
      }
      html.dark-mode .pctest-close {
        background: rgba(255, 255, 255, .08);
        color: #a8a29b;
      }
      html.dark-mode .pctest-close:hover {
        background: #b91c1c;
        color: #fff;
      }
      html.dark-mode .pctest-btn.home {
        background: linear-gradient(135deg, #1a1a1e, #0a0a0a);
        border-color: rgba(201, 169, 97, .4);
      }
      html.dark-mode .pctest-btn.home:hover {
        background: linear-gradient(135deg, #c9a961, #e8d4a2);
        color: #0a0a0a;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════
     MODAL HTML
     ═══════════════════════════════════════════════ */
  function injectModal(){
    if (document.getElementById('pctestOverlay')) return;
    var html = '' +
      '<div class="pctest-overlay" id="pctestOverlay" role="dialog" aria-modal="true" aria-labelledby="pctestTitle">' +
        '<div class="pctest-modal">' +
          '<button class="pctest-close" id="pctestClose" type="button" aria-label="إغلاق"><i class="fas fa-times"></i></button>' +
          '<div class="pctest-icon"><i class="fas fa-flask"></i></div>' +
          '<div class="pctest-badge">' +
            '<span class="lang-ar">قيد الإنشاء</span>' +
            '<span class="lang-en">Coming Soon</span>' +
          '</div>' +
          '<h3 id="pctestTitle">' +
            '<span class="lang-ar">عطور التست قريباً</span>' +
            '<span class="lang-en">Testers Coming Soon</span>' +
          '</h3>' +
          '<p class="pctest-sub">' +
            '<span class="lang-ar">نعمل حالياً على تجهيز قسم <strong>عطور التست (5ml)</strong> لتتمكن من تجربة أي عطر قبل شرائه. نعتذر عن الإزعاج!</span>' +
            '<span class="lang-en">We are currently preparing the <strong>Testers (5ml)</strong> section so you can try any perfume before buying it. Sorry for the inconvenience!</span>' +
          '</p>' +
          '<div class="pctest-actions">' +
            '<a class="pctest-btn whatsapp" id="pctestWhatsapp" target="_blank" rel="noopener noreferrer">' +
              '<i class="fab fa-whatsapp"></i>' +
              '<span class="lang-ar">استفسر على واتساب</span>' +
              '<span class="lang-en">Ask on WhatsApp</span>' +
            '</a>' +
            '<a class="pctest-btn home" href="index.html">' +
              '<i class="fas fa-home"></i>' +
              '<span class="lang-ar">العودة للصفحة الرئيسية</span>' +
              '<span class="lang-en">Back to Home</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ═══════════════════════════════════════════════
     MODAL CONTROLS
     ═══════════════════════════════════════════════ */
  function openModal(){
    var ov = document.getElementById('pctestOverlay');
    if (!ov) return;
    ov.classList.add('show');
    document.body.style.overflow = 'hidden';
    if (window.mHaptic) window.mHaptic(12);
  }
  function closeModal(){
    var ov = document.getElementById('pctestOverlay');
    if (!ov) return;
    ov.classList.remove('show');
    document.body.style.overflow = '';
    if (window.mHaptic) window.mHaptic(8);
  }

  /* ═══════════════════════════════════════════════
     NAV LINK
     ═══════════════════════════════════════════════ */
  function addTestersLink(){
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Already exists?
    if (navLinks.querySelector('[data-testers-link]')) return;

    // Existing testers.html link?
    var existing = navLinks.querySelector('a[href="testers.html"]');
    if (existing){
      existing.setAttribute('data-testers-link', '1');
      return;
    }

    // Create new link
    var link = document.createElement('a');
    link.href = 'testers.html';
    link.setAttribute('data-testers-link', '1');
    link.innerHTML = '<span class="lang-ar">عطور التست</span><span class="lang-en">Testers</span>';

    // Insert after "men.html" link or before "loyalty.html"
    var menLink = navLinks.querySelector('a[href="men.html"]');
    var loyaltyLink = navLinks.querySelector('a[href="loyalty.html"]');

    if (menLink && menLink.parentNode === navLinks){
      menLink.parentNode.insertBefore(link, menLink.nextSibling);
    } else if (loyaltyLink && loyaltyLink.parentNode === navLinks){
      navLinks.insertBefore(link, loyaltyLink);
    } else {
      navLinks.appendChild(link);
    }
  }

  /* ═══════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════ */
  function bindEvents(){
    // Intercept clicks on testers links
    document.addEventListener('click', function(e){
      var link = e.target.closest('a[data-testers-link], a[href="testers.html"]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      openModal();
    }, true);

    // Close button
    var closeBtn = document.getElementById('pctestClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Overlay click
    var ov = document.getElementById('pctestOverlay');
    if (ov) ov.addEventListener('click', function(e){
      if (e.target === ov) closeModal();
    });

    // ESC key
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && ov && ov.classList.contains('show')) closeModal();
    });

    // WhatsApp URL with pre-written message
    updateWhatsAppURL();
  }

  function updateWhatsAppURL(){
    var wa = document.getElementById('pctestWhatsapp');
    if (!wa) return;
    var isEn = getLang() === 'en';
    var msg = isEn ? WHATSAPP_MESSAGE_EN : WHATSAPP_MESSAGE_AR;
    wa.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  // Update WhatsApp URL when language switches
  document.addEventListener('click', function(e){
    if (e.target.closest('#langBtn, #langBtnMobile, .lang-switch')){
      setTimeout(updateWhatsAppURL, 100);
    }
  });

  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  function init(){
    injectStyles();
    injectModal();
    addTestersLink();
    bindEvents();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Watch for nav link additions (dynamic content)
  if (window.MutationObserver){
    var mo = new MutationObserver(function(){ addTestersLink(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function(){ mo.disconnect(); }, 6000);
  }

  /* ═══════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════ */
  window.PercentTesters = {
    open: openModal,
    close: closeModal,
    number: WHATSAPP_NUMBER
  };
})();