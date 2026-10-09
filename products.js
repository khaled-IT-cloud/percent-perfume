/* ============================================================
   PERCENT PERFUME — Products Module (Supabase)
   ============================================================ */
(function(global){
  'use strict';

  const CFG = window.PERCENT_CONFIG;
  const SUPABASE_URL = CFG.SUPABASE_URL;
  const SUPABASE_PUBLIC_KEY = CFG.SUPABASE_KEY;
  
  // ⚠️ المفتاح السري — يُحدد في admin.html فقط
  // لا تضع المفتاح السري هنا! فقط اتركه فاضي، ورح يُملأ من admin.html
  const SUPABASE_ADMIN_KEY = global.__SUPABASE_ADMIN_KEY || null;

  if (typeof supabase === 'undefined'){
    console.error('Supabase SDK not loaded! Add the CDN script.');
    return;
  }

  const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ADMIN_KEY || SUPABASE_PUBLIC_KEY
  );

  const TAG_LABELS = {
    new:  { ar: 'جديد',          en: 'NEW'  },
    sale: { ar: 'عرض',           en: 'SALE' },
    best: { ar: 'الأكثر مبيعاً', en: 'BEST' },
    luxe: { ar: 'فاخر',          en: 'LUXE' }
  };

  let cachedProducts = [];

  /* ---------- تحويل البيانات من DB لـ JS ---------- */
  function mapFromDB(p){
    return {
      id: p.id,
      category: p.category,
      brand: p.brand,
      brandLabel: p.brand_label,
      nameAr: p.name_ar,
      nameEn: p.name_en,
      subEn: p.sub_en,
      price: Number(p.price) || 0,
      oldPrice: p.old_price != null ? Number(p.old_price) : null,
      image: p.image,
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      notes: Array.isArray(p.notes) ? p.notes : [],
      tag: p.tag,
      stars: p.stars || 5,
      reviews: p.reviews || 0,
      active: p.active !== false,
      createdAt: p.created_at
    };
  }

  function mapToDB(data){
    const out = {};
    if (data.category !== undefined) out.category = data.category;
    if (data.brand !== undefined) out.brand = data.brand;
    if (data.brandLabel !== undefined) out.brand_label = data.brandLabel;
    if (data.nameAr !== undefined) out.name_ar = data.nameAr;
    if (data.nameEn !== undefined) out.name_en = data.nameEn;
    if (data.subEn !== undefined) out.sub_en = data.subEn;
    if (data.price !== undefined) out.price = Number(data.price) || 0;
    if (data.oldPrice !== undefined) out.old_price = data.oldPrice ? Number(data.oldPrice) : null;
    if (data.image !== undefined) out.image = data.image;
    if (data.images !== undefined) out.images = Array.isArray(data.images) ? data.images : [];
    if (data.notes !== undefined) out.notes = Array.isArray(data.notes) ? data.notes : [];
    if (data.tag !== undefined) out.tag = data.tag || null;
    if (data.stars !== undefined) out.stars = Number(data.stars) || 5;
    if (data.reviews !== undefined) out.reviews = Number(data.reviews) || 0;
    if (data.active !== undefined) out.active = data.active !== false;
    return out;
  }

  /* ---------- جلب المنتجات ---------- */
  async function fetchProducts(){
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error){ console.error('Fetch error:', error); return cachedProducts; }
    cachedProducts = (data || []).map(mapFromDB);
    emit();
    return cachedProducts;
  }

  /* ---------- إضافة ---------- */
  async function addProduct(data){
    const payload = mapToDB(data);
    payload.id = slugify(data.nameEn) + '-' + Date.now().toString(36);
    const { error } = await client.from('products').insert(payload);
    if (error){ console.error('Add error:', error); return { ok:false, reason:error.message }; }
    await fetchProducts();
    return { ok:true };
  }

  /* ---------- تعديل ---------- */
  async function updateProduct(id, updates){
    const payload = mapToDB(updates);
    const { error } = await client.from('products').update(payload).eq('id', id);
    if (error){ console.error('Update error:', error); return { ok:false, reason:error.message }; }
    await fetchProducts();
    return { ok:true };
  }

  /* ---------- حذف ---------- */
  async function deleteProduct(id){
    const { error } = await client.from('products').delete().eq('id', id);
    if (error){ console.error('Delete error:', error); return { ok:false, reason:error.message }; }
    await fetchProducts();
    return { ok:true };
  }

  /* ---------- Helpers ---------- */
  function slugify(str){
    return String(str || '').toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-|-$/g, '') || 'product';
  }

  function getProducts(){ return cachedProducts; }
  function getActive(){ return cachedProducts.filter(p => p.active !== false); }
  function getByCategory(cat){ return getActive().filter(p => p.category === cat); }
  function getById(id){ return cachedProducts.find(p => p.id === id) || null; }


  /* ============================================================
     PRODUCT VIEWS TRACKING (Phase 4.3)
     ============================================================ */
  const VIEWS_SESSION_KEY = 'percent_viewed_products';
  const VIEWS_WINDOW_MS = 30 * 60 * 1000; // 30 دقيقة

  function getSessionId(){
    let sid = sessionStorage.getItem('percent_view_session');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      try { sessionStorage.setItem('percent_view_session', sid); } catch(e){}
    }
    return sid;
  }

  function getViewedProducts(){
    try {
      const raw = sessionStorage.getItem(VIEWS_SESSION_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      const now = Date.now();
      // Clean expired
      const clean = {};
      Object.keys(data).forEach(k => {
        if (now - data[k] < VIEWS_WINDOW_MS) clean[k] = data[k];
      });
      return clean;
    } catch(e){ return {}; }
  }

  function markProductViewed(productId){
    try {
      const viewed = getViewedProducts();
      viewed[productId] = Date.now();
      sessionStorage.setItem(VIEWS_SESSION_KEY, JSON.stringify(viewed));
    } catch(e){}
  }

  async function trackView(productId){
    if (!productId) return { ok: false, reason: 'no_product_id' };
    
    // تحقق من عدم التكرار في هذه الجلسة
    const viewed = getViewedProducts();
    if (viewed[productId]) {
      return { ok: true, skipped: true };
    }

    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/product_views',
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_PUBLIC_KEY,
            'Authorization': 'Bearer ' + SUPABASE_PUBLIC_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            product_id: String(productId),
            session_id: getSessionId()
          })
        }
      );
      
      if (res.ok) {
        markProductViewed(productId);
        return { ok: true };
      }
      return { ok: false, reason: 'server_' + res.status };
    } catch(e){
      console.warn('[Views] Track failed:', e);
      return { ok: false, reason: 'network' };
    }
  }

  async function fetchTopViewedProducts(days, limit){
    days = days || 30;
    limit = limit || 10;
    
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // جلب المشاهدات
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/product_views?select=product_id,viewed_at&viewed_at=gte.' + encodeURIComponent(since),
        {
          headers: {
            'apikey': SUPABASE_PUBLIC_KEY,
            'Authorization': 'Bearer ' + SUPABASE_PUBLIC_KEY
          }
        }
      );
      
      if (!res.ok) return [];
      
      const data = await res.json();
      const counts = {};
      (data || []).forEach(v => {
        counts[v.product_id] = (counts[v.product_id] || 0) + 1;
      });
      
      // حوّل إلى مصفوفة
      const top = Object.keys(counts)
        .map(pid => ({ productId: pid, views: counts[pid] }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
      
      return top;
    } catch(e){
      console.warn('[Views] Fetch failed:', e);
      return [];
    }
  }

  /* ---------- Events ---------- */
  const listeners = new Set();
  function emit(){
    const state = { products: cachedProducts };
    listeners.forEach(fn => { try { fn(state); } catch(e){ console.error(e); } });
  }
  function onChange(fn){
    listeners.add(fn);
    fn({ products: cachedProducts });
    return () => listeners.delete(fn);
  }

  /* ---------- Realtime ---------- */
  function initRealtime(){
    try {
      client
        .channel('products-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => { fetchProducts(); }
        )
        .subscribe();
    } catch(e){ console.warn('Realtime failed:', e); }
  }

  /* ---------- Init ---------- */
  fetchProducts().then(() => initRealtime());

  global.PercentProducts = {
    getProducts, getActive, getByCategory, getById,
    addProduct, updateProduct, deleteProduct,
    onChange, fetchProducts, TAG_LABELS, trackView, fetchTopViewedProducts
  };

})(window);