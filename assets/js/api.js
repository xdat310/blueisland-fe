/* =========================================================
   BlueIsland Coffee – API Layer (api.js)
   ---------------------------------------------------------
   - USE_MOCK = true : dữ liệu giả
   - USE_MOCK = false: gọi fetch thật tới backend
   Backend tự tính tổng tiền, kiểm tra quyền.
   ========================================================= */
(function () {
  'use strict';

  const USE_MOCK = false;
  const API_BASE = '/api';
  const SESSION_KEY = 'bi_pos_session';

  function getToken() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
      return session.access_token || session.token || '';
    } catch {
      return '';
    }
  }

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  async function request(method, path, body = null) {
    const opts = { method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${err}`);
    }
    return res.json().catch(() => ({}));
  }

  // === Orders ===
  const orders = {
    list: () => request('GET', '/orders'),
    create: (data) => request('POST', '/orders', data),
    getById: (id) => request('GET', `/orders/${id}`),
    updateStatus: (id, status) => request('PATCH', `/orders/${id}/status`, { status }),
  };

  // === Menu ===
  const menu = {
    search: (q = '', category = 'all') => request('GET', `/menu?q=${q}&category=${category}`),
    categories: () => request('GET', '/categories'),
    list: () => request('GET', '/admin/menu'),
    create: (data) => request('POST', '/admin/menu', data),
    update: (id, data) => request('PUT', `/admin/menu/${id}`, data),
    delete: (id) => request('DELETE', `/admin/menu/${id}`),
  };

  // === Auth ===
  const auth = {
    login: (username, password) => request('POST', '/auth/login', { username, password }),
    me: () => request('GET', '/auth/me'),
  };

  // === Admin - Staff ===
  const staff = {
    list: () => request('GET', '/admin/staff'),
    create: (data) => request('POST', '/admin/staff', data),
    update: (id, data) => request('PUT', `/admin/staff/${id}`, data),
    setActive: (id, active) => request('PATCH', `/admin/staff/${id}/active?active=${active}`),
  };

  // === Admin - Stats ===
  const stats = {
    summary: () => request('GET', '/admin/stats/summary'),
    daily: (days = 7) => request('GET', `/admin/stats/daily?days=${days}`),
    topProducts: (limit = 5) => request('GET', `/admin/stats/top-products?limit=${limit}`),
    byStaff: () => request('GET', '/admin/stats/by-staff'),
  };

  window.BI_API = {
    USE_MOCK,
    orders,
    menu,
    auth,
    staff,
    stats,
  };
})();
