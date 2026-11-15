/* =========================================================
   BlueIsland Coffee – Lớp dữ liệu cho trang Admin (api.js)
   ---------------------------------------------------------
   admin.js chỉ lấy/ghi dữ liệu qua window.BI_API.
   - USE_MOCK = true : dữ liệu giả (dùng khi chưa có backend).
   - USE_MOCK = false: gọi fetch thật tới /api/admin/... kèm
     header Authorization: Bearer <token>.
   LƯU Ý: Backend phải tự tính lại tổng tiền, giảm giá và kiểm
   tra quyền. Frontend chỉ hiển thị.
   ========================================================= */
(function () {
  'use strict';

  const USE_MOCK = true;

  // Giai đoạn 2: mới chỉ có cờ USE_MOCK để admin.js quyết định chế độ preview.
  // Các nhóm hàm (orders, menu, toppings, staff, shifts, reviews, settings, stats)
  // sẽ được bổ sung ở giai đoạn 3.
  window.BI_API = {
    USE_MOCK
  };
})();
