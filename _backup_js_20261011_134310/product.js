/* ============================================================
   PERCENT PERFUME — Product Detail Page
   Phase 5.1 — Clean rebuild
   ============================================================ */
(function(){
  "use strict";

  var CFG = window.PERCENT_CONFIG;
  if (!CFG){
    console.error("[Product] PERCENT_CONFIG not found");
    return;
  }

  var SUPABASE_URL = CFG.SUPABASE_URL;
  var SUPABASE_KEY = CFG.SUPABASE_KEY;
  var HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json"
  };

  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var Cart = window.PercentCart;
  var Products = window.PercentProducts;
  var html = document.documentElement;

  var currentProduct = null;
  var currentQty = 1;
  var currentImages = [];
  var currentImageIndex = 0;
  var lang = html.dataset.lang || "ar";

  function esc(s){
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function formatJOD(n){ return Number(n || 0).toFixed(2); }

  var toastTimer = null;
  function showToast(msg, icon, type){
    var t = $("#toast");
    if (!t) return;
    var txt = $("#toastText");
    if (txt) txt.textContent = msg;
    var i = t.querySelector("i");
    if (i) i.className = "fas " + (icon || "fa-check-circle");
    t.classList.remove("error", "success");
    if (type) t.classList.add(type);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2800);
  }

  function getProductId(){
    var params = new URLSearchParams(location.search);
    return (params.get("id") || "").trim();
  }

  function showLoading(){
    var el = $("#loadingState");
    if (el) el.style.display = "";
    var nf = $("#notFound");
    if (nf) nf.style.display = "none";
    var pc = $("#productContent");
    if (pc) pc.style.display = "none";
  }
  function showNotFound(){
    var el = $("#loadingState");
    if (el) el.style.display = "none";
    var nf = $("#notFound");
    if (nf) nf.style.display = "";
    var pc = $("#productContent");
    if (pc) pc.style.display = "none";
  }
  function showContent(){
    var el = $("#loadingState");
    if (el) el.style.display = "none";
    var nf = $("#notFound");
    if (nf) nf.style.display = "none";
    var pc = $("#productContent");
    if (pc) pc.style.display = "";
  }

  function renderGallery(){
    var main = $("#galleryMain");
    var thumbs = $("#galleryThumbs");
    if (!main) return;

    currentImages = [];
    if (Array.isArray(currentProduct.images) && currentProduct.images.length){
      currentImages = currentProduct.images.filter(Boolean);
    } else if (currentProduct.image){
      currentImages = [currentProduct.image];
    }

    main.querySelectorAll("img").forEach(function(n){ n.remove(); });
    main.querySelectorAll(".gallery-dots").forEach(function(n){ n.remove(); });

    if (!currentImages.length){
      if (thumbs) thumbs.innerHTML = "";
      return;
    }

    currentImages.forEach(function(url, i){
      var img = document.createElement("img");
      img.src = url;
      img.alt = currentProduct.nameAr || currentProduct.nameEn || "Product";
      img.className = i === 0 ? "active" : "";
      img.loading = i === 0 ? "eager" : "lazy";
      img.onerror = function(){ this.style.opacity = "0"; };
      main.appendChild(img);
    });

    if (currentImages.length > 1){
      var dots = document.createElement("div");
      dots.className = "gallery-dots";
      currentImages.forEach(function(_, i){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "dot" + (i === 0 ? " active" : "");
        b.setAttribute("aria-label", "Image " + (i + 1));
        b.addEventListener("click", function(){ setImageIndex(i); });
        dots.appendChild(b);
      });
      main.appendChild(dots);
    }

    if (thumbs){
      thumbs.innerHTML = currentImages.map(function(url, i){
        return '<button type="button" class="gallery-thumb' + (i === 0 ? " active" : "") + '" data-idx="' + i + '">' +
          '<img src="' + esc(url) + '" alt="" onerror="this.style.opacity=0">' +
        "</button>";
      }).join("");

      thumbs.querySelectorAll(".gallery-thumb").forEach(function(b){
        b.addEventListener("click", function(){
          setImageIndex(parseInt(b.dataset.idx, 10));
        });
      });
    }

    currentImageIndex = 0;
  }

  function setImageIndex(idx){
    if (idx < 0 || idx >= currentImages.length) return;
    currentImageIndex = idx;
    $("#galleryMain").querySelectorAll("img").forEach(function(img, i){
      img.classList.toggle("active", i === idx);
    });
    $$("#galleryMain .gallery-dots .dot").forEach(function(d, i){
      d.classList.toggle("active", i === idx);
    });
    $$("#galleryThumbs .gallery-thumb").forEach(function(t, i){
      t.classList.toggle("active", i === idx);
    });
  }

  function renderTag(){
    var tagEl = $("#galleryTag");
    if (!tagEl) return;
    var labels = {
      "new":  { ar: "جديد", en: "NEW" },
      "sale": { ar: "عرض", en: "SALE" },
      "best": { ar: "الأكثر مبيعاً", en: "BEST" },
      "luxe": { ar: "فاخر", en: "LUXE" }
    };
    if (currentProduct.tag && labels[currentProduct.tag]){
      tagEl.textContent = lang === "ar" ? labels[currentProduct.tag].ar : labels[currentProduct.tag].en;
      tagEl.className = "gallery-tag " + currentProduct.tag;
      tagEl.style.display = "";
    } else {
      tagEl.style.display = "none";
    }
  }

  function renderInfo(){
    var p = currentProduct;
    var brandEl = $("#productBrand");
    if (brandEl) brandEl.textContent = p.brandLabel || p.brand || "";

    var nameArEl = $("#productNameAr");
    if (nameArEl) nameArEl.textContent = p.nameAr || p.nameEn || "";

    var nameEnEl = $("#productNameEn");
    if (nameEnEl) nameEnEl.textContent = p.nameEn || "";

    var catText = p.category === "men" ? "عطور رجالية" : (p.category === "women" ? "عطور نسائية" : "المتجر");
    var breadCatText = $("#breadCategoryText");
    if (breadCatText){
      breadCatText.innerHTML = '<span class="lang-ar">' + catText + '</span>' +
        '<span class="lang-en">' + (p.category === "men" ? "Men" : (p.category === "women" ? "Women" : "Shop")) + "</span>";
    }
    var breadLink = $("#breadCategoryLink");
    if (breadLink){
      breadLink.href = p.category === "men" ? "men.html" : (p.category === "women" ? "women.html" : "index.html");
    }
    var breadName = $("#breadProductName");
    if (breadName) breadName.textContent = p.nameAr || p.nameEn || "";

    var priceEl = $("#productPrice");
    if (priceEl) priceEl.innerHTML = formatJOD(p.price) + " <small>JOD</small>";

    var oldPriceEl = $("#productOldPrice");
    var discEl = $("#productDiscount");
    if (p.oldPrice && Number(p.oldPrice) > Number(p.price)){
      if (oldPriceEl){
        oldPriceEl.textContent = formatJOD(p.oldPrice) + " JOD";
        oldPriceEl.style.display = "";
      }
      if (discEl){
        var disc = Math.round((1 - p.price / p.oldPrice) * 100);
        discEl.textContent = "-" + disc + "%";
        discEl.style.display = "";
      }
    } else {
      if (oldPriceEl) oldPriceEl.style.display = "none";
      if (discEl) discEl.style.display = "none";
    }

    var notesWrap = $("#productNotesWrap");
    var notesList = $("#productNotesList");
    if (Array.isArray(p.notes) && p.notes.length){
      if (notesWrap) notesWrap.style.display = "";
      if (notesList){
        notesList.innerHTML = p.notes.map(function(n){
          return '<span class="note-pill">' + esc(n) + "</span>";
        }).join("");
      }
    } else {
      if (notesWrap) notesWrap.style.display = "none";
    }

    var descAr = "<p>عطر <strong>" + esc(p.nameAr || p.nameEn) + "</strong> من <strong>" + esc(p.brandLabel || p.brand) + "</strong>" +
      (Array.isArray(p.notes) && p.notes.length ? " بنوتات عطرية مميزة تشمل " + p.notes.map(function(n){ return esc(n); }).join("، ") + "." : ".") +
      " تجربة عطرية فاخرة تدوم طويلاً وتناسب جميع المناسبات.</p>" +
      "<p>جميع منتجاتنا أصلية ومستوردة من أرقى المصادر العالمية.</p>";
    var descEn = "<p><strong>" + esc(p.nameEn) + "</strong> by <strong>" + esc(p.brandLabel || p.brand) + "</strong>.</p>" +
      "<p>All our products are original and sourced from the finest global suppliers.</p>";

    var descEl = $("#productDesc");
    if (descEl){
      descEl.innerHTML = '<div class="lang-ar">' + descAr + '</div>' +
        '<div class="lang-en">' + descEn + "</div>";
    }
    var tabDesc = $("#tabDesc");
    if (tabDesc){
      tabDesc.innerHTML = "<h3>عن هذا العطر</h3>" +
        '<div class="lang-ar">' + descAr + '</div>' +
        '<div class="lang-en">' + descEn + "</div>";
    }
    var tabNotes = $("#tabNotes");
    if (tabNotes){
      if (Array.isArray(p.notes) && p.notes.length){
        tabNotes.innerHTML = "<h3>النوتات العطرية</h3>" +
          '<div class="notes-list">' + p.notes.map(function(n){ return '<span class="note-pill">' + esc(n) + "</span>"; }).join("") + "</div>";
      } else {
        tabNotes.innerHTML = "<p>لا توجد نوتات مسجلة لهذا المنتج.</p>";
      }
    }

    document.title = (p.nameAr || p.nameEn) + " | PERCENT PERFUME";
  }

  function loadReviews(){
    return fetch(SUPABASE_URL + "/rest/v1/rpc/get_product_reviews", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ p_product_id: currentProduct.id, p_limit: 50, p_offset: 0 })
    }).then(function(r){
      return r.ok ? r.json() : [];
    }).then(function(reviews){
      var box = $("#tabReviews");
      if (!box) return;
      if (!reviews || !reviews.length){
        box.innerHTML = '<div class="reviews-empty"><i class="fas fa-star"></i>' +
          "<strong>لا توجد تقييمات بعد</strong>" +
          "<p>كن أول من يقيّم هذا العطر</p></div>";
        return;
      }
      var reviewsHTML = reviews.map(function(r){
        var stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        var date = new Date(r.created_at).toLocaleDateString("ar-JO");
        var reply = r.admin_reply
          ? '<div class="review-item-reply"><strong>رد PERCENT:</strong>' + esc(r.admin_reply) + "</div>"
          : "";
        return '<div class="review-item">' +
          '<div class="review-item-head">' +
            '<div class="review-item-author">' + esc(r.customer_name || "عميل") + "</div>" +
            '<div class="review-item-stars">' + stars + "</div>" +
          "</div>" +
          '<div class="review-item-date">' + date + "</div>" +
          (r.title ? '<div class="review-item-title">' + esc(r.title) + "</div>" : "") +
          '<div class="review-item-comment">' + esc(r.comment) + "</div>" +
          reply +
        "</div>";
      }).join("");
      box.innerHTML = '<div class="reviews-list">' + reviewsHTML + "</div>";
    }).catch(function(e){
      console.warn("[Reviews] error:", e);
      var box = $("#tabReviews");
      if (box) box.innerHTML = "<p>تعذر تحميل التقييمات</p>";
    });
  }

  function renderRelated(){
    if (!Products) return;
    var all = Products.getActive ? Products.getActive() : [];
    if (!all.length) return;
    var sameBrand = all.filter(function(p){ return p.id !== currentProduct.id && p.brand === currentProduct.brand; });
    var sameCat = all.filter(function(p){ return p.id !== currentProduct.id && p.brand !== currentProduct.brand && p.category === currentProduct.category; });
    var combined = sameBrand.concat(sameCat).slice(0, 8);
    var grid = $("#relatedGrid");
    if (!grid) return;
    if (!combined.length){
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">لا توجد منتجات مشابهة</p>';
      return;
    }
    grid.innerHTML = combined.map(function(p){
      var img = p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" onerror="this.remove()">' : "";
      var oldPrice = p.oldPrice ? '<span class="price-old">' + formatJOD(p.oldPrice) + "</span>" : "";
      return '<article class="product-card" data-id="' + esc(p.id) + '">' +
        '<div class="product-media">' +
          '<svg class="placeholder"><use href="#logo-mark"/></svg>' +
          img +
        "</div>" +
        '<span class="product-cat">' + esc(p.brandLabel || p.brand || "") + "</span>" +
        '<h3 class="product-title-ar">' + esc(p.nameAr) + "</h3>" +
        '<p class="product-title-en">' + esc(p.subEn || p.nameEn) + "</p>" +
        '<div class="product-price-row">' +
          '<span class="price-now">' + formatJOD(p.price) + " JOD</span>" + oldPrice +
        "</div>" +
      "</article>";
    }).join("");
    grid.querySelectorAll(".product-card[data-id]").forEach(function(card){
      card.addEventListener("click", function(){
        location.href = "product.html?id=" + encodeURIComponent(card.dataset.id);
      });
    });
  }

  function bindQtyControls(){
    var input = $("#qtyInput");
    var dec = $("#qtyMinus");
    var inc = $("#qtyPlus");
    if (!input || !dec || !inc) return;
    function setQty(v){
      v = Math.max(1, Math.min(99, parseInt(v, 10) || 1));
      currentQty = v;
      input.value = v;
      dec.disabled = v <= 1;
    }
    dec.addEventListener("click", function(){ setQty(currentQty - 1); });
    inc.addEventListener("click", function(){ setQty(currentQty + 1); });
    input.addEventListener("change", function(){ setQty(input.value); });
    setQty(1);
  }

  function bindAddToCart(){
    var btn = $("#addToCartMain");
    if (!btn) return;
    btn.addEventListener("click", function(){
      if (!currentProduct) return;
      Cart.add({
        id: currentProduct.id,
        nameAr: currentProduct.nameAr,
        nameEn: currentProduct.nameEn,
        price: currentProduct.price,
        qty: currentQty,
        category: currentProduct.brand || "",
        image: currentProduct.image || ""
      });
      showToast(lang === "ar" ? "تمت الإضافة إلى السلة" : "Added to cart", "fa-check-circle", "success");
      var original = btn.innerHTML;
      btn.classList.add("added");
      btn.innerHTML = '<i class="fas fa-check"></i> تمت الإضافة';
      setTimeout(function(){
        btn.classList.remove("added");
        btn.innerHTML = original;
      }, 1500);
    });
  }

  function bindWishlist(){
    var btn = $("#wishlistBtn");
    if (!btn) return;
    btn.addEventListener("click", function(){
      btn.classList.toggle("active");
      var icon = btn.querySelector("i");
      var active = btn.classList.contains("active");
      if (icon) icon.className = active ? "fas fa-heart" : "far fa-heart";
      showToast(active ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة", "fa-heart");
    });
  }

  function bindShare(){
    var url = location.href;
    var title = currentProduct ? (currentProduct.nameAr || currentProduct.nameEn) : "PERCENT PERFUME";
    var wa = $("#shareWhatsapp");
    var fb = $("#shareFacebook");
    var tw = $("#shareTwitter");
    var cp = $("#shareCopy");
    if (wa) wa.addEventListener("click", function(){ window.open("https://wa.me/?text=" + encodeURIComponent(title + " " + url), "_blank"); });
    if (fb) fb.addEventListener("click", function(){ window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank"); });
    if (tw) tw.addEventListener("click", function(){ window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url), "_blank"); });
    if (cp) cp.addEventListener("click", function(){
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        showToast("تم نسخ الرابط", "fa-check-circle", "success");
      } catch(e){}
    });
  }

  function bindTabs(){
    $$(".tab-btn").forEach(function(b){
      b.addEventListener("click", function(){
        var tab = b.dataset.tab;
        $$(".tab-btn").forEach(function(x){ x.classList.toggle("active", x.dataset.tab === tab); });
        $$(".tab-panel").forEach(function(p){ p.classList.toggle("active", p.dataset.panel === tab); });
      });
    });
    var jump = $("#jumpToReviews");
    if (jump){
      jump.addEventListener("click", function(){
        var rt = document.querySelector('.tab-btn[data-tab="reviews"]');
        if (rt) rt.click();
        var ts = document.querySelector(".tabs-section");
        if (ts) ts.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function applyLang(){
    html.dataset.lang = lang;
    html.lang = lang;
    html.dir = (lang === "ar") ? "rtl" : "ltr";
    var b = $("#langBtn");
    if (b) b.textContent = (lang === "ar") ? "EN" : "AR";
    if (currentProduct){
      renderTag();
      renderInfo();
    }
  }

  function bindLangBtn(){
    var b = $("#langBtn");
    if (!b) return;
    b.addEventListener("click", function(){
      lang = (lang === "ar") ? "en" : "ar";
      applyLang();
    });
  }

  function bindHeader(){
    var header = $("#header");
    var progress = $("#scrollProgress");
    function onScroll(){
      var y = window.scrollY;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      if (header) header.classList.toggle("scrolled", y > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var mt = $("#menuToggle");
    var nl = $("#navLinks");
    if (mt && nl){
      mt.addEventListener("click", function(){
        nl.classList.toggle("active");
        var i = mt.querySelector("i");
        var open = nl.classList.contains("active");
        if (i){
          i.classList.toggle("fa-bars", !open);
          i.classList.toggle("fa-times", open);
        }
      });
    }
  }

  function fetchProduct(id){
    // Try cache
    try {
      var cached = sessionStorage.getItem("percent_product_" + id);
      if (cached){
        var parsed = JSON.parse(cached);
        if (parsed && parsed.ts && (Date.now() - parsed.ts < 5 * 60 * 1000)){
          return Promise.resolve(parsed.data);
        }
      }
    } catch(e){}

    // Fetch from Supabase
    return fetch(SUPABASE_URL + "/rest/v1/products?id=eq." + encodeURIComponent(id) + "&select=*&limit=1", {
      headers: HEADERS
    }).then(function(res){
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function(rows){
      if (!rows || !rows.length) return null;
      var raw = rows[0];
      var p = {
        id: raw.id,
        category: raw.category,
        brand: raw.brand,
        brandLabel: raw.brand_label,
        nameAr: raw.name_ar,
        nameEn: raw.name_en,
        subEn: raw.sub_en,
        price: Number(raw.price) || 0,
        oldPrice: raw.old_price != null ? Number(raw.old_price) : null,
        image: raw.image,
        images: Array.isArray(raw.images) ? raw.images : (raw.image ? [raw.image] : []),
        notes: Array.isArray(raw.notes) ? raw.notes : [],
        tag: raw.tag,
        stars: raw.stars || 5,
        reviews: raw.reviews || 0,
        active: raw.active !== false,
        createdAt: raw.created_at
      };
      try {
        sessionStorage.setItem("percent_product_" + id, JSON.stringify({ ts: Date.now(), data: p }));
      } catch(e){}
      return p;
    }).catch(function(e){
      console.warn("[Product] fetch error:", e);
      return null;
    });
  }

  function init(){
    showLoading();
    bindHeader();
    bindLangBtn();
    applyLang();

    var y = $("#year");
    if (y) y.textContent = new Date().getFullYear();

    var id = getProductId();
    if (!id){
      showNotFound();
      return;
    }

    fetchProduct(id).then(function(p){
      if (!p || p.active === false){
        showNotFound();
        return;
      }
      currentProduct = p;
      window.__percentCurrentProduct = p;

      renderGallery();
      renderTag();
      renderInfo();
      bindQtyControls();
      bindAddToCart();
      bindWishlist();
      bindShare();
      bindTabs();
      showContent();

      setTimeout(function(){
        try {
          if (Products && Products.fetchProducts){
            Products.fetchProducts().then(function(){
              renderRelated();
            }).catch(function(){});
          } else {
            renderRelated();
          }
        } catch(e){}
        loadReviews();
        try {
          if (Products && Products.trackView) Products.trackView(id);
        } catch(e){}
      }, 100);
    }).catch(function(e){
      console.error("[Product] init error:", e);
      showNotFound();
    });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", function(){
    setTimeout(function(){
      var pre = document.getElementById("preloader");
      if (pre) pre.classList.add("hidden");
    }, 400);
  });
  setTimeout(function(){
    var pre = document.getElementById("preloader");
    if (pre) pre.classList.add("hidden");
  }, 2500);

})();