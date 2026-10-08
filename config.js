/* ============================================================
   PERCENT PERFUME — Central Configuration (v3)
   All constants in one place — no more duplication
   ============================================================ */
(function(global) {
  'use strict';

  global.PERCENT_CONFIG = {
    // ── Supabase ──────────────────────────────────────
    SUPABASE_URL: 'https://iedmrzocqgscnybpvxed.supabase.co',
    SUPABASE_KEY: 'sb_publishable_Q_vZjEcX-bN6Dkyee3jN5g_TWlovcPQ',
    ADMIN_FN_URL: 'https://iedmrzocqgscnybpvxed.supabase.co/functions/v1/admin-write',

    // ── Business Rules ────────────────────────────────
    POINTS_TO_JOD: 100,
    TRASH_RETENTION_DAYS: 30,
    AUTO_REFRESH_MS: 30000,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,

    // ── Coupons (moved to Supabase in Phase 4) ────────
    COUPONS: {
      'PERCENT10': { type: 'percent', value: 10, labelAr: 'خصم 10%', labelEn: '10% off' },
      'PERCENT20': { type: 'percent', value: 20, labelAr: 'خصم 20%', labelEn: '20% off' },
      'OUD25':     { type: 'percent', value: 25, labelAr: 'خصم 25%', labelEn: '25% off' },
      'WELCOME15': { type: 'percent', value: 15, labelAr: 'خصم 15%', labelEn: '15% off' }
    },

    // ── Version ───────────────────────────────────────
    VERSION: '3.0.0'
  };

  console.log('[PERCENT] Config loaded:', global.PERCENT_CONFIG.VERSION);
})(window);