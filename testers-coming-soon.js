/* ═══════════════════════════════════════════════════════════
   PERCENT — Testers "Coming Soon" Modal
   - يضيف رابط "عطور التست" في القائمة
   - عند الضغط تظهر نافذة قيد الإنشاء
   - مع خيارات: واتساب، اتصال، عودة للرئيسية
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__percentTestersLoaded) return;
  window.__percentTestersLoaded = true;

  var CFG = window.PERCENT_CONFIG || {};
  var PHONE = (CFG.CONTACT && CFG.CONTACT.PHONE_E164) || '+962794440551';
  var WA    = (CFG.CONTACT && CFG.CONTACT.WHATSAPP) || '962794440551';

  /* ═══════════════════════════════════════════════
     CSS
     ═══════════════════════════════════════════════ */
  function injectStyles(){
    if (document.getElementById('percent-testers-styles')) return;
    var style = document.createElement('style');
    style.id = 'percent-testers-styles';
    style.textContent = `

      /* ═══ Modal Overlay ═══ */
      .ptest-overlay {
        position: fixed;
        inset: 0;
        background: rgba(5, 5, 5, .72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99990;
        opacity: 0;
        visibility: hidden;
        transition: opacity .3s ease, visibility .3s ease;
      }
      .ptest-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      /* ═══ Modal ═══ */
      .ptest-modal {
        position: fixed;
        inset: 0;
        z-index: 99995;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        visibility: hidden;
        transition: opacity .3s ease, visibility .3s ease;
        pointer-events: none;
      }
      .ptest-modal.open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .ptest-card {
        position: relative;
        width: 100%;
        max-width: 520px;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
        background: linear-gradient(160deg, #0a0a0a 0%, #16161a 100%);
        border: 1px solid rgba(201, 169, 97, .4);
        border-radius: 26px;
        padding: 48px 40px 36px;
        text-align: center;
        color: #faf8f3;
        box-shadow: 0 40px 100px rgba(0, 0, 0, .6), 0 0 80px rgba(201, 169, 97, .15);
        transform: scale(.9) translateY(20px);
        transition: transform .45s cubic-bezier(.22, 1, .36, 1);
      }
      .ptest-modal.open .ptest-card {
        transform: scale(1) translateY(0);
      }
      .ptest-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 26px 26px 0 0;
        background: linear-gradient(90deg, #a8874a, #e8d4a2, #c9a961, #e8d4a2, #a8874a);
        background-size: 200% auto;
        animation: ptestShine 4s linear infinite;
      }
      @keyframes ptestShine {
        to { background-position: 200% center; }
      }
      .ptest-card::after {
        content: '';
        position: absolute;
        top: -100px;
        right: -100px;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201, 169, 97, .18), transparent 70%);
        pointer-events: none;
      }

      /* ═══ Icon ═══ */
      .ptest-icon-wrap {
        position: relative;
        width: 100px;
        height: 100px;
        margin: 0 auto 24px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201, 169, 97, .22), rgba(201, 169, 97, .04));
        border: 1px solid rgba(201, 169, 97, .55);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c9a961;
        font-size: 2.2rem;
        box-shadow: 0 20px 50px rgba(201, 169, 97, .25);
        animation: ptestFloat 4s ease-in-out infinite;
      }
      @keyframes ptestFloat {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }
      .ptest-icon-wrap::before {
        content: '';
        position: absolute;
        inset: -14px;
        border-radius: 50%;
        border: 1px dashed rgba(201, 169, 97, .3);
        animation: ptestSpin 22s linear infinite;
      }
      .ptest-icon-wrap::after {
        content: '';
        position: absolute;
        inset: -28px;
        border-radius: 50%;
        border: 1px solid rgba(201, 169, 97, .12);
        animation: ptestSpin 30s linear infinite reverse;
      }
      @keyframes ptestSpin {
        to { transform: rotate(360deg); }
      }

      /* ═══ Badge ═══ */
      .ptest-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 18px;
        border-radius: 40px;
        background: rgba(201, 169, 97, .15);
        border: 1px solid rgba(201, 169, 97, .5);
        color: #e8d4a2;
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: 3px;
        margin-bottom: 18px;
        text-transform: uppercase;
      }
      .ptest-badge i {
        font-size: .7rem;
        animation: ptestSparkle 2s ease-in-out infinite;
      }
      @keyframes ptestSparkle {
        0%, 100% { transform: scale(1) rotate(0); opacity: 1; }
        50%      { transform: scale(1.25) rotate(15deg); opacity: .7; }
      }

      /* ═══ Heading ═══ */
      .ptest-card h2 {
        font-family: 'Playfair Display', serif;
        font-size: clamp(1.6rem, 4vw, 2rem);
        font-weight: 700;
        color: #faf8f3;
        margin-bottom: 12px;
        letter-spacing: 1px;
        line-height: 1.2;
      }
      .ptest-card h2 .gold {
        background: linear-gradient(100deg, #a8874a 0%, #c9a961 22%, #e8d4a2 45%, #c9a961 68%, #a8874a 100%);
        background-size: 220% auto;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        animation: ptestShine 6s linear infinite;
      }

      /* ═══ Description ═══ */
      .ptest-desc {
        font-size: .92rem;
        color: #a8a29b;
        line-height: 1.85;
        margin-bottom: 28px;
        max-width: 380px;
        margin-inline: auto;
        margin-bottom: 28px;
      }
      .ptest-desc strong {
        color: #e8d4a2;
        font-weight: 800;
      }

      /* ═══ Actions ═══ */
      .ptest-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 22px;
      }
      .ptest-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 15px 22px;
        border-radius: 14px;
        border: none;
        font-family: inherit;
        font-weight: 800;
        font-size: .92rem;
        letter-spacing: .3px;
        cursor: pointer;
        transition: all .3s cubic-bezier(.22, 1, .36, 1);
        text-decoration: none;
      }
      .ptest-btn i {
        font-size: 1.05rem;
      }
      .ptest-btn-wa {
        background: linear-gradient(135deg, #25D366, #128C7E);
        color: #fff;
        box-shadow: 0 10px 28px rgba(37, 211, 102, .35);
      }
      .ptest-btn-wa:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 36px rgba(37, 211, 102, .5);
      }
      .ptest-btn-call {
        background: rgba(201, 169, 97, .12);
        border: 1.5px solid rgba(201, 169, 97, .5);
        color: #e8d4a2;
      }
      .ptest-btn-call:hover {
        background: rgba(201, 169, 97, .22);
        border-color: #c9a961;
        transform: translateY(-3px);
      }
      .ptest-btn-home {
        background: rgba(255, 255, 255, .05);
        border: 1.5px solid rgba(255, 255, 255, .12);
        color: #a8a29b;
      }
      .ptest-btn-home:hover {
        background: rgba(255, 255, 255, .1);
        color: #faf8f3;
        transform: translateY(-3px);
      }

      /* ═══ Footer Note ═══ */
      .ptest-note {
        font-size: .72rem;
        color: #6b6459;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding-top: 18px;
        border-top: 1px dashed rgba(201, 169, 97, .2);
      }
      .ptest-note i {
        color: #c9a961;
        font-size: .7rem;
      }

      /* ═══ Close Button ═══ */
      .ptest-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(255, 255, 255, .08);
        color: #c9a961;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: .9rem;
        transition: all .3s ease;
        z-index: 10;
      }
      .ptest-close:hover {
        background: #c9a961;
        color: #0a0a0a;
        transform: rotate(90deg);
      }
      html[dir="ltr"] .ptest-close {
        right: auto;
        left: 16px;
      }

      /* ═══ Nav Link Highlight ═══ */
      .nav-links a.nav-testers {
        position: relative;
      }
      .nav-links a.nav-testers::before {
        content: 'NEW';
        position: absolute;
        top: -14px;
        inset-inline-end: -10px;
        background: linear-gradient(135deg, #c9a961, #e8d4a2);
        color: #0a0a0a;
        font-size: .5rem;
        font-weight: 900;
        padding: 2px 7px;
        border-radius: 10px;
        letter-spacing: 1px;
        box-shadow: 0 4px 10px rgba(201, 169, 97, .4);
        animation: navTestersPulse 2.5s ease-in-out infinite;
      }
      @keyframes navTestersPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.08); }
      }

      /* ═══ Mobile ═══ */
      @media (max-width: 640px) {
        .ptest-modal {
          padding: 0;
          align-items: flex-end;
        }
        .ptest-card {
          max-width: 100vw;
          max-height: 92vh;
          max-height: 92dvh;
          border-radius: 24px 24px 0 0;
          padding: 44px 24px 32px;
          transform: translateY(100%);
          border-bottom: none;
        }
        .ptest-modal.open .ptest-card {
          transform: translateY(0);
        }
        .ptest-card::before {
          border-radius: 24px 24px 0 0;
        }
        .ptest-card::after {
          display: none;
        }
        .ptest-icon-wrap {
          width: 80px;
          height: 80px;
          font-size: 1.8rem;
          margin-bottom: 20px;
        }
        .ptest-icon-wrap::before { inset: -12px; }
        .ptest-icon-wrap::after  { inset: -24px; }
        .ptest-card h2 {
          font-size: 1.4rem;
        }
        .ptest-desc {
          font-size: .86rem;
          margin-bottom: 22px;
        }
        .ptest-btn {
          padding: 14px 20px;
          font-size: .88rem;
        }
      }

      @media (max-width: 380px) {
        .ptest-card {
          padding: 40px 18px 28px;
        }
        .ptest-icon-wrap {
          width: 70px;
          height: 70px;
          font-size: 1.6rem;
        }
        .ptest-card h2 {
          font-size: 1.25rem;
        }
      }

      /* ═══ Reduced Motion ═══ */
      @media (prefers-reduced-motion: reduce) {
        .ptest-card,
        .ptest-icon-wrap,
        .ptest-icon-wrap::before,
        .ptest-icon-wrap::after,
        .ptest-badge i,
        .nav-links a.nav-testers::before {
          animation: none !important;
          transition: none !important;
        }
      }

      /* ═══ Dark Mode Support (already dark) ═══ */
      html.dark-mode .ptest-card {
        background: linear-gradient(160deg, #0a0a0a 0%, #16161a 100%);
        border-color: rgba(201, 169, 97, .45);
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════
     HTML (Modal)
     ═══════════════════════════════════════════════ */
  function injectModal(){
    if (document.getElementById('ptestModal')) return;

    var waMsg = encodeURIComponent(
      'مرحباً PERCENT 👋\n' +
      'أرغب بمعرفة المزيد عن عطور التست (5ml) التي ستتوفر قريباً.\n' +
      'هل يمكنكم إخباري بالموعد المتوقع؟'
    );

    var modal = document.createElement('div');
    modal.innerHTML = '' +
      '<div class="ptest-overlay" id="ptestOverlay"></div>' +
      '<div class="ptest-modal" id="ptestModal" role="dialog" aria-modal="true" aria-labelledby="ptestTitle">' +
      '  <div class="ptest-card">' +
      '    <button class="ptest-close" id="ptestClose" type="button" aria-label="إغلاق">' +
      '      <i class="fas fa-times"></i>' +
      '    </button>' +
      '    <div class="ptest-icon-wrap">' +
      '      <i class="fas fa-flask"></i>' +
      '    </div>' +
      '    <div class="ptest-badge">' +
      '      <i class="fas fa-hourglass-half"></i>' +
      '      <span class="lang-ar">قيد الإنشاء</span>' +
      '      <span class="lang-en">COMING SOON</span>' +
      '    </div>' +
      '    <h2 id="ptestTitle">' +
      '      <span class="lang-ar">قسم <span class="gold">عطور التست</span></span>' +
      '      <span class="lang-en"><span class="gold">Testers</span> Section</span>' +
      '    </h2>' +
      '    <p class="ptest-desc">' +
      '      <span class="lang-ar">نعمل حالياً على تجهيز قسم <strong>عطور التست (5ml)</strong> ليكون جاهزاً قريباً. تابعنا على واتساب لتصلك أخبار الإطلاق أولاً بأول.</span>' +
      '      <span class="lang-en">We\'re currently preparing the <strong>Testers (5ml)</strong> section. Follow us on WhatsApp to be the first to know when we launch.</span>' +
      '    </p>' +
      '    <div class="ptest-actions">' +
      '      <a href="https://wa.me/' + WA + '?text=' + waMsg + '" ' +
      '         target="_blank" rel="noopener noreferrer" class="ptest-btn ptest-btn-wa">' +
      '        <i class="fab fa-whatsapp"></i>' +
      '        <span class="lang-ar">راسلنا على واتساب</span>' +
      '        <span class="lang-en">Message us on WhatsApp</span>' +
      '      </a>' +
      '      <a href="tel:' + PHONE + '" class="ptest-btn ptest-btn-call">' +
      '        <i class="fas fa-phone"></i>' +
      '        <span class="lang-ar">اتصل بنا مباشرة</span>' +
      '        <span class="lang-en">Call us directly</span>' +
      '      </a>' +
      '      <a href="index.html" class="ptest-btn ptest-btn-home">' +
      '        <i class="fas fa-home"></i>' +
      '        <span class="lang-ar">العودة للصفحة الرئيسية</span>' +
      '        <span class="lang-en">Back to Home</span>' +
      '      </a>' +
      '    </div>' +
      '    <div class="ptest-note">' +
      '      <i class="fas fa-lock"></i>' +
      '      <span class="lang-ar">شكراً لصبرك — نعدك بشيء مميز جداً</span>' +
      '      <span class="lang-en">Thanks for your patience — something special is coming</span>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(modal);
  }

  /* ═══════════════════════════════════════════════
     OPEN / CLOSE
     ═══════════════════════════════════════════════ */
  function openModal(){
    var overlay = document.getElementById('ptestOverlay');
    var modal = document.getElementById('ptestModal');
    if (!overlay || !modal) return;

    overlay.classList.add('open');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (window.mHaptic) window.mHaptic(12);

    // Analytics
    if (window.PercentAnalytics && window.PercentAnalytics.track) {
      try { window.PercentAnalytics.track('testers_coming_soon_open'); } catch(e){}
    }
  }

  function closeModal(){
    var overlay = document.getElementById('ptestOverlay');
    var modal = document.getElementById('ptestModal');
    if (!overlay || !modal) return;

    overlay.classList.remove('open');
    modal.classList.remove('open');
    document.body.style.overflow = '';

    if (window.mHaptic) window.mHaptic(8);
  }

  /* ═══════════════════════════════════════════════
     INJECT NAV LINK
     ═══════════════════════════════════════════════ */
  function injectNavLink(){
    // Skip if already injected
    if (document.querySelector('.nav-testers')) return;

    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'nav-testers';
    link.setAttribute('data-testers-trigger', '');
    link.innerHTML = '' +
      '<span class="lang-ar">عطور التست</span>' +
      '<span class="lang-en">Testers</span>';

    // Insert after "men.html" link (before "story" or "bestsellers")
    var menLink = navLinks.querySelector('a[href="men.html"]');
    var loyaltyLink = navLinks.querySelector('a[href="loyalty.html"]');
    var storyLink = navLinks.querySelector('a[href="#story"], a[href="index.html#story"]');

    if (menLink && menLink.nextSibling) {
      navLinks.insertBefore(link, menLink.nextSibling);
    } else if (storyLink) {
      navLinks.insertBefore(link, storyLink);
    } else if (loyaltyLink) {
      navLinks.insertBefore(link, loyaltyLink);
    } else {
      navLinks.appendChild(link);
    }

    // Bind click
    link.addEventListener('click', function(e){
      e.preventDefault();
      openModal();
    });
  }

  /* ═══════════════════════════════════════════════
     BIND EVENTS
     ═══════════════════════════════════════════════ */
  function bindEvents(){
    // Close button
    var closeBtn = document.getElementById('ptestClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Overlay
    var overlay = document.getElementById('ptestOverlay');
    if (overlay) overlay.addEventListener('click', closeModal);

    // ESC key
    document.addEventListener('keydown', function(e){
      var modal = document.getElementById('ptestModal');
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // Global delegated clicks on [data-testers-trigger] (in case of dynamic injection)
    document.addEventListener('click', function(e){
      var trigger = e.target.closest('[data-testers-trigger]');
      if (!trigger) return;
      e.preventDefault();
      openModal();
    }, true);
  }

  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  function init(){
    injectStyles();
    injectModal();
    injectNavLink();
    bindEvents();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Retry nav injection in case nav loads later
  setTimeout(injectNavLink, 500);
  setTimeout(injectNavLink, 1500);

  /* ═══════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════ */
  window.PercentTesters = {
    open: openModal,
    close: closeModal
  };
})();