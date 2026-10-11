/* ═══════════════════════════════════════════════════════════════
   PERCENT PERFUME — PWA Install Banner (iOS + Android)
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (!isMobile) return;

  var DISMISS_KEY = 'percent_install_dismissed_v2';
  var DISMISS_DAYS = 7;

  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                  || window.navigator.standalone === true;
  if (isStandalone) return;

  try {
    var dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed){
      var elapsed = Date.now() - parseInt(dismissed, 10);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }
  } catch(e){}

  var deferredPrompt = null;
  var banner = null;
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  var isSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  if (isIOS && isSafari){
    setTimeout(showBanner, 4000);
  }

  function showBanner(){
    if (banner) return;
    if (document.querySelector('.m-install-banner')) return;

    banner = document.createElement('div');
    banner.className = 'm-install-banner';
    banner.innerHTML =
      '<div class="m-install-icon">' +
        '<img src="icon-192.png" alt="PERCENT" ' +
        'onerror="this.parentNode.innerHTML=\'<span style=&quot;color:#0a0a0a;font-weight:900;font-size:1.3rem&quot;>P</span>\'">' +
      '</div>' +
      '<div class="m-install-text">' +
        '<strong>ثبّت التطبيق</strong>' +
        '<small>تجربة أسرع · إشعارات فورية · بدون متصفح</small>' +
      '</div>' +
      '<button class="m-install-btn" type="button">تثبيت</button>' +
      '<button class="m-install-close" type="button" aria-label="إغلاق">' +
        '<i class="fas fa-times"></i>' +
      '</button>';

    document.body.appendChild(banner);
    setTimeout(function(){ banner.classList.add('show'); }, 100);

    banner.querySelector('.m-install-btn').addEventListener('click', function(){
      if (window.mHaptic) window.mHaptic(15);
      if (deferredPrompt){
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choice){
          if (choice.outcome === 'accepted'){
            banner.classList.remove('show');
            setTimeout(function(){ banner.remove(); banner = null; }, 400);
          } else {
            dismiss();
          }
          deferredPrompt = null;
        });
      } else if (isIOS){
        showIOSInstructions();
      } else {
        dismiss();
      }
    });

    banner.querySelector('.m-install-close').addEventListener('click', dismiss);
  }

  function dismiss(){
    if (window.mHaptic) window.mHaptic(8);
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch(e){}
    if (banner){
      banner.classList.remove('show');
      setTimeout(function(){ if (banner){ banner.remove(); banner = null; } }, 400);
    }
  }

  function showIOSInstructions(){
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(5,5,5,.85);' +
      'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
      'display:flex;align-items:center;justify-content:center;padding:24px;' +
      'opacity:0;transition:opacity .3s ease;';

    overlay.innerHTML =
      '<div style="background:#faf8f3;border-radius:24px;padding:28px 24px;max-width:380px;width:100%;' +
      'box-shadow:0 40px 90px rgba(0,0,0,.5);transform:scale(.9);transition:transform .4s cubic-bezier(.34,1.56,.64,1)">' +
        '<div style="text-align:center;margin-bottom:20px">' +
          '<div style="width:64px;height:64px;margin:0 auto 14px;border-radius:16px;' +
          'background:linear-gradient(145deg,#c9a961,#a8874a);display:flex;align-items:center;' +
          'justify-content:center;color:#0a0a0a;font-size:1.6rem">' +
            '<i class="fas fa-mobile-screen-button"></i>' +
          '</div>' +
          '<h3 style="font-family:Playfair Display,serif;font-size:1.3rem;color:#0a0a0a;margin:0 0 6px">' +
            'ثبّت على الآيفون' +
          '</h3>' +
          '<p style="font-size:.85rem;color:#6b6459;font-weight:700;margin:0">اتبع الخطوات البسيطة</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:22px">' +
          '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:#f5f1e8;border-radius:14px">' +
            '<span style="width:36px;height:36px;border-radius:50%;background:#0a0a0a;color:#c9a961;' +
            'display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0">1</span>' +
            '<div style="flex:1;font-size:.85rem;font-weight:800;color:#0a0a0a;line-height:1.5">' +
              'اضغط زر <span style="color:#a8874a">المشاركة</span> ' +
              '<i class="fas fa-arrow-up-from-bracket" style="color:#c9a961"></i>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:#f5f1e8;border-radius:14px">' +
            '<span style="width:36px;height:36px;border-radius:50%;background:#0a0a0a;color:#c9a961;' +
            'display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0">2</span>' +
            '<div style="flex:1;font-size:.85rem;font-weight:800;color:#0a0a0a;line-height:1.5">' +
              'اختر <span style="color:#a8874a">"إضافة إلى الشاشة الرئيسية"</span> ' +
              '<i class="fas fa-plus-square" style="color:#c9a961"></i>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:#f5f1e8;border-radius:14px">' +
            '<span style="width:36px;height:36px;border-radius:50%;background:#0a0a0a;color:#c9a961;' +
            'display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0">3</span>' +
            '<div style="flex:1;font-size:.85rem;font-weight:800;color:#0a0a0a;line-height:1.5">' +
              'اضغط <span style="color:#a8874a">"إضافة"</span> وابدأ الاستخدام' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button id="mIosCloseBtn" style="width:100%;padding:14px;border-radius:12px;' +
        'background:linear-gradient(120deg,#c9a961,#e8d4a2);color:#0a0a0a;font-weight:900;' +
        'font-size:.9rem;border:none;cursor:pointer;font-family:inherit">' +
          'فهمت، شكراً' +
        '</button>' +
      '</div>';

    document.body.appendChild(overlay);

    setTimeout(function(){
      overlay.style.opacity = '1';
      overlay.firstElementChild.style.transform = 'scale(1)';
    }, 50);

    overlay.querySelector('#mIosCloseBtn').addEventListener('click', function(){
      if (window.mHaptic) window.mHaptic(8);
      overlay.style.opacity = '0';
      setTimeout(function(){ overlay.remove(); }, 300);
      dismiss();
    });

    overlay.addEventListener('click', function(e){
      if (e.target === overlay){
        overlay.style.opacity = '0';
        setTimeout(function(){ overlay.remove(); }, 300);
        dismiss();
      }
    });
  }

  window.addEventListener('appinstalled', function(){
    if (window.mHaptic) window.mHaptic([20, 40, 20]);
    if (banner){
      banner.classList.remove('show');
      setTimeout(function(){ if (banner){ banner.remove(); banner = null; } }, 400);
    }
  });
})();