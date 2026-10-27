/* ============================================================
   PERCENT PERFUME — Testers Nav Link (Updated)
   - يضيف رابط "عطور التست" إلى شريط التنقل في كل الصفحات
   - ينقل الزبون مباشرة إلى صفحة testers.html
   ============================================================ */
(function(){
  'use strict';
  if (window.__percentTestersLoaded) return;
  window.__percentTestersLoaded = true;

  function addTestersLink(){
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // تحقق إذا كان الرابط موجوداً مسبقاً
    if (navLinks.querySelector('a[href="testers.html"]')) return;

    // إنشاء الرابط
    var link = document.createElement('a');
    link.href = 'testers.html';
    link.innerHTML = '<span class="lang-ar">عطور التست</span><span class="lang-en">Testers</span>';

    // إدراجه بعد رابط "عطور رجالية" أو قبل "نظام الولاء"
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

  // تشغيل الكود عند تحميل الصفحة
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', addTestersLink);
  } else {
    addTestersLink();
  }

  // مراقبة التغييرات في حال تم إضافة شريط التنقل لاحقاً
  if (window.MutationObserver){
    var mo = new MutationObserver(function(){ addTestersLink(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function(){ mo.disconnect(); }, 5000);
  }
})();