/* ============================================================
   PERCENT PERFUME — Service Worker (Phase 7.1)
   Basic offline caching strategy
   ============================================================ */

const CACHE_NAME = 'percent-v2';
const CACHE_URLS = [
  './',
  './index.html',
  './women.html',
  './men.html',
  './cart.html',
  './loyalty.html',
  './product.html',
  './customer-service.html',
  './about.html',
  './mobile.css',
  './loyalty-prive.css',
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

/* Install — cache core files */
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CACHE_URLS).catch(function(err){
        console.warn('[SW] Some files failed to cache:', err);
      });
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

/* Activate — cleanup old caches */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.map(function(name){
          if (name !== CACHE_NAME){
            return caches.delete(name);
          }
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* Fetch — network first, fallback to cache */
self.addEventListener('fetch', function(event){
  var req = event.request;

  /* Skip non-GET */
  if (req.method !== 'GET') return;

  /* Skip Supabase API requests */
  var url = req.url;
  if (url.indexOf('supabase.co') !== -1) return;
  if (url.indexOf('cdn.jsdelivr.net') !== -1) return;
  if (url.indexOf('cdnjs.cloudflare.com') !== -1) return;
  if (url.indexOf('fonts.googleapis.com') !== -1) return;
  if (url.indexOf('fonts.gstatic.com') !== -1) return;

  event.respondWith(
    fetch(req).then(function(response){
      /* Cache successful responses (same-origin only) */
      if (response && response.status === 200 && url.indexOf(location.origin) === 0){
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(req, cloned).catch(function(){});
        });
      }
      return response;
    }).catch(function(){
      /* Network failed — try cache */
      return caches.match(req).then(function(cached){
        if (cached) return cached;
        /* Return fallback for navigation requests */
        if (req.mode === 'navigate'){
          return caches.match('./index.html');
        }
      });
    })
  );
});