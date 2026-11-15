/* =========================================================
   BlueIsland Coffee – interactions
   ========================================================= */
(function () {
  'use strict';

  const U = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

  /* ---------- Menu data: dùng chung từ assets/js/menu-data.js ---------- */
  const MENU = window.BI_MENU || { all: [] };

  const fmtPrice = (n) => n.toLocaleString('vi-VN') + 'đ';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Image fallback: hide broken images, gradient bg shows ---------- */
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') t.style.visibility = 'hidden';
  }, true);

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const setMobile = (open) => {
    mobileMenu.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    toggle.innerHTML = `<i data-lucide="${open ? 'x' : 'menu'}" class="h-6 w-6"></i>`;
    renderIcons();
  };
  toggle.addEventListener('click', () => setMobile(mobileMenu.classList.contains('hidden')));
  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMobile(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) setMobile(false); });

  /* ---------- Navbar shadow + active link ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = document.querySelectorAll('.nav-link');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- Menu tabs & Render từng ô món (Card View + Phân trang 2 hàng x 4 món) ---------- */
  const grid = document.getElementById('menuGrid');
  const pagination = document.getElementById('menuPagination');
  const tabs = document.querySelectorAll('.menu-tab');
  const PAGE_SIZE = 8; // 2 hàng x 4 món
  let currentCat = 'all';
  let currentPage = 1;

  if (grid && tabs.length > 0) {
    function renderMenu(cat, page = 1) {
      currentCat = cat;
      const list = MENU[cat] || MENU.all || [];
      const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      currentPage = Math.min(Math.max(1, page), totalPages);

      const startIdx = (currentPage - 1) * PAGE_SIZE;
      const pageItems = list.slice(startIdx, startIdx + PAGE_SIZE);

      grid.innerHTML = pageItems.map((item, i) => `
        <article class="menu-card group hover:border-[#142274]/30" style="animation-delay:${i * 45}ms">
          <div class="menu-img">
            <img src="${item.img}" alt="${esc(item.name)}" loading="lazy" />
            ${item.tag ? `<span class="menu-tag !text-[#E63946] !bg-white/95 border border-[#E63946]/20 shadow-sm">${esc(item.tag)}</span>` : ''}
          </div>
          <div class="flex flex-1 flex-col p-5">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-base font-bold text-[#142274] group-hover:text-ocean transition-colors">${esc(item.name)}</h3>
              <span class="menu-price text-[#E63946] font-extrabold text-base">${fmtPrice(item.price)}</span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">${esc(item.desc)}</p>
          </div>
        </article>`).join('');

      if (pagination) {
        if (totalPages <= 1) {
          pagination.innerHTML = '';
          pagination.classList.add('hidden');
        } else {
          pagination.classList.remove('hidden');
          const pageButtons = Array.from({ length: totalPages }, (_, idx) => {
            const p = idx + 1;
            const active = p === currentPage;
            return `<button type="button" data-page="${p}" aria-label="Trang ${p}" aria-current="${active ? 'page' : 'false'}"
              class="h-10 w-10 rounded-full text-sm font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[#142274] text-white shadow-sm'
                  : 'border border-mist bg-white text-slate-600 hover:border-[#142274] hover:text-[#142274]'
              }">${p}</button>`;
          }).join('');

          pagination.innerHTML = `
            <button type="button" id="menuPrevBtn" ${currentPage === 1 ? 'disabled' : ''}
              class="inline-flex items-center gap-1.5 rounded-full border border-mist bg-white px-4 py-2 text-sm font-semibold text-[#142274] transition-all cursor-pointer hover:border-[#142274] hover:bg-foam disabled:opacity-40 disabled:pointer-events-none">
              <i data-lucide="chevron-left" class="h-4 w-4"></i> Trước
            </button>
            <div class="flex items-center gap-1.5">${pageButtons}</div>
            <button type="button" id="menuNextBtn" ${currentPage === totalPages ? 'disabled' : ''}
              class="inline-flex items-center gap-1.5 rounded-full bg-[#142274] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer hover:bg-[#142274]/90 disabled:opacity-40 disabled:pointer-events-none">
              Xem tiếp <i data-lucide="chevron-right" class="h-4 w-4"></i>
            </button>
          `;

          const prevBtn = document.getElementById('menuPrevBtn');
          const nextBtn = document.getElementById('menuNextBtn');
          if (prevBtn) prevBtn.addEventListener('click', () => renderMenu(currentCat, currentPage - 1));
          if (nextBtn) nextBtn.addEventListener('click', () => renderMenu(currentCat, currentPage + 1));
          pagination.querySelectorAll('[data-page]').forEach((btn) => {
            btn.addEventListener('click', () => renderMenu(currentCat, Number(btn.dataset.page)));
          });
          renderIcons();
        }
      }
    }

    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
        renderMenu(tab.dataset.cat, 1);
      });
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        next.click();
      });
    });
    renderMenu('all', 1);
  }

  /* ---------- Gallery lightbox ---------- */
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCaption');
  let current = 0;

  function showItem(i) {
    current = (i + items.length) % items.length;
    const img = items[current].querySelector('img');
    lbImg.src = img.src.replace(/w=\d+/, 'w=1600');
    lbImg.alt = img.alt;
    lbCap.textContent = items[current].dataset.caption || img.alt;
  }
  items.forEach((btn, i) => btn.addEventListener('click', () => {
    showItem(i);
    if (typeof lb.showModal === 'function') lb.showModal();
  }));
  document.getElementById('lightboxPrev').addEventListener('click', () => showItem(current - 1));
  document.getElementById('lightboxNext').addEventListener('click', () => showItem(current + 1));
  document.getElementById('lightboxClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showItem(current - 1);
    if (e.key === 'ArrowRight') showItem(current + 1);
  });

  /* ---------- Opening hours & live status ---------- */
  const HOURS = { 0: ['08:00', '21:00'], 1: ['07:00', '21:30'], 2: ['07:00', '21:30'], 3: ['07:00', '21:30'], 4: ['07:00', '21:30'], 5: ['07:00', '21:30'], 6: ['07:00', '21:30'] };
  const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };

  function updateStatus() {
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [open, close] = HOURS[day];
    const isOpen = mins >= toMin(open) && mins < toMin(close);

    const pill = document.getElementById('openStatus');
    const text = document.getElementById('openStatusText');
    pill.classList.toggle('is-open', isOpen);
    pill.classList.toggle('is-closed', !isOpen);
    if (isOpen) {
      text.textContent = `Đang mở · đến ${close}`;
    } else {
      const next = mins < toMin(open) ? open : HOURS[(day + 1) % 7][0];
      text.textContent = `Đã đóng · mở lúc ${next}`;
    }

    document.querySelectorAll('#hoursTable tr').forEach((tr) => {
      tr.classList.toggle('is-today', tr.dataset.days.split(',').map(Number).includes(day));
    });
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Scroll reveal ---------- */
  const reveal = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

  /* ---------- Auth & User Management (Ready for Backend) ---------- */
  const authModal = document.getElementById('authModal');
  const authBtnDesktop = document.getElementById('authBtnDesktop');
  const authBtnMobile = document.getElementById('authBtnMobile');
  const authModalClose = document.getElementById('authModalClose');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const formLogin = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  function getInitials(name) {
    if (!name) return 'SV';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  }

  function getCurrentUser() {
    try {
      const data = localStorage.getItem('blueisland_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem('blueisland_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('blueisland_user');
    }
    updateAuthUI();
  }

  function setAuthTab(isRegister) {
    tabLogin.classList.toggle('is-active', !isRegister);
    tabLogin.classList.toggle('text-slate-600', isRegister);
    tabLogin.setAttribute('aria-selected', String(!isRegister));

    tabRegister.classList.toggle('is-active', isRegister);
    tabRegister.classList.toggle('text-slate-600', !isRegister);
    tabRegister.setAttribute('aria-selected', String(isRegister));

    formLogin.classList.toggle('hidden', isRegister);
    formRegister.classList.toggle('hidden', !isRegister);
  }

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => setAuthTab(false));
    tabRegister.addEventListener('click', () => setAuthTab(true));
  }
  if (switchToRegister) switchToRegister.addEventListener('click', () => setAuthTab(true));
  if (switchToLogin) switchToLogin.addEventListener('click', () => setAuthTab(false));

  function openAuthModal(isRegister = false) {
    setAuthTab(isRegister);
    if (typeof authModal.showModal === 'function') authModal.showModal();
    renderIcons();
  }
  if (authBtnDesktop) authBtnDesktop.addEventListener('click', () => openAuthModal(false));
  if (authBtnMobile) authBtnMobile.addEventListener('click', () => openAuthModal(false));
  if (authModalClose) authModalClose.addEventListener('click', () => authModal.close());
  if (authModal) {
    authModal.addEventListener('click', (e) => { if (e.target === authModal) authModal.close(); });
  }

  const reviewPromptLoginBtn = document.getElementById('reviewPromptLoginBtn');
  if (reviewPromptLoginBtn) reviewPromptLoginBtn.addEventListener('click', () => openAuthModal(false));

  // Tự động mở modal đăng nhập nếu có tham số ?auth=login hoặc ?login=1
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'login' || urlParams.get('login') === '1') {
      setTimeout(() => openAuthModal(false), 150);
    }
  } catch {
    // ignore
  }

  /* ---------- Danh mục tài khoản nhân viên (Đã xóa dữ liệu mẫu - Sẵn sàng kết nối Backend API) ---------- */
  // Khi Backend hoạt động, việc xác thực sẽ gọi qua Backend API.
  const STAFF_DIRECTORY = {};

  // Form submit: Đăng nhập (Dùng chung cho cả Khách hàng & Nhân viên)
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const loginErrorMsg = document.getElementById('loginErrorMsg');
      if (loginErrorMsg) loginErrorMsg.classList.add('hidden');

      const loginId = document.getElementById('loginEmail').value.trim();
      const loginPin = document.getElementById('loginPassword').value.trim();
      const upperCode = loginId.toUpperCase();

      /* =========================================================================
         KẾT NỐI BACKEND API:
         Bỏ comment đoạn code dưới đây khi bạn chạy server Backend:
         -------------------------------------------------------------------------
         try {
           const response = await fetch('/api/auth/login', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ username: loginId, password: loginPin })
           });
           const data = await response.json();
           if (!response.ok) {
             throw new Error(data.message || 'Tài khoản hoặc mật khẩu không chính xác!');
           }

           // Admin dùng chung cổng đăng nhập; tài khoản admin do backend tạo riêng.
           // Backend trả về role: 'admin' | 'staff' | 'customer'.
           if (data.role === 'admin') {
             const adminSession = {
               code: data.staffProfile?.code || 'ADMIN',
               name: data.staffProfile?.name || 'Quản trị viên',
               role: 'admin',
               token: data.token
             };
             localStorage.setItem('bi_pos_session', JSON.stringify(adminSession));
             authModal.close();
             formLogin.reset();
             window.location.href = 'admin.html';
             return;
           }

           if (data.isStaff) {
             const staffSession = {
               code: data.staffProfile.code,
               name: data.staffProfile.name,
               role: 'staff',
               shift: data.staffProfile.shift || 'Toàn thời gian',
               token: data.token,
               startedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
             };
             localStorage.setItem('bi_pos_session', JSON.stringify(staffSession));
             setCurrentUser({
               name: staffSession.name,
               code: staffSession.code,
               userRole: `Nhân viên (${staffSession.code})`,
               email: data.staffProfile.email || `${staffSession.code.toLowerCase()}@blueisland.vn`,
               isStaff: true
             });
             authModal.close();
             formLogin.reset();
             alert(`Xin chào ${staffSession.name}! Đang chuyển hướng đến màn hình nhân viên...`);
             window.location.href = 'staff.html';
             return;
           }

           setCurrentUser(data.user);
           authModal.close();
           formLogin.reset();
           alert(`Xin chào ${data.user.name}! Bạn đã đăng nhập thành công.`);
           return;
         } catch (err) {
           if (loginErrorMsg) {
             loginErrorMsg.textContent = err.message;
             loginErrorMsg.classList.remove('hidden');
           } else {
             alert(err.message);
           }
           return;
         }
         ========================================================================= */

      // Kiểm tra nếu đăng nhập bằng mã nhân viên hoặc ADMIN (khi chưa kết nối Backend)
      const isStaffFormat = upperCode.startsWith('NV') || upperCode === 'ADMIN';

      if (isStaffFormat) {
        const staffAccount = STAFF_DIRECTORY[upperCode];
        if (!staffAccount || staffAccount.pin !== loginPin) {
          const msg = 'Tài khoản hoặc mật khẩu không chính xác';
          if (loginErrorMsg) {
            loginErrorMsg.textContent = msg;
            loginErrorMsg.classList.remove('hidden');
          } else {
            alert(msg);
          }
          return;
        }

        // Đăng nhập nhân viên thành công
        const staffSession = {
          ...staffAccount,
          startedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        localStorage.setItem('bi_pos_session', JSON.stringify(staffSession));
        setCurrentUser({
          name: staffAccount.name,
          code: staffAccount.code,
          userRole: `Nhân viên (${staffAccount.code})`,
          email: `${staffAccount.code.toLowerCase()}@blueisland.vn`,
          isStaff: true
        });

        authModal.close();
        formLogin.reset();
        alert(`Xin chào ${staffAccount.name} (${staffAccount.code})! Đang chuyển hướng đến màn hình nhân viên...`);
        window.location.href = 'staff.html';
        return;
      }

      // Đăng nhập cho khách hàng thành viên thông thường
      const demoUser = {
        name: loginId.includes('@') ? loginId.split('@')[0] : loginId,
        email: loginId.includes('@') ? loginId : `${loginId}@gmail.com`,
        userRole: 'Khách hàng thành viên',
        isStaff: false
      };
      setCurrentUser(demoUser);
      authModal.close();
      formLogin.reset();
      alert(`Xin chào ${demoUser.name}! Bạn đã đăng nhập thành công.`);
    });
  }

  // Form submit: Đăng ký (CHỈ dành cho khách hàng - chặn đăng ký nhân viên)
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName')?.value.trim() || 'Thành viên';
      const email = document.getElementById('regEmail')?.value.trim() || '';

      // Ngăn chặn giả mạo tài khoản nhân viên qua biểu mẫu đăng ký
      const checkStr = `${name} ${email}`.toUpperCase();
      if (/(NV\d{2,4}|ADMIN)/i.test(checkStr)) {
        alert('Tài khoản nhân viên do Admin cấp riêng và không thể tự đăng ký qua biểu mẫu khách hàng!');
        return;
      }

      const newUser = {
        name,
        email,
        userRole: 'Thành viên BlueIsland',
        isStaff: false
      };
      setCurrentUser(newUser);
      authModal.close();
      formRegister.reset();
      alert(`Chào mừng ${name} gia nhập BlueIsland Member!`);
    });
  }

  function updateAuthUI() {
    const user = getCurrentUser();
    const userNavDesktop = document.getElementById('userNavDesktop');
    const userNavMobile = document.getElementById('userNavMobile');
    const reviewLoginPrompt = document.getElementById('reviewLoginPrompt');
    const reviewForm = document.getElementById('reviewForm');

    if (user) {
      const initials = getInitials(user.name);
      // Desktop Nav
      if (userNavDesktop) {
        userNavDesktop.innerHTML = `
          <div class="flex items-center gap-2">
            ${user.isStaff ? `
              <a href="staff.html" class="inline-flex items-center gap-1.5 rounded-full bg-ocean px-3 py-1 text-xs font-bold text-white hover:bg-deep transition-colors shadow-sm">
                <i data-lucide="layout-dashboard" class="h-3.5 w-3.5"></i> Màn hình POS
              </a>` : ''}
            <div class="flex items-center gap-2 rounded-full border border-mist bg-white px-3 py-1 shadow-sm">
              <span class="avatar !w-7 !h-7 !text-xs">${esc(initials)}</span>
              <span class="text-xs font-bold text-deep max-w-[120px] truncate">${esc(user.name)}</span>
              <button type="button" id="logoutBtnDesktop" class="ml-1 text-slate-400 hover:text-red-500 cursor-pointer p-0.5" title="Đăng xuất">
                <i data-lucide="log-out" class="h-3.5 w-3.5"></i>
              </button>
            </div>
          </div>`;
        document.getElementById('logoutBtnDesktop')?.addEventListener('click', () => {
          localStorage.removeItem('bi_pos_session');
          setCurrentUser(null);
        });
      }
      // Mobile Nav
      if (userNavMobile) {
        userNavMobile.innerHTML = `
          <div class="flex flex-col gap-2 p-2 rounded-2xl bg-foam">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="avatar !w-8 !h-8 !text-xs">${esc(initials)}</span>
                <div>
                  <p class="text-xs font-bold text-deep">${esc(user.name)}</p>
                  <p class="text-[10px] text-slate-500">${esc(user.userRole || user.email)}</p>
                </div>
              </div>
              <button type="button" id="logoutBtnMobile" class="text-xs text-red-500 font-semibold px-2 py-1 hover:bg-white rounded-lg cursor-pointer">
                Đăng xuất
              </button>
            </div>
            ${user.isStaff ? `<a href="staff.html" class="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-ocean text-xs font-bold text-white hover:bg-deep"><i data-lucide="layout-dashboard" class="h-3.5 w-3.5"></i> Mở giao diện POS nhân viên</a>` : ''}
          </div>`;
        document.getElementById('logoutBtnMobile')?.addEventListener('click', () => {
          localStorage.removeItem('bi_pos_session');
          setCurrentUser(null);
        });
      }
      // Review Area
      if (reviewLoginPrompt) reviewLoginPrompt.classList.add('hidden');
      if (reviewForm) {
        reviewForm.classList.remove('hidden');
        document.getElementById('reviewUserAvatar').textContent = initials;
        document.getElementById('reviewUserName').textContent = user.name;
        document.getElementById('reviewUserSub').textContent = user.userRole || user.studentId || 'Thành viên BlueIsland';
      }
    } else {
      // Desktop Nav
      if (userNavDesktop) {
        userNavDesktop.innerHTML = `
          <button type="button" id="authBtnDesktop" class="btn-primary text-sm !px-4 !py-1.5 flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="user" class="h-4 w-4"></i> Đăng nhập
          </button>`;
        document.getElementById('authBtnDesktop')?.addEventListener('click', () => openAuthModal(false));
      }
      // Mobile Nav
      if (userNavMobile) {
        userNavMobile.innerHTML = `
          <button type="button" id="authBtnMobile" class="btn-primary w-full justify-center text-sm py-2">
            <i data-lucide="user" class="h-4 w-4"></i> Đăng nhập / Đăng ký
          </button>`;
        document.getElementById('authBtnMobile')?.addEventListener('click', () => openAuthModal(false));
      }
      // Review Area
      if (reviewLoginPrompt) reviewLoginPrompt.classList.remove('hidden');
      if (reviewForm) reviewForm.classList.add('hidden');
    }
    renderIcons();
  }

  /* ---------- Real Reviews Management (Empty State + Real Submissions) ---------- */
  function getStoredReviews() {
    try {
      const data = localStorage.getItem('blueisland_reviews');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveStoredReviews(reviews) {
    localStorage.setItem('blueisland_reviews', JSON.stringify(reviews));
    renderReviews();
  }

  // Star Rating Interaction
  const starBtns = document.querySelectorAll('#starRating .star-btn');
  const ratingValueInput = document.getElementById('ratingValue');

  function setRating(val) {
    if (!ratingValueInput) return;
    ratingValueInput.value = val;
    starBtns.forEach((btn) => {
      const bVal = Number(btn.dataset.value);
      btn.classList.toggle('text-ocean', bVal <= val);
      btn.classList.toggle('text-slate-300', bVal > val);
    });
  }
  setRating(5); // Default 5 stars
  starBtns.forEach((btn) => {
    btn.addEventListener('click', () => setRating(Number(btn.dataset.value)));
  });

  // Submit Review
  const reviewFormEl = document.getElementById('reviewForm');
  if (reviewFormEl) {
    reviewFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) {
        openAuthModal(false);
        return;
      }
      const comment = document.getElementById('reviewComment').value.trim();
      const rating = Number(document.getElementById('ratingValue').value) || 5;

      const newReview = {
        id: Date.now(),
        userName: user.name,
        userRole: user.userRole || user.studentId || 'Thành viên BlueIsland',
        rating,
        comment,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };

      // BACKEND NOTE: Thay bằng: await fetch('/api/reviews', { method: 'POST', body: JSON.stringify(newReview) })
      const currentList = getStoredReviews();
      currentList.unshift(newReview);
      saveStoredReviews(currentList);

      document.getElementById('reviewComment').value = '';
      setRating(5);
      alert('Cảm ơn bạn đã gửi đánh giá thật cho BlueIsland Coffee!');
    });
  }

  // Render Reviews List (Trống dữ liệu -> Empty State; Có dữ liệu -> Cards)
  function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    const reviews = getStoredReviews();

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="rounded-3xl border border-dashed border-mist bg-foam/60 p-10 text-center reveal is-visible">
          <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-shallow text-ocean mb-3">
            <i data-lucide="message-square-dashed" class="h-7 w-7"></i>
          </span>
          <h4 class="text-lg font-bold text-deep">Chưa có đánh giá nào</h4>
          <p class="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Chưa có sinh viên nào để lại nhận xét. Hãy là người đầu tiên đăng nhập và chia sẻ cảm nhận về BlueIsland Coffee nhé!
          </p>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          ${reviews.map((r) => {
            const starsHtml = Array.from({ length: 5 }, (_, idx) => `
              <i data-lucide="star" class="h-4 w-4 ${idx < r.rating ? 'text-ocean fill-current' : 'text-slate-200'}"></i>
            `).join('');
            const initials = getInitials(r.userName);
            return `
              <article class="review-card bg-white p-6 rounded-3xl border border-mist shadow-sea">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex gap-0.5">${starsHtml}</div>
                  <span class="text-[11px] text-slate-600">${esc(r.createdAt)}</span>
                </div>
                <blockquote class="mt-4 text-sm leading-relaxed text-ink italic font-accent">
                  “${esc(r.comment)}”
                </blockquote>
                <div class="mt-6 flex items-center gap-3 pt-4 border-t border-mist/60">
                  <span class="avatar !w-9 !h-9 !text-xs">${esc(initials)}</span>
                  <div class="overflow-hidden">
                    <p class="text-sm font-bold text-deep truncate">${esc(r.userName)}</p>
                    <p class="text-xs text-slate-600 truncate">${esc(r.userRole)}</p>
                  </div>
                </div>
              </article>`;
          }).join('')}
        </div>`;
    }
    renderIcons();
  }

  // Initialize Auth & Reviews
  updateAuthUI();
  renderReviews();

  /* ---------- Misc ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
  renderIcons();
})();

