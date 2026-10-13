/* ============================================================
   PERCENT PERFUME — Click-to-Call Button
   - Floating button next to WhatsApp/FAB
   - Adds phone icon in footer next to WhatsApp
   - Opens native dialer via tel: link
   ============================================================ */
(function(){
  'use strict';
  if (window.__percentCallLoaded) return;
  window.__percentCallLoaded = true;

  var CFG = window.PERCENT_CONFIG || {};
  var PHONE = (CFG.CONTACT && CFG.CONTACT.PHONE_E164) || '+962794440551';
  var PHONE_DISPLAY = (CFG.CONTACT && CFG.CONTACT.PHONE_DISPLAY) || '+962 7 9444 0551';

  /* ═══════════════════════════════════════════════
     CSS
     ═══════════════════════════════════════════════ */
  function injectStyles(){
    if (document.getElementById('percent-call-styles')) return;
    var style = document.createElement('style');
    style.id = 'percent-call-styles';
    style.textContent = `
      /* ═══ Floating Call Button ═══ */
      .pcall-float {
        position: fixed;
        right: 26px;
        bottom: 100px;
        z-index: 99998;
        width: 62px;
        height: 62px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
        color: #c9a961;
        font-size: 1.45rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 12px 30px rgba(0, 0, 0, .35), 0 0 0 1px rgba(201, 169, 97, .45);
        transition: all .35s cubic-bezier(.22, 1, .36, 1);
        text-decoration: none;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      .pcall-float:hover {
        transform: translateY(-4px) scale(1.06);
        box-shadow: 0 18px 42px rgba(0, 0, 0, .45), 0 0 0 2px rgba(201, 169, 97, .65);
        background: linear-gradient(145deg, #c9a961, #e8d4a2);
        color: #0a0a0a;
      }
      .pcall-float:active {
        transform: scale(.94);
      }
      .pcall-float i {
        position: relative;
        z-index: 2;
        line-height: 1;
      }

      /* Pulse animation */
      .pcall-float::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px solid #c9a961;
        opacity: 0;
        animation: pcallPulse 3s ease-out infinite;
        pointer-events: none;
      }
      @keyframes pcallPulse {
        0%   { transform: scale(1); opacity: .65; }
        100% { transform: scale(1.7); opacity: 0; }
      }

      /* Label tooltip on hover (desktop only) */
      .pcall-float::after {
        content: 'اتصل بنا';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        inset-inline-end: 100%;
        margin-inline-end: 12px;
        background: #0a0a0a;
        color: #c9a961;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: .78rem;
        font-weight: 800;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity .3s ease, transform .3s ease;
        box-shadow: 0 8px 20px rgba(0, 0, 0, .3);
        border: 1px solid rgba(201, 169, 97, .4);
        font-family: 'Almarai', sans-serif;
      }
      @media (min-width: 769px) {
        .pcall-float:hover::after {
          opacity: 1;
          transform: translateY(-50%) translateX(-4px);
        }
      }

      /* ═══ Footer Icon (next to WhatsApp) ═══ */
      .social-icons .pcall-footer-icon {
        background: transparent;
        border: 1px solid rgba(136, 146, 176, .4);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8a8478;
        width: 44px;
        height: 44px;
        margin: 0;
        transition: all .3s ease;
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
      }
      .social-icons .pcall-footer-icon:hover {
        background: #c9a961;
        border-color: #c9a961;
        color: #0a0a0a;
        transform: translateY(-6px) rotate(-8deg) scale(1.06);
      }

      /* ═══ Mobile ═══ */
      @media (max-width: 900px) {
        .pcall-float {
          right: 14px;
          bottom: calc(150px + env(safe-area-inset-bottom, 0px));
          width: 54px;
          height: 54px;
          font-size: 1.2rem;
        }
        .pcall-float::after { display: none; }
      }
      @media (max-width: 380px) {
        .pcall-float {
          width: 50px;
          height: 50px;
          font-size: 1.1rem;
          bottom: calc(140px + env(safe-area-inset-bottom, 0px));
        }
      }

      /* Hide if page has no body (admin, etc) */
      body.admin-mode .pcall-float { display: none !important; }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .pcall-float,
        .pcall-float::before,
        .social-icons .pcall-footer-icon {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════
     FLOATING BUTTON
     ═══════════════════════════════════════════════ */
  function injectFloatingButton(){
    if (document.getElementById('pcallFloat')) return;
    if (document.body.classList.contains('admin-mode')) return;

    var btn = document.createElement('a');
    btn.id = 'pcallFloat';
    btn.className = 'pcall-float';
    btn.href = 'tel:' + PHONE;
    btn.setAttribute('aria-label', 'اتصل بنا');
    btn.setAttribute('title', 'اتصل بنا: ' + PHONE_DISPLAY);
    btn.innerHTML = '<i class="fas fa-phone"></i>';

    // Haptic feedback on tap (mobile)
    btn.addEventListener('click', function(){
      if (window.mHaptic) window.mHaptic([12, 20, 12]);
    });

    document.body.appendChild(btn);
  }

  /* ═══════════════════════════════════════════════
     FOOTER ICON (next to WhatsApp)
     ═══════════════════════════════════════════════ */
  function injectFooterIcon(){
    // Find the WhatsApp link in footer
    var waLinks = document.querySelectorAll('.social-icons a[aria-label="WhatsApp"], .social-icons a[href*="wa.me"]');
    if (!waLinks.length) return;

    waLinks.forEach(function(wa){
      // Skip if already injected
      if (wa.parentNode.querySelector('.pcall-footer-icon')) return;

      var callIcon = document.createElement('a');
      callIcon.className = 'pcall-footer-icon';
      callIcon.href = 'tel:' + PHONE;
      callIcon.setAttribute('aria-label', 'اتصل بنا');
      callIcon.setAttribute('title', 'اتصل بنا: ' + PHONE_DISPLAY);
      callIcon.innerHTML = '<i class="fas fa-phone"></i>';

      // Insert AFTER WhatsApp icon
      wa.parentNode.insertBefore(callIcon, wa.nextSibling);
    });
  }

  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  function init(){
    injectStyles();
    injectFloatingButton();

    // Footer might be loaded after JS (rare) — retry
    injectFooterIcon();
    setTimeout(injectFooterIcon, 500);
    setTimeout(injectFooterIcon, 1500);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Watch for dynamic footer updates (SPA-like behavior) */
  if (window.MutationObserver){
    var obs = new MutationObserver(function(){
      injectFooterIcon();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function(){ obs.disconnect(); }, 8000);
  }

  /* ═══════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════ */
  window.PercentCall = {
    phone: PHONE,
    display: PHONE_DISPLAY,
    call: function(){
      window.location.href = 'tel:' + PHONE;
    }
  };
})();