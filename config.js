/* ============================================================
   PERCENT PERFUME â€” Central Configuration (v3)
   All constants in one place â€” no more duplication
   ============================================================ */
(function(global) {
  'use strict';

  global.PERCENT_CONFIG = {
    // â”€â”€ Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    SUPABASE_URL: 'https://iedmrzocqgscnybpvxed.supabase.co',
    SUPABASE_KEY: 'sb_publishable_Q_vZjEcX-bN6Dkyee3jN5g_TWlovcPQ',
    ADMIN_FN_URL: 'https://iedmrzocqgscnybpvxed.supabase.co/functions/v1/admin-write',

    // â”€â”€ Business Rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    POINTS_TO_JOD: 100,
    TRASH_RETENTION_DAYS: 30,
    AUTO_REFRESH_MS: 30000,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,

    // â”€â”€ Coupons (moved to Supabase in Phase 4) â”€â”€â”€â”€â”€â”€â”€â”€
    COUPONS: {
      'PERCENT10': { type: 'percent', value: 10, labelAr: 'Ø®ØµÙ… 10%', labelEn: '10% off' },
      'PERCENT20': { type: 'percent', value: 20, labelAr: 'Ø®ØµÙ… 20%', labelEn: '20% off' },
      'OUD25':     { type: 'percent', value: 25, labelAr: 'Ø®ØµÙ… 25%', labelEn: '25% off' },
      'WELCOME15': { type: 'percent', value: 15, labelAr: 'Ø®ØµÙ… 15%', labelEn: '15% off' }
    },

        // â”€â”€ Analytics (GA4 + Meta Pixel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Ø§Ù…Ù„Ø£ IDs Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„ØªØªØ¨Ø¹. Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºØ§Ù‹ Ù„ØªØ¹Ø·ÙŠÙ„Ù‡.
    // GA4: Google Analytics 4 Measurement ID (looks like: G-XXXXXXXXXX)
    // Pixel: Meta Pixel ID (looks like: 1234567890123456)
    ANALYTICS: {
      GA4_ID: 'G-JW3YBLLDMB',
      META_PIXEL_ID: '',
      DEBUG: true
    },
// â”€â”€ Version â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    VERSION: '3.0.0'
  };

  console.log('[PERCENT] Config loaded:', global.PERCENT_CONFIG.VERSION);
})(window);