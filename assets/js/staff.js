/* =========================================================
   BlueIsland Coffee – POS / Khu vực nhân viên (staff.js)
   ========================================================= */
(function () {
  'use strict';

  const MENU = window.BI_MENU || { all: [] };

  const CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'special', label: 'Signature' },
    { id: 'espresso', label: 'Café máy' },
    { id: 'coffee', label: 'Cà phê Việt' },
    { id: 'tea', label: 'Trà trái cây' },
    { id: 'ice', label: 'Đá xay' },
    { id: 'juice', label: 'Nước ép & Sinh tố' },
    { id: 'other', label: 'Matcha & Khác' }
  ];

  const TOPPINGS = [
    { id: 'kem-muoi', name: 'Kem muối biển', price: 7000 },
    { id: 'kem-trung', name: 'Kem trứng nướng', price: 8000 },
    { id: 'tran-chau', name: 'Trân châu trắng', price: 5000 },
    { id: 'thach-dao', name: 'Thạch đào', price: 5000 }
  ];

  // Danh mục tài khoản nhân viên (Đã xóa dữ liệu mẫu - Tài khoản sẽ được cấp từ Backend)
  const STAFF_DIRECTORY = {};

  const STORAGE_KEYS = {
    SESSION: 'bi_pos_session',
    ORDERS: 'bi_pos_orders'
  };

  /* ---------- Helpers ---------- */
  const fmtPrice = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const stripVN = (str) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function showToast(msg, type = 'info') {
    const region = document.getElementById('toastRegion');
    const srLive = document.getElementById('srLive');
    if (srLive) srLive.textContent = msg;
    if (!region) return;

    const colors =
      type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : type === 'error'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-shallow bg-white text-deep';

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sea-lg transition-all ${colors}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'bell'}" class="h-4 w-4 shrink-0 text-ocean"></i>
      <span>${esc(msg)}</span>
    `;
    region.appendChild(toast);
    renderIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  function askConfirm(title, messageHtml) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      if (!modal || typeof modal.showModal !== 'function') {
        resolve(window.confirm(title));
        return;
      }
      titleEl.textContent = title;
      msgEl.innerHTML = messageHtml;
      const onClose = () => {
        modal.removeEventListener('close', onClose);
        resolve(modal.returnValue === 'ok');
      };
      modal.addEventListener('close', onClose);
      modal.showModal();
    });
  }

  /* ---------- State ---------- */
  let currentStaff = null;
  let activePosTab = 'order';
  let activeMenuCat = 'all';
  let searchQuery = '';
  let activeQueueSubTab = 'waiting';

  let cart = {
    type: 'dine-in', // 'dine-in' | 'takeaway'
    table: 'B01',
    customerName: '',
    studentId: '',
    payMethod: 'cash', // 'cash' | 'transfer'
    cashReceived: 0,
    items: []
  };

  let orders = [];

  // Tự động xóa sạch toàn bộ lịch sử đơn cũ trong localStorage
  try {
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
  } catch {}

  async function loadOrders() {
    /* =========================================================================
       KẾT NỐI BACKEND API (Tải danh sách đơn hàng thực tế từ Database):
       -------------------------------------------------------------------------
       try {
         const res = await fetch('/api/orders', {
           headers: { 'Authorization': `Bearer ${currentStaff?.token || ''}` }
         });
         if (res.ok) {
           orders = await res.json();
           renderQueue();
           renderHistory();
           return;
         }
       } catch (err) {
         console.warn('Chưa kết nối Backend API để tải đơn hàng:', err);
       }
       ========================================================================= */

    // Mặc định ban đầu hoàn toàn sạch (0 đơn) - chỉ khi gọi Backend API mới có đơn
    orders = [];
    renderQueue();
    renderHistory();
  }

  function saveOrders() {
    // Không lưu cứng vào localStorage nữa. Toàn bộ đơn hàng sẽ được lưu qua Backend API.
  }

  /* ---------- 1. Shift Management (Phiên làm việc POS) ---------- */
  const posApp = document.getElementById('posApp');

  function getSavedSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function startShift(staff) {
    currentStaff = {
      ...staff,
      startedAt: staff.startedAt || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentStaff));

    if (posApp) posApp.classList.remove('hidden');

    const avatarEl = document.getElementById('staffAvatar');
    const nameEl = document.getElementById('staffName');
    const shiftEl = document.getElementById('staffShift');
    if (avatarEl) avatarEl.textContent = currentStaff.code.slice(0, 2).toUpperCase();
    if (nameEl) nameEl.textContent = `${currentStaff.name} (${currentStaff.code})`;
    if (shiftEl) shiftEl.textContent = `${currentStaff.shift} · Vào ca ${currentStaff.startedAt}`;

    loadOrders();
    initOrderScreen();
    renderQueue();
    renderHistory();
    renderIcons();
  }

  async function endShift() {
    const ok = await askConfirm(
      'Xác nhận kết thúc ca làm việc?',
      'Bạn sẽ kết ca và trở về trang chủ BlueIsland Coffee.'
    );
    if (!ok) return;
    currentStaff = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    showToast('Đã kết ca làm việc.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }

  document.getElementById('endShiftBtn')?.addEventListener('click', endShift);
  document.getElementById('endShiftBtn2')?.addEventListener('click', endShift);

  /* ---------- Clock ---------- */
  function updateClock() {
    const el = document.getElementById('clockText');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('vi-VN', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Topbar Tabs ---------- */
  const posTabs = document.querySelectorAll('#posTabs [role="tab"]');
  const panels = {
    order: document.getElementById('panelOrder'),
    queue: document.getElementById('panelQueue'),
    history: document.getElementById('panelHistory')
  };

  function switchPosTab(tabName) {
    activePosTab = tabName;
    posTabs.forEach((btn) => {
      const selected = btn.dataset.tab === tabName;
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    Object.entries(panels).forEach(([k, panel]) => {
      if (!panel) return;
      panel.hidden = k !== tabName;
    });
    if (tabName === 'queue') renderQueue();
    if (tabName === 'history') renderHistory();
    renderIcons();
  }

  posTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchPosTab(btn.dataset.tab));
  });

  /* ---------- 2. Tab Order mới ---------- */
  function initOrderScreen() {
    renderCategoryTabs();
    renderMenuGrid();
    renderTableGrid();
    renderCart();
  }

  function renderCategoryTabs() {
    const container = document.getElementById('catTabs');
    if (!container) return;
    container.innerHTML = CATEGORIES.map((c) => {
      const active = c.id === activeMenuCat;
      return `
        <button type="button" role="tab" data-cat="${c.id}" aria-selected="${active}"
          class="menu-tab shrink-0 whitespace-nowrap text-sm !px-4 !py-2">
          ${esc(c.label)}
        </button>
      `;
    }).join('');

    container.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeMenuCat = btn.dataset.cat;
        renderCategoryTabs();
        renderMenuGrid();
      });
    });
  }

  function renderMenuGrid() {
    const grid = document.getElementById('menuGrid');
    const emptyEl = document.getElementById('menuEmpty');
    if (!grid) return;

    const rawList = MENU[activeMenuCat] || MENU.all || [];
    const q = stripVN(searchQuery.trim());
    const filtered = q
      ? rawList.filter((item) => stripVN(item.name).includes(q) || stripVN(item.desc).includes(q))
      : rawList;

    if (emptyEl) emptyEl.classList.toggle('hidden', filtered.length > 0);

    grid.innerHTML = filtered
      .map(
        (item, idx) => `
      <article class="menu-card group cursor-pointer hover:border-ocean" data-item-idx="${idx}">
        <div class="menu-img aspect-[4/3]">
          <img src="${item.img}" alt="${esc(item.name)}" loading="lazy" />
          ${
            item.tag
              ? `<span class="menu-tag !text-[#E63946] !bg-white/95 border border-[#E63946]/20 shadow-sm">${esc(item.tag)}</span>`
              : ''
          }
        </div>
        <div class="flex flex-1 flex-col justify-between p-3.5">
          <div>
            <h3 class="text-sm font-bold text-[#142274] group-hover:text-ocean line-clamp-1">${esc(item.name)}</h3>
            <p class="mt-1 text-xs text-slate-500 line-clamp-2">${esc(item.desc)}</p>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-mist/60">
            <span class="text-sm font-extrabold text-[#E63946] tabular-nums">${fmtPrice(item.price)}</span>
            <button type="button" data-quick-add="${idx}" aria-label="Thêm nhanh ${esc(item.name)}"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-shallow text-ocean hover:bg-ocean hover:text-white transition-colors">
              <i data-lucide="plus" class="h-4 w-4"></i>
            </button>
          </div>
        </div>
      </article>`
      )
      .join('');

    grid.querySelectorAll('[data-item-idx]').forEach((card) => {
      const idx = Number(card.dataset.itemIdx);
      const item = filtered[idx];
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-quick-add]')) return;
        openOptionModal(item);
      });
    });

    grid.querySelectorAll('[data-quick-add]').forEach((btn) => {
      const idx = Number(btn.dataset.quickAdd);
      const item = filtered[idx];
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addItemToCart({
          name: item.name,
          basePrice: item.price,
          unitPrice: item.price,
          qty: 1,
          size: 'M',
          sugar: '100%',
          ice: '100%',
          toppings: [],
          note: ''
        });
        showToast(`Đã thêm ${item.name} vào đơn.`, 'success');
      });
    });

    renderIcons();
  }

  // Tìm kiếm món + phím tắt /
  const menuSearch = document.getElementById('menuSearch');
  if (menuSearch) {
    menuSearch.addEventListener('input', () => {
      searchQuery = menuSearch.value;
      renderMenuGrid();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && activePosTab === 'order' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      menuSearch?.focus();
    }
  });

  /* ---------- Modal Tuỳ chọn món ---------- */
  function openOptionModal(item) {
    const modal = document.getElementById('optionModal');
    const body = document.getElementById('optionBody');
    if (!modal || !body) return;

    let size = 'M';
    let sugar = '100%';
    let ice = '100%';
    let qty = 1;
    const selectedToppings = new Set();

    function calcUnitPrice() {
      const sizeExtra = size === 'L' ? 5000 : 0;
      const topExtra = TOPPINGS.filter((t) => selectedToppings.has(t.id)).reduce((s, t) => s + t.price, 0);
      return item.price + sizeExtra + topExtra;
    }

    function updateModalPrice() {
      const totalBtn = document.getElementById('optSubmitPrice');
      const qtyText = document.getElementById('optQtyText');
      if (qtyText) qtyText.textContent = String(qty);
      if (totalBtn) totalBtn.textContent = fmtPrice(calcUnitPrice() * qty);
    }

    body.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 id="optionTitle" class="text-lg font-extrabold text-deep">${esc(item.name)}</h3>
          <p class="text-xs text-slate-600 mt-0.5">${esc(item.desc)}</p>
        </div>
        <button type="button" id="optCloseBtn" class="pos-icon-btn" aria-label="Đóng">
          <i data-lucide="x" class="h-4 w-4"></i>
        </button>
      </div>

      <div class="mt-4 space-y-4">
        <div>
          <p class="pos-label">Kích cỡ (Size)</p>
          <div class="grid grid-cols-2 gap-2" id="optSizeGroup">
            <button type="button" data-size="M" class="rounded-xl border border-ocean bg-shallow/60 py-2 text-xs font-bold text-deep cursor-pointer">
              Size M (+0đ)
            </button>
            <button type="button" data-size="L" class="rounded-xl border border-mist bg-foam py-2 text-xs font-semibold text-slate-600 cursor-pointer">
              Size L (+5.000đ)
            </button>
          </div>
        </div>

        <div>
          <p class="pos-label">Mức đường</p>
          <div class="grid grid-cols-4 gap-1.5" id="optSugarGroup">
            ${['100%', '70%', '50%', '0%']
              .map(
                (s, i) => `
              <button type="button" data-sugar="${s}" class="rounded-xl border py-1.5 text-xs font-semibold cursor-pointer ${
                  i === 0 ? 'border-ocean bg-shallow/60 font-bold text-deep' : 'border-mist bg-foam text-slate-600'
                }">${s}</button>`
              )
              .join('')}
          </div>
        </div>

        <div>
          <p class="pos-label">Mức đá / Nhiệt độ</p>
          <div class="grid grid-cols-4 gap-1.5" id="optIceGroup">
            ${['100%', '70%', 'Ít đá', 'Nóng']
              .map(
                (ic, i) => `
              <button type="button" data-ice="${ic}" class="rounded-xl border py-1.5 text-xs font-semibold cursor-pointer ${
                  i === 0 ? 'border-ocean bg-shallow/60 font-bold text-deep' : 'border-mist bg-foam text-slate-600'
                }">${ic}</button>`
              )
              .join('')}
          </div>
        </div>

        <div>
          <p class="pos-label">Topping thêm</p>
          <div class="grid grid-cols-2 gap-2" id="optToppingsGroup">
            ${TOPPINGS.map(
              (t) => `
              <button type="button" data-topping="${t.id}" class="flex items-center justify-between rounded-xl border border-mist bg-foam px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <span>${esc(t.name)}</span>
                <span class="text-ocean font-bold">+${fmtPrice(t.price)}</span>
              </button>`
            ).join('')}
          </div>
        </div>

        <div>
          <label class="pos-label" for="optNote">Ghi chú pha chế</label>
          <input type="text" id="optNote" class="pos-input" placeholder="VD: Bỏ riêng đá, in hình mèo..." maxlength="80" />
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-mist">
          <div class="flex items-center gap-3">
            <button type="button" id="optQtyMinus" class="pos-icon-btn"><i data-lucide="minus" class="h-4 w-4"></i></button>
            <span id="optQtyText" class="w-6 text-center text-base font-extrabold text-deep tabular-nums">1</span>
            <button type="button" id="optQtyPlus" class="pos-icon-btn"><i data-lucide="plus" class="h-4 w-4"></i></button>
          </div>
          <button type="button" id="optConfirmBtn" class="btn-primary !py-2.5 !px-5 text-sm">
            Thêm · <span id="optSubmitPrice">${fmtPrice(item.price)}</span>
          </button>
        </div>
      </div>
    `;

    const setActiveBtn = (groupEl, attr, val) => {
      groupEl.querySelectorAll(`[${attr}]`).forEach((b) => {
        const active = b.getAttribute(attr) === val;
        b.className = `rounded-xl border py-2 text-xs cursor-pointer ${
          active ? 'border-ocean bg-shallow/60 font-bold text-deep' : 'border-mist bg-foam font-semibold text-slate-600'
        }`;
      });
    };

    const sizeGroup = document.getElementById('optSizeGroup');
    sizeGroup.querySelectorAll('[data-size]').forEach((b) => {
      b.addEventListener('click', () => {
        size = b.dataset.size;
        setActiveBtn(sizeGroup, 'data-size', size);
        updateModalPrice();
      });
    });

    const sugarGroup = document.getElementById('optSugarGroup');
    sugarGroup.querySelectorAll('[data-sugar]').forEach((b) => {
      b.addEventListener('click', () => {
        sugar = b.dataset.sugar;
        setActiveBtn(sugarGroup, 'data-sugar', sugar);
      });
    });

    const iceGroup = document.getElementById('optIceGroup');
    iceGroup.querySelectorAll('[data-ice]').forEach((b) => {
      b.addEventListener('click', () => {
        ice = b.dataset.ice;
        setActiveBtn(iceGroup, 'data-ice', ice);
      });
    });

    const topGroup = document.getElementById('optToppingsGroup');
    topGroup.querySelectorAll('[data-topping]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.topping;
        if (selectedToppings.has(id)) selectedToppings.delete(id);
        else selectedToppings.add(id);
        const active = selectedToppings.has(id);
        b.className = `flex items-center justify-between rounded-xl border px-3 py-2 text-xs cursor-pointer ${
          active ? 'border-ocean bg-shallow/60 font-bold text-deep' : 'border-mist bg-foam font-semibold text-slate-700'
        }`;
        updateModalPrice();
      });
    });

    document.getElementById('optQtyMinus')?.addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        updateModalPrice();
      }
    });
    document.getElementById('optQtyPlus')?.addEventListener('click', () => {
      qty++;
      updateModalPrice();
    });

    document.getElementById('optCloseBtn')?.addEventListener('click', () => modal.close());
    modal.onclick = (e) => {
      if (e.target === modal) modal.close();
    };

    document.getElementById('optConfirmBtn')?.addEventListener('click', () => {
      const note = document.getElementById('optNote')?.value.trim() || '';
      const toppings = TOPPINGS.filter((t) => selectedToppings.has(t.id));
      addItemToCart({
        name: item.name,
        basePrice: item.price,
        unitPrice: calcUnitPrice(),
        qty,
        size,
        sugar,
        ice,
        toppings,
        note
      });
      modal.close();
      showToast(`Đã thêm ${qty}x ${item.name}`, 'success');
    });

    modal.showModal();
    renderIcons();
  }

  /* ---------- Cart & Payment ---------- */
  function addItemToCart(newItem) {
    const keyOf = (it) =>
      `${it.name}|${it.size}|${it.sugar}|${it.ice}|${(it.toppings || []).map((t) => t.id).join(',')}|${it.note}`;
    const targetKey = keyOf(newItem);
    const existing = cart.items.find((it) => keyOf(it) === targetKey);
    if (existing) {
      existing.qty += newItem.qty;
    } else {
      cart.items.push(newItem);
    }
    renderCart();
  }

  function renderTableGrid() {
    const grid = document.getElementById('tableGrid');
    if (!grid) return;
    const tables = Array.from({ length: 15 }, (_, i) => `B${String(i + 1).padStart(2, '0')}`);
    grid.innerHTML = tables
      .map((t) => {
        const active = cart.table === t;
        return `
        <button type="button" data-table="${t}" aria-pressed="${active}"
          class="rounded-xl border py-1.5 text-xs font-bold transition-colors cursor-pointer ${
            active ? 'border-ocean bg-ocean text-white shadow-sm' : 'border-mist bg-foam text-deep hover:border-ocean'
          }">
          ${t}
        </button>`;
      })
      .join('');

    grid.querySelectorAll('[data-table]').forEach((btn) => {
      btn.addEventListener('click', () => {
        cart.table = btn.dataset.table;
        renderTableGrid();
        renderCart();
      });
    });
  }

  // Hình thức: Tại chỗ / Mang đi
  document.querySelectorAll('#typeSeg [data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cart.type = btn.dataset.type;
      document.querySelectorAll('#typeSeg [data-type]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      const dineInFields = document.getElementById('dineInFields');
      if (dineInFields) dineInFields.classList.toggle('hidden', cart.type !== 'dine-in');
      renderCart();
    });
  });

  // Tên khách & Mã sinh viên
  document.getElementById('customerName')?.addEventListener('input', (e) => {
    cart.customerName = e.target.value.trim();
  });

  document.getElementById('studentId')?.addEventListener('input', (e) => {
    cart.studentId = e.target.value.trim().toUpperCase();
    renderCart();
  });

  // Phương thức thanh toán
  document.querySelectorAll('#paySeg [data-pay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cart.payMethod = btn.dataset.pay;
      document.querySelectorAll('#paySeg [data-pay]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      document.getElementById('cashBox')?.classList.toggle('hidden', cart.payMethod !== 'cash');
      document.getElementById('transferBox')?.classList.toggle('hidden', cart.payMethod !== 'transfer');
      renderCart();
    });
  });

  document.getElementById('cashReceived')?.addEventListener('input', (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    cart.cashReceived = Number(digits || 0);
    e.target.value = cart.cashReceived ? cart.cashReceived.toLocaleString('vi-VN') : '';
    renderCartTotalsAndPayment();
  });

  function calcCartTotals() {
    const subtotal = cart.items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const validStudent = /^[A-Z]\d{4,5}$/i.test(cart.studentId);
    const discount = validStudent ? Math.round(subtotal * 0.1) : 0;
    const total = Math.max(0, subtotal - discount);
    const count = cart.items.reduce((s, it) => s + it.qty, 0);
    return { subtotal, discount, total, count, validStudent };
  }

  function renderCart() {
    const linesEl = document.getElementById('cartLines');
    const countEl = document.getElementById('cartCount');
    const barText = document.getElementById('cartBarText');
    const { count, total } = calcCartTotals();

    if (countEl) countEl.textContent = count > 0 ? `(${count} món)` : '';
    if (barText) barText.textContent = `Xem đơn (${count} món · ${fmtPrice(total)})`;

    if (linesEl) {
      if (cart.items.length === 0) {
        linesEl.innerHTML = `
          <li class="py-8 text-center text-xs text-slate-500">
            Chưa có món nào trong đơn. Chọn món ở danh sách bên trái để thêm.
          </li>`;
      } else {
        linesEl.innerHTML = cart.items
          .map((it, idx) => {
            const topText = (it.toppings || []).map((t) => t.name).join(', ');
            return `
            <li class="flex items-start justify-between gap-2 py-3 border-b border-mist/60 text-xs">
              <div class="min-w-0 flex-1">
                <p class="font-bold text-deep truncate">${esc(it.name)} <span class="text-ocean">(Size ${esc(it.size)})</span></p>
                <p class="text-[11px] text-slate-500">Đường ${esc(it.sugar)} · ${esc(it.ice)}${topText ? ` · +${esc(topText)}` : ''}</p>
                ${it.note ? `<p class="text-[11px] italic text-amber-700">Ghi chú: ${esc(it.note)}</p>` : ''}
                <p class="mt-1 font-extrabold text-[#E63946] tabular-nums">${fmtPrice(it.unitPrice * it.qty)}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" data-cart-minus="${idx}" class="pos-icon-btn !h-7 !w-7" aria-label="Giảm số lượng">
                  <i data-lucide="minus" class="h-3.5 w-3.5"></i>
                </button>
                <span class="w-5 text-center font-bold tabular-nums">${it.qty}</span>
                <button type="button" data-cart-plus="${idx}" class="pos-icon-btn !h-7 !w-7" aria-label="Tăng số lượng">
                  <i data-lucide="plus" class="h-3.5 w-3.5"></i>
                </button>
              </div>
            </li>`;
          })
          .join('');

        linesEl.querySelectorAll('[data-cart-minus]').forEach((b) => {
          b.addEventListener('click', () => {
            const i = Number(b.dataset.cartMinus);
            if (cart.items[i].qty > 1) cart.items[i].qty--;
            else cart.items.splice(i, 1);
            renderCart();
          });
        });
        linesEl.querySelectorAll('[data-cart-plus]').forEach((b) => {
          b.addEventListener('click', () => {
            const i = Number(b.dataset.cartPlus);
            cart.items[i].qty++;
            renderCart();
          });
        });
      }
    }

    renderCartTotalsAndPayment();
    renderIcons();
  }

  function renderCartTotalsAndPayment() {
    const { subtotal, discount, total, count, validStudent } = calcCartTotals();

    const hintEl = document.getElementById('studentHint');
    if (hintEl) {
      if (!cart.studentId) {
        hintEl.textContent = 'Nhập mã SV Thăng Long (VD: A51008) để giảm 10%.';
        hintEl.className = 'mt-1.5 text-xs text-slate-600';
      } else if (validStudent) {
        hintEl.textContent = `✓ Đã áp dụng ưu đãi SV (-${fmtPrice(discount)})`;
        hintEl.className = 'mt-1.5 text-xs font-bold text-emerald-700';
      } else {
        hintEl.textContent = 'Mã SV cần gồm 1 chữ cái + 4–5 chữ số (VD: A51008).';
        hintEl.className = 'mt-1.5 text-xs text-amber-700';
      }
    }

    const totalsEl = document.getElementById('cartTotals');
    if (totalsEl) {
      totalsEl.innerHTML = `
        <div class="flex justify-between text-slate-600">
          <dt>Tạm tính (${count} món)</dt>
          <dd class="font-semibold tabular-nums">${fmtPrice(subtotal)}</dd>
        </div>
        ${
          discount > 0
            ? `<div class="flex justify-between text-emerald-700">
                <dt>Ưu đãi SV (10%)</dt>
                <dd class="font-semibold tabular-nums">-${fmtPrice(discount)}</dd>
              </div>`
            : ''
        }
        <div class="flex justify-between border-t border-mist pt-2 text-base font-extrabold text-deep">
          <dt>Tổng thanh toán</dt>
          <dd class="text-[#E63946] tabular-nums">${fmtPrice(total)}</dd>
        </div>
      `;
    }

    // Quick cash suggestions
    const quickCashEl = document.getElementById('quickCash');
    if (quickCashEl) {
      const suggestions = total > 0 ? Array.from(new Set([total, Math.ceil(total / 50000) * 50000, 100000, 200000])).slice(0, 3) : [20000, 50000, 100000];
      quickCashEl.innerHTML = suggestions
        .map(
          (amt) => `
        <button type="button" data-cash-val="${amt}"
          class="rounded-xl border border-mist bg-foam py-1.5 text-xs font-bold text-deep hover:border-ocean cursor-pointer tabular-nums">
          ${fmtPrice(amt)}
        </button>`
        )
        .join('');
      quickCashEl.querySelectorAll('[data-cash-val]').forEach((b) => {
        b.addEventListener('click', () => {
          cart.cashReceived = Number(b.dataset.cashVal);
          const input = document.getElementById('cashReceived');
          if (input) input.value = cart.cashReceived.toLocaleString('vi-VN');
          renderCartTotalsAndPayment();
        });
      });
    }

    const changeEl = document.getElementById('cashChange');
    if (changeEl) {
      if (total === 0 || cart.cashReceived === 0) {
        changeEl.textContent = 'Nhập hoặc chọn mệnh giá khách đưa.';
        changeEl.className = 'mt-2 text-xs text-slate-500';
      } else if (cart.cashReceived >= total) {
        changeEl.textContent = `Tiền thừa trả khách: ${fmtPrice(cart.cashReceived - total)}`;
        changeEl.className = 'mt-2 text-sm font-extrabold text-emerald-700';
      } else {
        changeEl.textContent = `Còn thiếu: ${fmtPrice(total - cart.cashReceived)}`;
        changeEl.className = 'mt-2 text-xs font-bold text-red-600';
      }
    }

    const transferBox = document.getElementById('transferBox');
    if (transferBox) {
      transferBox.innerHTML = `
        <div class="rounded-2xl border border-mist bg-foam p-3 text-xs text-slate-600">
          <p class="font-bold text-deep">Chuyển khoản VietQR · BlueIsland TLU</p>
          <p class="mt-1">Số tiền: <strong class="text-[#E63946]">${fmtPrice(total)}</strong></p>
        </div>
      `;
    }

    const submitBtn = document.getElementById('submitOrder');
    const cancelBtn = document.getElementById('cancelOrder');
    const submitHint = document.getElementById('submitHint');

    const hasItems = cart.items.length > 0;
    if (submitBtn) submitBtn.disabled = !hasItems;
    if (cancelBtn) cancelBtn.disabled = !hasItems;
    if (submitHint) {
      submitHint.textContent = hasItems
        ? cart.type === 'dine-in'
          ? `Phục vụ tại bàn ${cart.table}`
          : 'Đơn mang đi (Takeaway)'
        : 'Thêm ít nhất 1 món để gửi pha chế';
    }
  }

  // Mobile bottom sheet cart toggle
  const cartPanel = document.getElementById('cartPanel');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartBar = document.getElementById('cartBar');
  const cartClose = document.getElementById('cartClose');

  function setMobileCartOpen(open) {
    cartPanel?.classList.toggle('is-open', open);
    cartOverlay?.classList.toggle('is-open', open);
    cartBar?.setAttribute('aria-expanded', String(open));
  }
  cartBar?.addEventListener('click', () => setMobileCartOpen(true));
  cartClose?.addEventListener('click', () => setMobileCartOpen(false));
  cartOverlay?.addEventListener('click', () => setMobileCartOpen(false));

  // Huỷ đơn hiện tại
  document.getElementById('cancelOrder')?.addEventListener('click', async () => {
    if (cart.items.length === 0) return;
    const ok = await askConfirm('Huỷ đơn đang tạo?', 'Toàn bộ món đã chọn trong đơn hiện tại sẽ bị xoá.');
    if (!ok) return;
    resetCart();
    showToast('Đã xoá đơn nháp.', 'info');
  });

  function resetCart() {
    cart.items = [];
    cart.customerName = '';
    cart.studentId = '';
    cart.cashReceived = 0;
    const cName = document.getElementById('customerName');
    const sId = document.getElementById('studentId');
    const cRec = document.getElementById('cashReceived');
    if (cName) cName.value = '';
    if (sId) sId.value = '';
    if (cRec) cRec.value = '';
    renderCart();
  }

  // Gửi pha chế (Order món)
  document.getElementById('submitOrder')?.addEventListener('click', async () => {
    if (cart.items.length === 0) return;
    const { subtotal, discount, total } = calcCartTotals();
    const newOrderData = {
      type: cart.type,
      table: cart.type === 'dine-in' ? cart.table : 'Mang đi',
      customerName: cart.customerName || (cart.type === 'dine-in' ? `Khách bàn ${cart.table}` : 'Khách lẻ'),
      studentId: cart.studentId,
      payMethod: cart.payMethod,
      subtotal,
      discount,
      total,
      cashReceived: cart.payMethod === 'cash' ? Math.max(cart.cashReceived, total) : total,
      status: 'waiting',
      staffCode: currentStaff?.code || 'NV',
      items: JSON.parse(JSON.stringify(cart.items))
    };

    /* =========================================================================
       KẾT NỐI BACKEND API (Gửi đơn hàng lên Backend lưu vào Database):
       -------------------------------------------------------------------------
       try {
         const res = await fetch('/api/orders', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${currentStaff?.token || ''}`
           },
           body: JSON.stringify(newOrderData)
         });
         const savedOrder = await res.json();
         if (!res.ok) throw new Error(savedOrder.message || 'Không thể lưu đơn vào Backend');
         
         orders.unshift(savedOrder);
         resetCart();
         setMobileCartOpen(false);
         updateQueueBadge();
         renderQueue();
         renderHistory();
         showToast(`Đã lưu và gửi đơn ${savedOrder.id} sang pha chế!`, 'success');
         return;
       } catch (err) {
         showToast('Lỗi gửi đơn: ' + err.message, 'error');
         return;
       }
       ========================================================================= */

    // Khi chưa kết nối Backend API: Đơn hiển thị tạm trong phiên làm việc, không lưu cứng vào máy
    const nextNum = 101 + orders.length;
    const tempOrder = {
      ...newOrderData,
      id: `BI-${nextNum}`,
      createdAt: Date.now()
    };
    orders.unshift(tempOrder);
    resetCart();
    setMobileCartOpen(false);
    updateQueueBadge();
    renderQueue();
    renderHistory();
    showToast(`Đã gửi đơn ${tempOrder.id} (Phiên tạm thời)!`, 'success');
  });

  /* ---------- 3. Tab Đơn đang xử lý (Queue) ---------- */
  function updateQueueBadge() {
    const badge = document.getElementById('queueBadge');
    if (!badge) return;
    const activeCount = orders.filter((o) => ['waiting', 'preparing', 'ready'].includes(o.status)).length;
    badge.textContent = String(activeCount);
    badge.hidden = activeCount === 0;
  }

  function renderQueue() {
    updateQueueBadge();
    const board = document.getElementById('queueBoard');
    const subTabs = document.getElementById('queueSubTabs');
    if (!board) return;

    const cols = [
      { id: 'waiting', title: 'Chờ pha chế', actionLabel: 'Bắt đầu pha', nextStatus: 'preparing', badgeBg: 'bg-amber-100 text-amber-800' },
      { id: 'preparing', title: 'Đang pha chế', actionLabel: 'Hoàn thành món', nextStatus: 'ready', badgeBg: 'bg-sky-100 text-sky-800' },
      { id: 'ready', title: 'Chờ giao khách', actionLabel: 'Đã giao / Xong', nextStatus: 'completed', badgeBg: 'bg-emerald-100 text-emerald-800' }
    ];

    if (subTabs) {
      subTabs.innerHTML = cols
        .map((c) => {
          const count = orders.filter((o) => o.status === c.id).length;
          const active = activeQueueSubTab === c.id;
          return `
          <button type="button" data-qtab="${c.id}"
            class="flex-1 rounded-full border py-2 text-xs font-bold cursor-pointer ${
              active ? 'border-ocean bg-ocean text-white' : 'border-mist bg-white text-deep'
            }">
            ${esc(c.title)} (${count})
          </button>`;
        })
        .join('');
      subTabs.querySelectorAll('[data-qtab]').forEach((b) => {
        b.addEventListener('click', () => {
          activeQueueSubTab = b.dataset.qtab;
          renderQueue();
        });
      });
    }

    const now = Date.now();
    board.innerHTML = cols
      .map((col) => {
        const list = orders.filter((o) => o.status === col.id);
        const hiddenMobile = activeQueueSubTab !== col.id ? 'hidden md:block' : '';
        return `
        <div class="${hiddenMobile} rounded-2xl border border-mist bg-white p-4 shadow-sea">
          <div class="flex items-center justify-between border-b border-mist pb-3">
            <h3 class="font-extrabold text-deep">${esc(col.title)}</h3>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-bold ${col.badgeBg}">${list.length}</span>
          </div>
          <div class="mt-3 space-y-3">
            ${
              list.length === 0
                ? `<p class="py-8 text-center text-xs text-slate-400">Không có đơn nào</p>`
                : list
                    .map((o) => {
                      const mins = Math.max(0, Math.floor((now - o.createdAt) / 60000));
                      const isLate = mins >= 10 && col.id !== 'ready';
                      return `
                      <article class="rounded-2xl border p-3.5 transition-shadow ${
                        isLate ? 'border-red-400 bg-red-50/40' : 'border-mist bg-foam/60'
                      }">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-sm font-extrabold text-[#142274]">${esc(o.id)} · ${esc(o.table || 'Mang đi')}</span>
                          <span class="text-xs font-semibold ${isLate ? 'text-red-600 font-bold' : 'text-slate-500'}">
                            ${mins === 0 ? 'Vừa xong' : `${mins} phút trước`}
                          </span>
                        </div>
                        <p class="mt-0.5 text-xs text-slate-600">${esc(o.customerName)} · ${fmtPrice(o.total)}</p>
                        <ul class="mt-2 space-y-1 border-t border-mist/70 pt-2 text-xs">
                          ${o.items
                            .map(
                              (it) => `
                            <li class="flex justify-between gap-2">
                              <span class="font-semibold text-ink">${it.qty}x ${esc(it.name)} (${esc(it.size)})</span>
                              <span class="text-slate-500">${esc(it.ice)}</span>
                            </li>`
                            )
                            .join('')}
                        </ul>
                        <div class="mt-3 flex items-center gap-2">
                          <button type="button" data-advance="${o.id}" data-next="${col.nextStatus}"
                            class="btn-primary flex-1 justify-center !py-2 !px-3 text-xs">
                            ${esc(col.actionLabel)}
                          </button>
                          <button type="button" data-detail="${o.id}" class="pos-icon-btn" title="Chi tiết / In hoá đơn">
                            <i data-lucide="printer" class="h-4 w-4"></i>
                          </button>
                        </div>
                      </article>`;
                    })
                    .join('')
            }
          </div>
        </div>`;
      })
      .join('');

    board.querySelectorAll('[data-advance]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const order = orders.find((o) => o.id === btn.dataset.advance);
        if (!order) return;
        order.status = btn.dataset.next;
        saveOrders();
        renderQueue();
        showToast(`Đơn ${order.id} đã chuyển sang trạng thái tiếp theo.`, 'success');
      });
    });

    board.querySelectorAll('[data-detail]').forEach((btn) => {
      btn.addEventListener('click', () => openOrderModal(btn.dataset.detail));
    });

    renderIcons();
  }

  /* ---------- 4. Tab Lịch sử ca ---------- */
  function renderHistory() {
    const infoEl = document.getElementById('historyShiftInfo');
    const statsEl = document.getElementById('shiftStats');
    const tbody = document.getElementById('historyBody');
    const emptyEl = document.getElementById('historyEmpty');

    if (infoEl && currentStaff) {
      infoEl.textContent = `Nhân viên: ${currentStaff.name} (${currentStaff.code}) · ${currentStaff.shift}`;
    }

    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
    const cashRevenue = validOrders.filter((o) => o.payMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const transferRevenue = validOrders.filter((o) => o.payMethod === 'transfer').reduce((s, o) => s + o.total, 0);

    if (statsEl) {
      const cards = [
        { label: 'Tổng số đơn', value: `${validOrders.length} đơn`, icon: 'CheckCircle2' },
        { label: 'Doanh thu ca', value: fmtPrice(totalRevenue), icon: 'Coins' },
        { label: 'Tiền mặt', value: fmtPrice(cashRevenue), icon: 'Banknote' },
        { label: 'Chuyển khoản', value: fmtPrice(transferRevenue), icon: 'QrCode' }
      ];
      statsEl.innerHTML = cards
        .map(
          (c) => `
        <div class="rounded-2xl border border-mist bg-white p-4 shadow-sea">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${esc(c.label)}</p>
          <p class="mt-1.5 text-xl font-extrabold text-deep tabular-nums">${esc(c.value)}</p>
        </div>`
        )
        .join('');
    }

    if (tbody) {
      if (orders.length === 0) {
        tbody.innerHTML = '';
        emptyEl?.classList.remove('hidden');
      } else {
        emptyEl?.classList.add('hidden');
        const statusMap = {
          waiting: '<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Chờ pha</span>',
          preparing: '<span class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">Đang pha</span>',
          ready: '<span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Chờ giao</span>',
          completed: '<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">Hoàn tất</span>',
          cancelled: '<span class="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">Đã huỷ</span>'
        };
        tbody.innerHTML = orders
          .map((o) => {
            const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
            const timeStr = new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            return `
            <tr data-order-row="${o.id}">
              <td class="font-bold text-[#142274]">${esc(o.id)}</td>
              <td class="tabular-nums text-slate-600">${timeStr}</td>
              <td>${esc(o.table || 'Mang đi')} <span class="text-xs text-slate-500">(${esc(o.customerName)})</span></td>
              <td class="!text-right tabular-nums font-semibold">${itemCount}</td>
              <td class="!text-right tabular-nums font-extrabold text-[#E63946]">${fmtPrice(o.total)}</td>
              <td>${o.payMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
              <td>${statusMap[o.status] || esc(o.status)}</td>
            </tr>`;
          })
          .join('');

        tbody.querySelectorAll('[data-order-row]').forEach((tr) => {
          tr.addEventListener('click', () => openOrderModal(tr.dataset.orderRow));
        });
      }
    }
  }

  /* ---------- Chi tiết đơn & In hoá đơn ---------- */
  function openOrderModal(orderId) {
    const order = orders.find((o) => o.id === orderId);
    const modal = document.getElementById('orderModal');
    const body = document.getElementById('orderModalBody');
    if (!order || !modal || !body) return;

    const timeStr = new Date(order.createdAt).toLocaleString('vi-VN');
    body.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 id="orderModalTitle" class="text-lg font-extrabold text-deep">Đơn hàng ${esc(order.id)}</h3>
          <p class="text-xs text-slate-500">${esc(timeStr)} · ${esc(order.table || 'Mang đi')}</p>
        </div>
        <button type="button" id="orderModalClose" class="pos-icon-btn"><i data-lucide="x" class="h-4 w-4"></i></button>
      </div>

      <div class="mt-4 space-y-2 border-y border-mist py-3 text-xs">
        ${order.items
          .map(
            (it) => `
          <div class="flex justify-between gap-2">
            <div>
              <p class="font-bold text-deep">${it.qty}x ${esc(it.name)} (Size ${esc(it.size)})</p>
              <p class="text-slate-500">Đường ${esc(it.sugar)} · ${esc(it.ice)}</p>
            </div>
            <span class="font-bold tabular-nums">${fmtPrice(it.unitPrice * it.qty)}</span>
          </div>`
          )
          .join('')}
      </div>

      <div class="mt-3 space-y-1 text-xs">
        <div class="flex justify-between text-slate-600"><span>Tạm tính</span><span>${fmtPrice(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div class="flex justify-between text-emerald-700"><span>Giảm SV 10%</span><span>-${fmtPrice(order.discount)}</span></div>` : ''}
        <div class="flex justify-between text-sm font-extrabold text-deep pt-1"><span>Tổng cộng</span><span class="text-[#E63946]">${fmtPrice(order.total)}</span></div>
      </div>

      <div class="mt-5 flex gap-2">
        <button type="button" id="printReceiptBtn" class="btn-primary flex-1 justify-center !py-2.5 text-xs">
          <i data-lucide="printer" class="h-4 w-4"></i> In hoá đơn
        </button>
        ${
          order.status !== 'cancelled' && order.status !== 'completed'
            ? `<button type="button" id="cancelExistingOrderBtn" class="pos-btn-danger !py-2.5 text-xs">Huỷ đơn</button>`
            : ''
        }
      </div>
    `;

    document.getElementById('orderModalClose')?.addEventListener('click', () => modal.close());
    modal.onclick = (e) => {
      if (e.target === modal) modal.close();
    };

    document.getElementById('printReceiptBtn')?.addEventListener('click', () => {
      const printArea = document.getElementById('printArea');
      if (printArea) {
        printArea.innerHTML = `
          <div style="text-align:center;margin-bottom:8px;">
            <strong>BLUE ISLAND COFFEE</strong><br/>
            ĐH Thăng Long, Hà Nội<br/>
            Hoá đơn: ${esc(order.id)} - ${esc(order.table || 'Mang đi')}
          </div>
          <hr/>
          ${order.items.map((it) => `<div>${it.qty}x ${esc(it.name)} (${esc(it.size)}) - ${fmtPrice(it.unitPrice * it.qty)}</div>`).join('')}
          <hr/>
          <div><strong>TỔNG: ${fmtPrice(order.total)}</strong></div>
        `;
      }
      window.print();
    });

    document.getElementById('cancelExistingOrderBtn')?.addEventListener('click', async () => {
      modal.close();
      const ok = await askConfirm(`Huỷ đơn ${order.id}?`, 'Đơn hàng này sẽ được đánh dấu Đã huỷ trong lịch sử ca.');
      if (!ok) return;
      order.status = 'cancelled';
      saveOrders();
      renderQueue();
      renderHistory();
      showToast(`Đã huỷ đơn ${order.id}.`, 'info');
    });

    modal.showModal();
    renderIcons();
  }

  /* ---------- Khởi chạy & Kiểm soát truy cập ---------- */
  const savedSession = getSavedSession();
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === '1' || urlParams.get('dev') === '1' || urlParams.has('preview');

  if (isPreviewMode) {
    // Chế độ xem trước (Preview Mode): Cho phép bạn vào thẳng giao diện để căn chỉnh giao diện mà không cần tài khoản
    const previewProfile = {
      code: 'DEV',
      name: 'Xem trước giao diện',
      shift: 'Chế độ căn chỉnh thiết kế',
      startedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    startShift(previewProfile);
  } else if (savedSession && (savedSession.code || savedSession.id || savedSession.token)) {
    // Xác thực phiên làm việc được cấp từ Backend qua bi_pos_session
    startShift(savedSession);
  } else {
    if (savedSession) localStorage.removeItem(STORAGE_KEYS.SESSION);
    alert('Khu vực dành riêng cho nhân viên. Vui lòng đăng nhập bằng tài khoản do Admin cấp từ trang chủ.');
    window.location.replace('index.html?auth=login');
  }
})();

