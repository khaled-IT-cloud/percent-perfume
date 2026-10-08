/* ============================================================
   PERCENT PERFUME — Cookie Consent Banner
   GDPR + CCPA Compliant
   ============================================================ */
(function(){
  'use strict';

  const CONSENT_KEY = 'percent_cookie_consent';
  const VERSION = '1.0';

  // Don't show banner if already consented
  function getConsent(){
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== VERSION) return null;
      return data;
    } catch(e){ return null; }
  }

  function saveConsent(preferences){
    const data = {
      version: VERSION,
      timestamp: new Date().toISOString(),
      necessary: true,
      analytics: !!preferences.analytics,
      marketing: !!preferences.marketing
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(data)); } catch(e){}
    return data;
  }

  function injectStyles(){
    if (document.getElementById('cookieBannerStyles')) return;
    const style = document.createElement('style');
    style.id = 'cookieBannerStyles';
    style.textContent = `
      .cookie-banner{
        position:fixed;bottom:0;inset-inline-start:0;width:100%;z-index:9999;
        background:rgba(5,9,20,.97);
        backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
        border-top:2px solid #c9a961;
        box-shadow:0 -20px 60px rgba(0,0,0,.4);
        padding:22px 26px;
        transform:translateY(120%);
        transition:transform .6s cubic-bezier(.22,1,.36,1);
        font-family:'Almarai',sans-serif;
        direction:inherit;
      }
      .cookie-banner.show{transform:translateY(0)}
      .cookie-inner{
        max-width:1240px;margin:0 auto;
        display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;
      }
      .cookie-text{color:#faf8f3;min-width:0}
      .cookie-text h4{
        font-family:'Playfair Display',serif;
        color:#c9a961;font-size:1.05rem;margin:0 0 6px;letter-spacing:1px;
        display:flex;align-items:center;gap:10px;
      }
      .cookie-text h4 i{font-size:.9rem}
      .cookie-text p{font-size:.82rem;color:#8a8478;line-height:1.7;margin:0}
      .cookie-text a{color:#c9a961;text-decoration:underline;font-weight:700}
      .cookie-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .cookie-btn{
        padding:11px 22px;border-radius:10px;border:1.5px solid transparent;
        font-weight:800;font-size:.82rem;cursor:pointer;font-family:inherit;
        transition:all .3s cubic-bezier(.22,1,.36,1);
        white-space:nowrap;
      }
      .cookie-btn.primary{
        background:linear-gradient(120deg,#c9a961,#e8d4a2);
        color:#0a0a0a;border-color:#c9a961;
        box-shadow:0 6px 16px rgba(212,175,55,.3);
      }
      .cookie-btn.primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(212,175,55,.42)}
      .cookie-btn.ghost{
        background:transparent;color:#8a8478;
        border-color:rgba(136,146,176,.4);
      }
      .cookie-btn.ghost:hover{color:#faf8f3;border-color:#c9a961;background:rgba(212,175,55,.08)}
      .cookie-btn.link{
        background:none;border:none;color:#c9a961;
        padding:11px 8px;text-decoration:underline;
      }
      .cookie-btn.link:hover{color:#e8d4a2}
      .cookie-modal{
        position:fixed;inset:0;z-index:10000;
        background:rgba(5,9,20,.85);backdrop-filter:blur(8px);
        display:flex;align-items:center;justify-content:center;padding:20px;
        opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;
      }
      .cookie-modal.show{opacity:1;visibility:visible}
      .cookie-modal-card{
        background:#faf8f3;border-radius:22px;padding:32px;max-width:560px;
        width:100%;max-height:90vh;overflow-y:auto;
        transform:scale(.94);transition:transform .4s cubic-bezier(.22,1,.36,1);
      }
      .cookie-modal.show .cookie-modal-card{transform:scale(1)}
      .cookie-modal-card h3{
        font-family:'Playfair Display',serif;
        font-size:1.4rem;color:#0a0a0a;margin:0 0 8px;
        display:flex;align-items:center;gap:10px;
      }
      .cookie-modal-card h3 i{color:#c9a961;font-size:1rem}
      .cookie-modal-card > p{color:#6b6459;font-size:.88rem;margin:0 0 22px}
      .cookie-option{
        display:flex;justify-content:space-between;align-items:flex-start;gap:14px;
        padding:16px;border-radius:12px;margin-bottom:10px;
        background:#f5f1e8;border:1px solid #e5e7eb;
      }
      .cookie-option-info{flex:1;min-width:0}
      .cookie-option-info strong{
        display:block;color:#0a0a0a;font-weight:800;
        font-size:.92rem;margin-bottom:4px;
      }
      .cookie-option-info small{
        display:block;color:#6b6459;font-size:.78rem;line-height:1.6;
      }
      .cookie-switch{
        position:relative;width:46px;height:26px;border-radius:20px;
        background:#d1d5db;cursor:pointer;flex-shrink:0;
        transition:background .3s;
        border:none;padding:0;
      }
      .cookie-switch::before{
        content:'';position:absolute;top:3px;inset-inline-start:3px;
        width:20px;height:20px;border-radius:50%;background:#faf8f3;
        box-shadow:0 2px 4px rgba(0,0,0,.15);
        transition:inset-inline-start .3s cubic-bezier(.22,1,.36,1);
      }
      .cookie-switch.active{background:#2d7a4f}
      .cookie-switch.active::before{inset-inline-start:23px}
      .cookie-switch:disabled{opacity:.5;cursor:not-allowed}
      .cookie-modal-actions{
        display:flex;gap:10px;margin-top:22px;flex-wrap:wrap;
      }
      .cookie-modal-actions .cookie-btn{flex:1;min-width:140px}
      @media (max-width:768px){
        .cookie-inner{grid-template-columns:1fr;gap:16px}
        .cookie-actions{flex-direction:column;width:100%}
        .cookie-btn{width:100%}
        .cookie-modal-actions{flex-direction:column}
        .cookie-modal-card{padding:24px 20px}
      }
    `;
    document.head.appendChild(style);
  }

  function injectBanner(){
    if (document.getElementById('cookieBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-text">
          <h4><i class="fas fa-cookie-bite"></i>
            <span class="lang-ar">نحترم خصوصيتك</span>
            <span class="lang-en">We Respect Your Privacy</span>
          </h4>
          <p>
            <span class="lang-ar">
              نستخدم ملفات تعريف الارتباط (الكوكيز) لتحسين تجربتك، تحليل الأداء، وعرض عروض مناسبة لك. يمكنك تخصيص تفضيلاتك في أي وقت.
              <a href="legal/cookies.html">اقرأ السياسة الكاملة</a>
            </span>
            <span class="lang-en">
              We use cookies to enhance your experience, analyze performance, and show relevant offers. You can customize your preferences anytime.
              <a href="legal/cookies.html">Read full policy</a>
            </span>
          </p>
        </div>
        <div class="cookie-actions">
          <button type="button" class="cookie-btn link" data-cookie="customize">
            <span class="lang-ar">تخصيص</span><span class="lang-en">Customize</span>
          </button>
          <button type="button" class="cookie-btn ghost" data-cookie="reject">
            <span class="lang-ar">رفض</span><span class="lang-en">Reject</span>
          </button>
          <button type="button" class="cookie-btn primary" data-cookie="accept">
            <span class="lang-ar">قبول الكل</span><span class="lang-en">Accept All</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  function injectModal(){
    if (document.getElementById('cookieModal')) return;
    const modal = document.createElement('div');
    modal.id = 'cookieModal';
    modal.className = 'cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="cookie-modal-card">
        <h3><i class="fas fa-sliders"></i>
          <span class="lang-ar">تفضيلات الكوكيز</span>
          <span class="lang-en">Cookie Preferences</span>
        </h3>
        <p>
          <span class="lang-ar">تحكم في أنواع الكوكيز المسموح بها:</span>
          <span class="lang-en">Control which types of cookies you allow:</span>
        </p>

        <div class="cookie-option">
          <div class="cookie-option-info">
            <strong><span class="lang-ar">ضرورية</span><span class="lang-en">Necessary</span></strong>
            <small>
              <span class="lang-ar">ضرورية لعمل الموقع (سلة التسوق، تسجيل الدخول). لا يمكن تعطيلها.</span>
              <span class="lang-en">Essential for site functionality (cart, login). Cannot be disabled.</span>
            </small>
          </div>
          <button type="button" class="cookie-switch active" disabled aria-label="Necessary cookies"></button>
        </div>

        <div class="cookie-option">
          <div class="cookie-option-info">
            <strong><span class="lang-ar">تحليلية</span><span class="lang-en">Analytics</span></strong>
            <small>
              <span class="lang-ar">لمساعدتنا في فهم كيفية استخدام الزوار للموقع وتحسين الأداء.</span>
              <span class="lang-en">Helps us understand how visitors use the site and improve performance.</span>
            </small>
          </div>
          <button type="button" class="cookie-switch" data-cookie-toggle="analytics" aria-label="Analytics cookies"></button>
        </div>

        <div class="cookie-option">
          <div class="cookie-option-info">
            <strong><span class="lang-ar">تسويقية</span><span class="lang-en">Marketing</span></strong>
            <small>
              <span class="lang-ar">لعرض إعلانات وعروض مناسبة لك بناءً على اهتماماتك.</span>
              <span class="lang-en">Used to show ads and offers relevant to your interests.</span>
            </small>
          </div>
          <button type="button" class="cookie-switch" data-cookie-toggle="marketing" aria-label="Marketing cookies"></button>
        </div>

        <div class="cookie-modal-actions">
          <button type="button" class="cookie-btn ghost" data-cookie="modal-close">
            <span class="lang-ar">إلغاء</span><span class="lang-en">Cancel</span>
          </button>
          <button type="button" class="cookie-btn primary" data-cookie="save">
            <span class="lang-ar">حفظ التفضيلات</span><span class="lang-en">Save Preferences</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function hideBanner(){
    const banner = document.getElementById('cookieBanner');
    if (banner){
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 600);
    }
  }

  function openModal(){
    const modal = document.getElementById('cookieModal');
    if (!modal) return;
    // Load current prefs
    const consent = getConsent();
    if (consent){
      document.querySelectorAll('[data-cookie-toggle]').forEach(btn => {
        btn.classList.toggle('active', !!consent[btn.dataset.cookieToggle]);
      });
    }
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    const modal = document.getElementById('cookieModal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  function finalizeConsent(prefs){
    const consent = saveConsent(prefs);
    hideBanner();
    closeModal();
    // Emit event for other scripts to react
    window.dispatchEvent(new CustomEvent('percent:consent', { detail: consent }));
    // Optional: show toast
    if (window.showToast){
      window.showToast(
        document.documentElement.dataset.lang === 'en'
          ? 'Preferences saved'
          : 'تم حفظ تفضيلاتك',
        'fa-check-circle',
        'success'
      );
    }
  }

  function bindEvents(){
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-cookie]');
      if (!action) return;
      const act = action.dataset.cookie;

      if (act === 'accept'){
        finalizeConsent({ analytics: true, marketing: true });
      } else if (act === 'reject'){
        finalizeConsent({ analytics: false, marketing: false });
      } else if (act === 'customize'){
        openModal();
      } else if (act === 'save'){
        const prefs = {
          analytics: document.querySelector('[data-cookie-toggle="analytics"]').classList.contains('active'),
          marketing: document.querySelector('[data-cookie-toggle="marketing"]').classList.contains('active')
        };
        finalizeConsent(prefs);
      } else if (act === 'modal-close'){
        closeModal();
      }
    });

    // Toggle switches
    document.addEventListener('click', (e) => {
      const sw = e.target.closest('[data-cookie-toggle]');
      if (!sw) return;
      sw.classList.toggle('active');
    });

    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'cookieModal') closeModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function init(){
    injectStyles();
    injectBanner();
    injectModal();
    bindEvents();

    // Show banner only if not yet consented
    const consent = getConsent();
    if (!consent){
      setTimeout(() => {
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.classList.add('show');
      }, 800);
    } else {
      // Dispatch consent event for existing session
      window.dispatchEvent(new CustomEvent('percent:consent', { detail: consent }));
    }
  }

  // Public API
  window.PercentCookieConsent = {
    get: getConsent,
    hasAnalytics: () => (getConsent() || {}).analytics === true,
    hasMarketing: () => (getConsent() || {}).marketing === true,
    openPreferences: openModal
  };

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();