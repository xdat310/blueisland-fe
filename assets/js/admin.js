/* =========================================================
   BlueIsland Coffee – Trang quản trị (admin.js)
   Giai đoạn 2: khung trang, hash router, kiểm tra đăng nhập,
   chế độ xem trước, đăng xuất.
   ========================================================= */
(function () {
  'use strict';

  const API = window.BI_API || { USE_MOCK: false };
  const SESSION_KEY = 'bi_pos_session';

  /* ---------- Helpers ---------- */
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function showToast(msg, type = 'info') {
    const region = document.getElementById('toastRegion');
    if (!region) return;
    const colors =
      type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : type === 'error'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-shallow bg-white text-deep';
    const icon = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'bell';
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sea-lg transition-opacity ${colors}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<i data-lucide="${icon}" class="h-4 w-4 shrink-0"></i><span>${esc(msg)}</span>`;
    region.appendChild(toast);
    renderIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  function askConfirm(title, messageHtml, okLabel = 'Xác nhận') {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      document.getElementById('confirmTitle').textContent = title;
      document.getElementById('confirmMessage').innerHTML = messageHtml;
      document.getElementById('confirmOk').textContent = okLabel;
      modal.returnValue = '';
      const onClose = () => {
        modal.removeEventListener('close', onClose);
        resolve(modal.returnValue === 'ok');
      };
      modal.addEventListener('close', onClose);
      modal.showModal();
    });
  }

  /* ---------- 1. Kiểm tra quyền truy cập ----------
     LƯU Ý: kiểm tra phía client CHỈ để điều hướng giao diện.
     Bảo mật thật nằm ở backend: mọi API /api/admin/* phải kiểm tra
     token + role === 'admin' trước khi trả dữ liệu. */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const params = new URLSearchParams(window.location.search);
  // ?preview=1 chỉ hoạt động khi đang dùng dữ liệu giả.
  const isPreview = params.get('preview') === '1' && API.USE_MOCK === true;
  const session = getSession();

  let admin;
  if (isPreview) {
    admin = { code: 'PREVIEW', name: 'Xem trước', role: 'admin' };
  } else if (session && session.role === 'admin') {
    admin = session;
  } else {
    window.location.replace('index.html?auth=login');
    return;
  }

  document.getElementById('adminApp').hidden = false;
  if (isPreview) document.getElementById('previewBanner').hidden = false;

  const initials = String(admin.name || 'AD')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  document.getElementById('adminAvatar').textContent = initials || 'AD';
  document.getElementById('adminName').textContent = admin.name || 'Quản trị viên';

  /* ---------- 2. Đồng hồ ---------- */
  const clockEl = document.getElementById('clockText');
  function tick() {
    clockEl.textContent = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 3. Sidebar (drawer dưới 1024px) ---------- */
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openBtn = document.getElementById('sidebarOpen');
  const closeBtn = document.getElementById('sidebarClose');

  function setDrawer(open) {
    sidebar.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) closeBtn.focus();
  }
  openBtn.addEventListener('click', () => setDrawer(true));
  closeBtn.addEventListener('click', () => {
    setDrawer(false);
    openBtn.focus();
  });
  overlay.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      setDrawer(false);
      openBtn.focus();
    }
  });

  /* ---------- 4. Hash router ---------- */
  const VIEWS = {
    dashboard: 'Tổng quan',
    orders: 'Đơn hàng',
    menu: 'Thực đơn',
    staff: 'Nhân viên',
    reviews: 'Đánh giá',
    settings: 'Cài đặt'
  };
  const DEFAULT_VIEW = 'dashboard';

  // Trạng thái "rỗng" tạm thời cho các view chưa làm
  document.querySelectorAll('[data-placeholder]').forEach((el) => {
    el.className = 'mt-6 rounded-2xl border border-dashed border-mist bg-white p-10 text-center';
    el.innerHTML = `
      <span class="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-shallow text-ocean">
        <i data-lucide="hammer" class="h-6 w-6"></i>
      </span>
      <p class="font-bold text-deep">Đang xây dựng</p>
      <p class="mt-1 text-sm text-slate-600">${esc(el.dataset.placeholder)}</p>`;
  });

  function route() {
    const key = window.location.hash.replace(/^#/, '');
    if (!VIEWS[key]) {
      // Hash không hợp lệ → về mặc định, không tạo thêm mục lịch sử
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${DEFAULT_VIEW}`);
      showView(DEFAULT_VIEW);
      return;
    }
    showView(key);
  }

  function showView(key) {
    document.querySelectorAll('[data-view-panel]').forEach((p) => {
      p.hidden = p.dataset.viewPanel !== key;
    });
    document.querySelectorAll('#sideNav [data-view]').forEach((a) => {
      if (a.dataset.view === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.getElementById('pageTitle').textContent = VIEWS[key];
    document.title = `${VIEWS[key]} | Quản trị BlueIsland`;
    setDrawer(false);
    renderIcons();
  }

  window.addEventListener('hashchange', () => {
    route();
    document.getElementById('main').focus({ preventScroll: false });
  });
  route();

  /* ---------- 5. Đăng xuất ---------- */
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const ok = await askConfirm('Đăng xuất?', 'Bạn sẽ thoát khỏi trang quản trị và quay về trang chủ.', 'Đăng xuất');
    if (!ok) return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('blueisland_user');
    window.location.href = 'index.html';
  });

  renderIcons();
})();
