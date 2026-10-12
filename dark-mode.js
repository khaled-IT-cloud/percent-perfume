/* ═══════════════════════════════════════════════════════════
   PERCENT PERFUME — Dark Mode Toggle
   - يحفظ التفضيل في localStorage
   - يكشف تفضيل النظام تلقائياً
   - يحقن زر تبديل في الهيدر
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var STORAGE_KEY = 'percent_dark_mode';
  var html = document.documentElement;

  function getPref(){
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark')  return true;
      if (saved === 'light') return false;
    } catch(e){}
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch(e){}
    return false;
  }

  function updateIcon(){
    var btn = document.getElementById('darkModeToggle');
    if (!btn) return;
    var icon = btn.querySelector('i');
    if (!icon) return;
    var isDark = html.classList.contains('dark-mode');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    btn.setAttribute('aria-label', isDark ? 'التبديل للوضع النهاري' : 'التبديل للوضع الليلي');
    btn.setAttribute('title',      isDark ? 'الوضع النهاري' : 'الوضع الليلي');
  }

  function applyDark(isDark){
    if (isDark) html.classList.add('dark-mode');
    else        html.classList.remove('dark-mode');
    updateIcon();
    try {
      window.dispatchEvent(new CustomEvent('percent:darkmode', {
        detail: { enabled: !!isDark }
      }));
    } catch(e){}
  }

  function toggle(){
    var isDark = !html.classList.contains('dark-mode');
    try { localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light'); } catch(e){}
    applyDark(isDark);
  }

  function injectButton(){
    if (document.getElementById('darkModeToggle')) return;

    // تجاهل صفحات الإدارة
    var path = location.pathname.toLowerCase();
    if (path.indexOf('admin') !== -1) return;

    var navIcons = document.querySelector('.nav-icons');
    if (!navIcons) return;

    var btn = document.createElement('button');
    btn.className = 'icon-btn dark-mode-toggle';
    btn.id = 'darkModeToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'تبديل الوضع الليلي');
    btn.innerHTML = '<i class="fas fa-moon"></i>';
    btn.addEventListener('click', function(e){
      e.preventDefault();
      toggle();
    });

    // ضعه بعد lang-switch مباشرة (أو قبل searchBtn)
    var langBtn   = navIcons.querySelector('.lang-switch');
    var searchBtn = navIcons.querySelector('#searchBtn');

    if (langBtn && langBtn.parentNode === navIcons) {
      langBtn.parentNode.insertBefore(btn, langBtn.nextSibling);
    } else if (searchBtn && searchBtn.parentNode === navIcons) {
      navIcons.insertBefore(btn, searchBtn);
    } else {
      navIcons.appendChild(btn);
    }

    updateIcon();
  }

  // تطبيق فوري (قبل الرندر) لمنع الوميض
  applyDark(getPref());

  function init(){
    applyDark(getPref());
    injectButton();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // مزامنة بين التبويبات المفتوحة
  window.addEventListener('storage', function(e){
    if (e.key === STORAGE_KEY) applyDark(getPref());
  });

  // مراقبة تغيير تفضيل النظام
  try {
    if (window.matchMedia){
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var handler = function(){
        try { if (!localStorage.getItem(STORAGE_KEY)) applyDark(mq.matches); } catch(e){}
      };
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler);
    }
  } catch(e){}

  // API عام
  window.PercentDarkMode = {
    toggle: toggle,
    isDark: function(){ return html.classList.contains('dark-mode'); },
    set: function(v){
      try { localStorage.setItem(STORAGE_KEY, v ? 'dark' : 'light'); } catch(e){}
      applyDark(!!v);
    },
    clear: function(){
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      applyDark(getPref());
    }
  };
})();