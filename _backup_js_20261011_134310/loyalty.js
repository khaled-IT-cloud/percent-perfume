/* ============================================================
   PERCENT PRIVÉ — Loyalty Program v2.0
   Complete rebuild: Points (PERC), Tiers, Referrals, Rewards
   ============================================================ */
(function (global) {
  'use strict';

  const SUPABASE_URL = 'https://iedmrzocqgscnybpvxed.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Q_vZjEcX-bN6Dkyee3jN5g_TWlovcPQ';
  const ADMIN_FN_URL = SUPABASE_URL + '/functions/v1/admin-write';

  const SESSION_KEY = 'percent_prive_session';
  const CONFIG_KEY  = 'percent_prive_config';

  /* ══════════════════════════════════════════════════════════
     TIERS CONFIG — PERCENT PRIVÉ
     ══════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════
     TIERS & REWARDS — Loaded from Supabase (loyalty_tiers + loyalty_rewards)
     ══════════════════════════════════════════════════════════ */
  let TIERS = [];
  let REWARDS = [];

  const POINTS_TO_JOD = 100; // 100 PERC = 1 JOD
  const JOIN_BONUS = 100;
  const BIRTHDAY_BONUS = 500;
  const REFERRAL_REFERRER_BONUS = 200;
  const REFERRAL_REFERRED_BONUS = 100;

  /* ══════════════════════════════════════════════════════════
     CONFIG — Simple wrapper
     ══════════════════════════════════════════════════════════ */
  function getConfig(){
    return {
      tiers: TIERS,
      rewards: REWARDS,
      pointsToJod: POINTS_TO_JOD,
      joinBonus: JOIN_BONUS,
      birthdayBonus: BIRTHDAY_BONUS
    };
  }

  function setConfig(cfg){
    // Optimistic local update (instant UI response)
    if (cfg && Array.isArray(cfg.tiers))   TIERS   = cfg.tiers.slice();
    if (cfg && Array.isArray(cfg.rewards)) REWARDS = cfg.rewards.slice();
    emit();
    // Persist to Supabase in background
    syncConfigToDB(cfg).catch(function(e){
      console.error('[Loyalty] setConfig sync failed:', e);
    });
    return true;
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS — Phone
     ══════════════════════════════════════════════════════════ */
  function normalizePhone(phone){
    let p = String(phone || '').replace(/[\s\-\(\)]/g, '');
    p = p.replace(/^\+?962/, '0').replace(/^00962/, '0');
    if (/^7\d{8}$/.test(p)) p = '0' + p;
    return p;
  }
  function isValidPhone(phone){
    return /^07\d{8}$/.test(normalizePhone(phone));
  }

  /* ══════════════════════════════════════════════════════════
     ADMIN TOKEN
     ══════════════════════════════════════════════════════════ */
  let adminToken = null;
  function setAdminToken(token) { adminToken = token; }
  function getAdminToken() {
    if (adminToken) return adminToken;
    try { return localStorage.getItem('percent_admin_token') || null; }
    catch(e) { return null; }
  }
  function clearAdminToken() {
    adminToken = null;
    try { localStorage.removeItem('percent_admin_token'); } catch(e){}
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  /* ══════════════════════════════════════════════════════════
     CACHE
     ══════════════════════════════════════════════════════════ */
  let membersCache = [];
  let transactionsCache = {};
  let referralsCache = [];

  /* ══════════════════════════════════════════════════════════
     MAP FROM DB
     ══════════════════════════════════════════════════════════ */
  function mapMemberFromDB(m){
    return {
      phone: m.phone,
      name: m.name,
      email: m.email || '',
      birthday: m.birthday || '',
      notes: m.notes || '',
      points: Number(m.points) || 0,
      lifetimePoints: Number(m.lifetime_points) || 0,
      tier: m.tier || 'essential',
      blocked: !!m.blocked,
      marketingConsent: !!m.marketing_consent,
      termsConsent: !!m.terms_consent,
      referralCode: m.referral_code || '',
      referredBy: m.referred_by || '',
      orderCount: Number(m.order_count) || 0,
      totalSpent: Number(m.total_spent) || 0,
      joinBonusGiven: !!m.join_bonus_given,
      birthdayBonusYear: m.birthday_bonus_year || null,
      createdAt: m.created_at,
      lastActivity: m.last_activity
    };
  }

  /* ══════════════════════════════════════════════════════════
     FETCH
     ══════════════════════════════════════════════════════════ */
  async function fetchMembers(){
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/loyalty_members?select=*&order=created_at.desc',
        { headers: headers }
      );
      if (!res.ok) return membersCache;
      const data = await res.json();
      membersCache = (data || []).map(mapMemberFromDB);
      emit();
      return membersCache;
    } catch(e) {
      console.error('fetchMembers error:', e);
      return membersCache;
    }
  }

  async function fetchTransactions(phone){
    const p = normalizePhone(phone);
    if (!p) return [];
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/loyalty_transactions?phone=eq.' + encodeURIComponent(p) + '&select=*&order=created_at.desc',
        { headers: headers }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const txs = (data || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount) || 0,
        reason: t.reason || '',
        note: t.note || '',
        orderId: t.order_id || '',
        date: t.created_at
      }));
      transactionsCache[p] = txs;
      emit();  // ⚡ FIX: notify UI listeners after fetch
      return txs;
    } catch(e){
      emit();
      return transactionsCache[p] || [];
    }
  }

  async function fetchReferrals(phone){
    const p = normalizePhone(phone);
    if (!p) return [];
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/loyalty_referrals?referrer_phone=eq.' + encodeURIComponent(p) + '&select=*',
        { headers: headers }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const refs = (data || []).filter(r => r.referrer_phone === p);
      referralsCache = refs;
      return refs;
    } catch(e){
      return [];
    }
  }

  /* ══════════════════════════════════════════════════════════
     TIERS & REWARDS — Supabase sync
     ══════════════════════════════════════════════════════════ */
  function mapTierFromDB(t){
    return {
      id: t.id,
      nameAr: t.name_ar,
      nameEn: t.name_en,
      minPoints: Number(t.min_points) || 0,
      icon: t.icon || 'fa-medal',
      color: t.color || '#c9a961',
      bg: t.bg || ('linear-gradient(135deg,' + (t.color || '#c9a961') + ',' + (t.color || '#c9a961') + 'cc)'),
      benefitsAr: Array.isArray(t.benefits_ar) ? t.benefits_ar : [],
      benefitsEn: Array.isArray(t.benefits_en) ? t.benefits_en : [],
      sortOrder: Number(t.sort_order) || 0,
      active: t.active !== false
    };
  }

  function mapTierToDB(t, idx){
    return {
      id: t.id,
      name_ar: t.nameAr || '',
      name_en: t.nameEn || '',
      min_points: Number(t.minPoints) || 0,
      icon: t.icon || 'fa-medal',
      color: t.color || '#c9a961',
      bg: t.bg || '',
      benefits_ar: Array.isArray(t.benefitsAr) ? t.benefitsAr : [],
      benefits_en: Array.isArray(t.benefitsEn) ? t.benefitsEn : (Array.isArray(t.benefitsAr) ? t.benefitsAr : []),
      sort_order: idx != null ? idx : (t.sortOrder || 0),
      active: t.active !== false
    };
  }

  function mapRewardFromDB(r){
    return {
      id: r.id,
      nameAr: r.name_ar,
      nameEn: r.name_en,
      descAr: r.desc_ar || '',
      descEn: r.desc_en || '',
      pointsCost: Number(r.points_cost) || 0,
      type: r.type || 'gift',
      value: Number(r.value) || 0,
      icon: r.icon || 'fa-gift',
      sortOrder: Number(r.sort_order) || 0,
      active: r.active !== false
    };
  }

  function mapRewardToDB(r, idx){
    return {
      id: r.id,
      name_ar: r.nameAr || '',
      name_en: r.nameEn || '',
      desc_ar: r.descAr || '',
      desc_en: r.descEn || '',
      points_cost: Number(r.pointsCost) || 0,
      type: r.type || 'gift',
      value: Number(r.value) || 0,
      icon: r.icon || 'fa-gift',
      sort_order: idx != null ? idx : (r.sortOrder || 0),
      active: r.active !== false
    };
  }

  async function fetchTiers(){
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/loyalty_tiers?select=*&order=sort_order.asc,min_points.asc',
        { headers: headers }
      );
      if (!res.ok) return TIERS;
      const data = await res.json();
      TIERS = (data || []).map(mapTierFromDB);
      emit();
      return TIERS;
    } catch(e){
      console.error('fetchTiers error:', e);
      return TIERS;
    }
  }

  async function fetchRewards(){
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/loyalty_rewards?select=*&order=sort_order.asc,points_cost.asc',
        { headers: headers }
      );
      if (!res.ok) return REWARDS;
      const data = await res.json();
      REWARDS = (data || []).map(mapRewardFromDB);
      emit();
      return REWARDS;
    } catch(e){
      console.error('fetchRewards error:', e);
      return REWARDS;
    }
  }

  function getWriteHeaders(){
    const jwt = getAdminToken();
    const auth = jwt ? ('Bearer ' + jwt) : ('Bearer ' + SUPABASE_KEY);
    return {
      'apikey': SUPABASE_KEY,
      'Authorization': auth,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    };
  }
  async function syncConfigToDB(cfg){
    if (!cfg) return;
    const newTiers   = Array.isArray(cfg.tiers)   ? cfg.tiers   : null;
    const newRewards = Array.isArray(cfg.rewards) ? cfg.rewards : null;

    const upsertHeaders = getWriteHeaders();

    if (newTiers){
      const tierRows = newTiers.map(function(t, i){ return mapTierToDB(t, i); });
      if (tierRows.length){
        const res = await fetch(SUPABASE_URL + '/rest/v1/loyalty_tiers', {
          method: 'POST',
          headers: upsertHeaders,
          body: JSON.stringify(tierRows)
        });
        if (!res.ok){
          const errTxt = await res.text().catch(function(){ return ''; });
          console.error('[Loyalty] tier upsert failed:', res.status, errTxt);
        }
      }
      const newIds = newTiers.map(function(t){ return t.id; });
      const toDelete = TIERS.map(function(t){ return t.id; }).filter(function(id){ return newIds.indexOf(id) === -1; });
      if (toDelete.length){
        const url = SUPABASE_URL + '/rest/v1/loyalty_tiers?id=in.(' + toDelete.map(encodeURIComponent).join(',') + ')';
        await fetch(url, { method: 'DELETE', headers: getWriteHeaders() });
      }
    }

    if (newRewards){
      const rewardRows = newRewards.map(function(r, i){ return mapRewardToDB(r, i); });
      if (rewardRows.length){
        const res = await fetch(SUPABASE_URL + '/rest/v1/loyalty_rewards', {
          method: 'POST',
          headers: upsertHeaders,
          body: JSON.stringify(rewardRows)
        });
        if (!res.ok){
          const errTxt = await res.text().catch(function(){ return ''; });
          console.error('[Loyalty] reward upsert failed:', res.status, errTxt);
        }
      }
      const newIds = newRewards.map(function(r){ return r.id; });
      const toDelete = REWARDS.map(function(r){ return r.id; }).filter(function(id){ return newIds.indexOf(id) === -1; });
      if (toDelete.length){
        const url = SUPABASE_URL + '/rest/v1/loyalty_rewards?id=in.(' + toDelete.map(encodeURIComponent).join(',') + ')';
        await fetch(url, { method: 'DELETE', headers: getWriteHeaders() });
      }
    }

    await fetchTiers();
    await fetchRewards();
  }
  /* ══════════════════════════════════════════════════════════
     ADMIN CALL — Edge Function with JWT
     ══════════════════════════════════════════════════════════ */
  async function callAdmin(action, data){
    const jwt = getAdminToken();
    if (!jwt) return { ok: false, reason: 'no_admin_token' };
    try {
      const res = await fetch(ADMIN_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + jwt
        },
        body: JSON.stringify({ action: action, data: data })
      });
      const result = await res.json();
      if (!res.ok) return Object.assign({ ok: false, reason: result.error || 'server_error' }, result);
      return Object.assign({ ok: true }, result);
    } catch(e){
      console.error('callAdmin error:', e);
      return { ok: false, reason: 'network' };
    }
  }

  /* ══════════════════════════════════════════════════════════
     GETTERS
     ══════════════════════════════════════════════════════════ */
  function getMembers(){ return membersCache.slice(); }

  function getMember(phone){
    const p = normalizePhone(phone);
    if (!p) return null;
    return membersCache.find(function(m){ return m.phone === p; }) || null;
  }

  function getMemberByReferral(code){
    if (!code) return null;
    const upper = String(code).toUpperCase().trim();
    return membersCache.find(function(m){ return m.referralCode === upper; }) || null;
  }

  /* ══════════════════════════════════════════════════════════
     CREATE MEMBER — with referral support
     ══════════════════════════════════════════════════════════ */
  async function createMember(phone, data){
    const p = normalizePhone(phone);
    if (!isValidPhone(p)) return { ok: false, reason: 'invalid_phone' };
    const existing = getMember(p);
    if (existing) return { ok: false, reason: 'exists', member: existing };

    // Call RPC (works for public registration)
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/register_loyalty_member', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          p_phone: p,
          p_name: String(data.name || '').trim() || 'عضو جديد',
          p_email: String(data.email || '').trim() || null,
          p_birthday: data.birthday || null,
          p_marketing_consent: !!data.marketingConsent,
          p_terms_consent: !!data.termsConsent,
          p_referred_by: data.referredBy || null
        })
      });

      if (!res.ok) {
        console.error('[Loyalty] register RPC failed:', res.status);
        return { ok: false, reason: 'server_' + res.status };
      }

      const result = await res.json();

      if (!result.ok){
        return { ok: false, reason: result.reason || 'unknown' };
      }

      await fetchMembers();
      return { ok: true, member: getMember(p) };
    } catch(e){
      console.error('[Loyalty] createMember error:', e);
      return { ok: false, reason: 'network' };
    }
  }

  async function updateMember(phone, updates){
    const p = normalizePhone(phone);
    if (!getMember(p)) return false;
    const res = await callAdmin('loyalty.member.update', Object.assign({ phone: p }, updates));
    if (res.ok) { await fetchMembers(); return true; }
    return false;
  }

  async function deleteMember(phone){
    const p = normalizePhone(phone);
    const res = await callAdmin('loyalty.member.delete', { phone: p });
    if (res.ok) {
      await fetchMembers();
      const sess = readSession();
      if (sess && sess.phone === p) logout();
      return true;
    }
    return false;
  }

  /* ══════════════════════════════════════════════════════════
     POINTS — Admin only
     ══════════════════════════════════════════════════════════ */
  async function addPoints(phone, amount, reason, note){
    const p = normalizePhone(phone);
    const res = await callAdmin('loyalty.points.add', { phone: p, amount: amount, reason: reason, note: note });
    if (res.ok){
      await fetchMembers();
      await fetchTransactions(p);
      return { ok: true };
    }
    return res;
  }

  async function removePoints(phone, amount, reason, note){
    const p = normalizePhone(phone);
    const res = await callAdmin('loyalty.points.remove', { phone: p, amount: amount, reason: reason, note: note });
    if (res.ok){
      await fetchMembers();
      await fetchTransactions(p);
      return { ok: true };
    }
    return res;
  }

  async function setPoints(phone, newPoints, reason, note){
    const p = normalizePhone(phone);
    const member = getMember(p);
    if (!member) return { ok: false, reason: 'not_found' };
    newPoints = Math.max(0, Math.floor(Number(newPoints) || 0));
    const diff = newPoints - member.points;
    if (diff === 0) return { ok: true, member: member };
    if (diff > 0) return addPoints(p, diff, reason || 'admin_set', note);
    return removePoints(p, -diff, reason || 'admin_set', note);
  }

  /* ══════════════════════════════════════════════════════════
     REDEEM — used at checkout
     ══════════════════════════════════════════════════════════ */
  async function redeemPoints(phone, points, orderId){
    const p = normalizePhone(phone);
    if (!isValidPhone(p)) return { ok: false, reason: 'invalid_phone' };
    points = Math.floor(Number(points));
    if (!points || points <= 0) return { ok: false, reason: 'invalid_amount' };
    if (!orderId) return { ok: false, reason: 'missing_order_id' };

    // Check local balance first (fast fail)
    const member = getMember(p);
    if (!member) return { ok: false, reason: 'not_found' };
    if (member.points < points) {
      return { ok: false, reason: 'insufficient', available: member.points };
    }

    // Call RPC to actually deduct
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/redeem_loyalty_points', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          p_phone: p,
          p_points: points,
          p_order_id: orderId
        })
      });

      if (!res.ok) {
        console.error('[Loyalty] RPC error:', res.status);
        return { ok: false, reason: 'server_' + res.status };
      }

      const result = await res.json();

      if (!result.ok){
        return { ok: false, reason: result.reason || 'rpc_failed', ...result };
      }

      // Update local cache
      await fetchMembers();
      await fetchTransactions(p);

      return {
        ok: true,
        member: getMember(p),
        pointsUsed: result.pointsUsed,
        discount: result.discount,
        newPoints: result.newPoints
      };
    } catch(e){
      console.error('[Loyalty] redeemPoints error:', e);
      return { ok: false, reason: 'network' };
    }
  }

  async function refundPoints(phone, orderId){
    const p = normalizePhone(phone);
    if (!isValidPhone(p)) return { ok: false, reason: 'invalid_phone' };
    if (!orderId) return { ok: false, reason: 'missing_order_id' };

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/refund_loyalty_points', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ p_phone: p, p_order_id: orderId })
      });
      if (!res.ok) return { ok: false, reason: 'server_' + res.status };
      const result = await res.json();
      if (result.ok){
        await fetchMembers();
        await fetchTransactions(p);
      }
      return result;
    } catch(e){
      return { ok: false, reason: 'network' };
    }
  }

  /* ══════════════════════════════════════════════════════════
     TRANSACTIONS
     ══════════════════════════════════════════════════════════ */
  function getTransactions(phone){
    const p = normalizePhone(phone);
    return (transactionsCache[p] || []).slice();
  }
  function getAllTransactions(){ return Object.assign({}, transactionsCache); }

  /* ══════════════════════════════════════════════════════════
     TIERS LOGIC
     ══════════════════════════════════════════════════════════ */
  function getTierId(lifetimePoints){
    const pts = Number(lifetimePoints) || 0;
    const sorted = TIERS.slice().sort(function(a,b){ return a.minPoints - b.minPoints; });
    let current = sorted[0];
    for (let i = 0; i < sorted.length; i++){
      if (pts >= sorted[i].minPoints) current = sorted[i];
      else break;
    }
    return current;
  }

  // ⚡ NEW: Get tier from CURRENT points balance (not lifetime)
  function getCurrentTier(pointsBalance){
    return getTierId(pointsBalance);
  }

  function getCurrentTierProgress(pointsBalance){
    return getTierProgress(pointsBalance);
  }
  function getNextTier(lifetimePoints){
    const pts = Number(lifetimePoints) || 0;
    const sorted = TIERS.slice().sort(function(a,b){ return a.minPoints - b.minPoints; });
    for (let i = 0; i < sorted.length; i++){
      if (pts < sorted[i].minPoints) return sorted[i];
    }
    return null;
  }

  function getTierProgress(lifetimePoints){
    const current = getTierId(lifetimePoints);
    const next = getNextTier(lifetimePoints);
    if (!next) return { percent: 100, current: current, next: null, remaining: 0 };
    const span = next.minPoints - current.minPoints;
    const gained = (Number(lifetimePoints) || 0) - current.minPoints;
    const percent = span > 0 ? Math.min(100, Math.max(0, (gained / span) * 100)) : 0;
    return {
      percent: percent,
      current: current,
      next: next,
      remaining: Math.max(0, next.minPoints - (Number(lifetimePoints) || 0))
    };
  }

  /* ══════════════════════════════════════════════════════════
     SESSION
     ══════════════════════════════════════════════════════════ */
  function readSession(){
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e){ return null; }
  }

  function currentPhone(){
    const s = readSession();
    return s ? s.phone : null;
  }

  function currentMember(){
    const p = currentPhone();
    if (!p) return null;
    return getMember(p);
  }

  async function login(phone){
    const p = normalizePhone(phone);
    if (!isValidPhone(p)) return { ok: false, reason: 'invalid_phone' };
    const member = getMember(p);
    if (!member) return { ok: false, reason: 'not_found' };
    if (member.blocked) return { ok: false, reason: 'blocked' };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        phone: p,
        loggedAt: new Date().toISOString()
      }));
    } catch(e){}
    emit();
    return { ok: true, member: member };
  }

  function logout(){
    try { localStorage.removeItem(SESSION_KEY); } catch(e){}
    emit();
  }

  function isLoggedIn(){
    return !!currentPhone() && !!currentMember();
  }

  /* ══════════════════════════════════════════════════════════
     STATS
     ══════════════════════════════════════════════════════════ */
  function getStats(){
    const members = getMembers();
    const totalPoints = members.reduce(function(s,m){ return s + (m.points || 0); }, 0);
    const totalLifetime = members.reduce(function(s,m){ return s + (m.lifetimePoints || 0); }, 0);
    const totalSpent = members.reduce(function(s,m){ return s + (m.totalSpent || 0); }, 0);
    const byTier = {};
    members.forEach(function(m){ byTier[m.tier] = (byTier[m.tier] || 0) + 1; });
    return {
      totalMembers: members.length,
      totalPoints: totalPoints,
      totalLifetime: totalLifetime,
      totalSpent: totalSpent,
      avgPoints: members.length ? totalPoints / members.length : 0,
      byTier: byTier
    };
  }

  /* ══════════════════════════════════════════════════════════
     EVENTS
     ══════════════════════════════════════════════════════════ */
  const listeners = new Set();
  function emit(){
    const state = {
      member: currentMember(),
      isLoggedIn: isLoggedIn(),
      config: getConfig(),
      members: membersCache
    };
    listeners.forEach(function(fn){ try { fn(state); } catch(e){} });
  }
  function onChange(fn){
    listeners.add(fn);
    fn({
      member: currentMember(),
      isLoggedIn: isLoggedIn(),
      config: getConfig(),
      members: membersCache
    });
    return function(){ listeners.delete(fn); };
  }

  window.addEventListener('storage', function(e){
    if (e.key === SESSION_KEY) emit();
  });

  /* ══════════════════════════════════════════════════════════
     REALTIME
     ══════════════════════════════════════════════════════════ */
  let realtimeClient = null;
  function initRealtime(){
    try {
      if (typeof supabase === 'undefined') return;
      realtimeClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      realtimeClient
        .channel('prive-loyalty-realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'loyalty_members' },
          function(){ fetchMembers(); })
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'loyalty_transactions' },
          function(){ const p = currentPhone(); if (p) fetchTransactions(p); })
        .subscribe();
    } catch(e){ console.warn('Loyalty realtime failed:', e); }
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════ */
  global.PercentLoyalty = {
    // Config
    getConfig: getConfig,
    setConfig: setConfig,
    get TIERS(){ return TIERS; },
    get REWARDS(){ return REWARDS; },
    getTiers: function(){ return TIERS.slice(); },
    getRewards: function(){ return REWARDS.slice(); },
    fetchTiers: fetchTiers,
    fetchRewards: fetchRewards,

    // Members
    getMembers: getMembers,
    getMember: getMember,
    getMemberByReferral: getMemberByReferral,
    createMember: createMember,
    updateMember: updateMember,
    deleteMember: deleteMember,

    // Points
    addPoints: addPoints,
    removePoints: removePoints,
    setPoints: setPoints,

    // Tiers
    getTierId: getTierId,
    getCurrentTier: getCurrentTier,
    getCurrentTierProgress: getCurrentTierProgress,
    getNextTier: getNextTier,
    getTierProgress: getTierProgress,

    // Transactions
    getTransactions: getTransactions,
    getAllTransactions: getAllTransactions,
    fetchTransactions: fetchTransactions,
    fetchMembers: fetchMembers,
    fetchReferrals: fetchReferrals,

    // Session
    login: login,
    logout: logout,
    currentPhone: currentPhone,
    currentMember: currentMember,
    isLoggedIn: isLoggedIn,

    // Helpers
    normalizePhone: normalizePhone,
    isValidPhone: isValidPhone,

    // Stats
    getStats: getStats,

    // Order integration
    findMemberByPhone: getMember,
    redeemPoints: redeemPoints,
    refundPoints: refundPoints,

    // Admin token
    setAdminToken: setAdminToken,
    getAdminToken: getAdminToken,
    clearAdminToken: clearAdminToken,

    // Constants
    POINTS_TO_JOD: POINTS_TO_JOD,
    JOIN_BONUS: JOIN_BONUS,
    BIRTHDAY_BONUS: BIRTHDAY_BONUS,
    REFERRAL_REFERRER_BONUS: REFERRAL_REFERRER_BONUS,
    REFERRAL_REFERRED_BONUS: REFERRAL_REFERRED_BONUS,

    // Events
    onChange: onChange
  };

  /* ══════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════ */
  fetchTiers()
    .then(function(){ return fetchRewards(); })
    .then(function(){ return fetchMembers(); })
    .then(function(){
      const p = currentPhone();
      if (p) fetchTransactions(p);
      initRealtime();
    });

})(window);