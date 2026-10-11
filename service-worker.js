/* ═══════════════════════════════════════════════════════════
   PERCENT PERFUME — Service Worker (Auto-Update v5.0)
   يجبر كل الزبائن على رؤية أحدث نسخة من الموقع
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'percent-v5-' + Date.now(); // ← يتغير كل مرة يُحدّث الملف
const CACHE_URLS = [
  './',
  './index.html',
  './women.html',
  './men.html',
  './cart.html',
  './loyalty.html',
  './product.html',
  './customer-service.html',
  './mobile.css',
  './mobile-app.css',
  './loyalty-prive.css',
  './mobile-fix-override.css',
  './config.js',
  './cart.js',
  './cart-ui.js',
  './products.js',
  './store.js',
  './loyalty.js',
  './wishlist.js',
  './product.js',
  './product-link.js',
  './reviews.js',
  './reviews-display.js',
  './cookie-banner.js',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

/* ─── Install: احفظ ملفات جديدة وامسح القديمة فوراً ─── */
self.addEventListener('install', function(event){
  self.skipWaiting(); // ← لا تنتظر الزائر يغلق المتصفح
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CACHE_URLS).catch(function(err){
        console.warn('[SW] Some files failed to cache:', err);
      });
    })
  );
});

/* ─── Activate: امسح كل الكاشات القديمة فوراً ─── */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.map(function(name){
          if (name !== CACHE_NAME){
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(function(){
      return self.clients.claim(); // ← سيطر على كل التبويبات فوراً
    })
  );
});

/* ─── Fetch: Network First (حديث دائماً) ─── */
self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = req.url;
  
  // لا تخزّن طلبات API
  if (url.indexOf('supabase.co') !== -1) return;
  if (url.indexOf('cdn.jsdelivr.net') !== -1) return;
  if (url.indexOf('cdnjs.cloudflare.com') !== -1) return;
  if (url.indexOf('fonts.googleapis.com') !== -1) return;
  if (url.indexOf('fonts.gstatic.com') !== -1) return;

  // جرب الشبكة أولاً — إذا فشلت، استخدم الكاش
  event.respondWith(
    fetch(req).then(function(response){
      // خزّن نسخة محدثة في الخلفية
      if (response && response.status === 200 && url.indexOf(location.origin) === 0){
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(req, cloned).catch(function(){});
        });
      }
      return response;
    }).catch(function(){
      // الشبكة فشلت → ابحث في الكاش
      return caches.match(req).then(function(cached){
        if (cached) return cached;
        if (req.mode === 'navigate'){
          return caches.match('./index.html');
        }
      });
    })
  );
});

/* ─── استقبل رسالة من الصفحة: "حدّث نفسك فوراً" ─── */
self.addEventListener('message', function(event){
  if (event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});