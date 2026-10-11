/* ============================================================
   PERCENT PERFUME — Product Card → Detail Page Link
   Global click handler for .product-card in index/women/men
   ============================================================ */
(function(){
  'use strict';
  if (window.__percentProductLinkBound) return;
  window.__percentProductLinkBound = true;

  document.addEventListener('click', function(e){
    // Ignore if clicking on add-to-cart, qa-btn, img-dot, or language switch
    if (e.target.closest('.add-to-cart')) return;
    if (e.target.closest('.qa-btn')) return;
    if (e.target.closest('.img-dot')) return;
    if (e.target.closest('.img-dots')) return;
    if (e.target.closest('a')) return;
    if (e.target.closest('button')) return;

    const card = e.target.closest('.product-card');
    if (!card) return;
    const id = card.dataset.name || card.dataset.id;
    if (!id) return;
    e.preventDefault();
    window.location.href = 'product.html?id=' + encodeURIComponent(id);
  }, true);
})();