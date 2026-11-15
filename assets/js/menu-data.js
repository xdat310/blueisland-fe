/* =========================================================
   BlueIsland Coffee – dữ liệu menu dùng chung
   (landing page index.html + trang nhân viên staff.html)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Menu data: 23 món chính thức chuẩn theo Menu thật ---------- */
  const MENU = {
    special: [
      {
        name: 'Santorini blue soda',
        desc: 'Soda việt quất xanh mát mang phong vị biển đảo Santorini đặc trưng.',
        price: 25000,
        tag: 'Signature',
        img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Santorini dream',
        desc: 'Hương vị biển nhiệt đới mộng mơ mát lạnh, công thức độc quyền của quán.',
        price: 25000,
        tag: 'Đặc biệt',
        img: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=75'
      }
    ],
    espresso: [
      {
        name: 'Capuchino',
        desc: 'Espresso thơm đậm hòa quyện cùng lớp bọt sữa dày mịn bồng bềnh.',
        price: 40000,
        tag: 'Café máy',
        img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Latte',
        desc: 'Espresso cùng sữa tươi đánh mịn mượt, hỗ trợ in hình nghệ thuật theo yêu cầu.',
        price: 40000,
        tag: 'In hình nghệ thuật',
        img: 'https://images.unsplash.com/photo-1553962311-62f2471b159d?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Americano',
        desc: 'Espresso Arabica pha loãng thanh nhẹ, khởi đầu ngày học tập tỉnh táo.',
        price: 35000,
        img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Mocha',
        desc: 'Vị đắng nhẹ của cà phê hòa quyện cùng sốt chocolate đậm đà ngọt bùi.',
        price: 40000,
        img: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=75'
      }
    ],
    coffee: [
      {
        name: 'Café đen nóng/đá',
        desc: 'Cà phê phin truyền thống thơm nồng, đậm đà nguyên bản.',
        price: 20000,
        img: 'https://images.unsplash.com/photo-1558557019-051d86ef616f?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Café nâu nóng/đá',
        desc: 'Cà phê phin hòa cùng sữa đặc béo ngọt thơm phức, chuẩn vị Việt.',
        price: 20000,
        img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Bạc xỉu',
        desc: 'Nhiều sữa ít cà phê, béo ngậy ngọt dịu, món yêu thích của sinh viên.',
        price: 25000,
        tag: 'Yêu thích',
        img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Café muối',
        desc: 'Cà phê đậm vị phủ lớp kem muối béo mặn nhẹ cực cuốn.',
        price: 30000,
        tag: 'Best seller',
        img: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Café kem trứng',
        desc: 'Lớp kem trứng đánh bông vàng óng béo ngậy trên nền cà phê đậm đà.',
        price: 30000,
        tag: 'Món hot',
        img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=75'
      }
    ],
    tea: [
      {
        name: 'Trà chanh mật ong',
        desc: 'Chanh tươi chua thanh quyện mật ong hoa rừng ngọt dịu giải nhiệt.',
        price: 20000,
        img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Trà vải hoa nhài',
        desc: 'Hương hoa nhài thơm ngát cùng vị ngọt lịm của những trái vải mọng nước.',
        price: 20000,
        tag: 'Thanh mát',
        img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=75'
      }
    ],
    ice: [
      {
        name: 'Matcha đá xay',
        desc: 'Matcha Nhật Bản xay mịn cùng đá và sữa tươi thơm ngậy.',
        price: 35000,
        tag: 'Yêu thích',
        img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Chocolate đá xay',
        desc: 'Vị socola hảo hạng xay mát lạnh, béo ngậy ngọt ngào sảng khoái.',
        price: 35000,
        img: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Sữa chua đá xay',
        desc: 'Sữa chua lên men tự nhiên xay tuyết chua ngọt mát lành.',
        price: 30000,
        img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=75'
      }
    ],
    juice: [
      {
        name: 'Nước cam ép',
        desc: '100% cam tươi vắt nguyên chất, giàu vitamin C tự nhiên.',
        price: 40000,
        img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Nước ép dứa',
        desc: 'Dứa tươi chín vàng ngọt thanh, chua dịu giải khát tức thì.',
        price: 40000,
        img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Nước ép cam cà rốt, cam dứa',
        desc: 'Mix hoa quả tươi tự nhiên bổ sung năng lượng và làm sáng da.',
        price: 40000,
        tag: 'Mix tươi',
        img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Sinh tố bơ',
        desc: 'Bơ sáp béo ngậy xay cùng sữa đặc sánh mịn thơm bùi.',
        price: 35000,
        tag: 'Bổ dưỡng',
        img: 'https://images.unsplash.com/photo-1541591425126-4e6dcf84b386?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Bơ già dừa non',
        desc: 'Sự kết hợp độc đáo giữa bơ già béo bùi và dừa non giòn ngọt thơm lừng.',
        price: 35000,
        tag: 'Món mới',
        img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=75'
      }
    ],
    other: [
      {
        name: 'Matcha Latte',
        desc: 'Trà xanh Nhật Bản thượng hạng hòa quyện cùng sữa tươi mịn màng.',
        price: 40000,
        img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=75'
      },
      {
        name: 'Coco Matcha',
        desc: 'Matcha nguyên chất hòa cùng nước cốt dừa béo ngậy nhiệt đới.',
        price: 50000,
        tag: 'Đặc sắc',
        img: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=600&q=75'
      }
    ]
  };

  // Gom toàn bộ 23 món vào danh mục All
  MENU.all = [
    ...MENU.special,
    ...MENU.espresso,
    ...MENU.coffee,
    ...MENU.tea,
    ...MENU.ice,
    ...MENU.juice,
    ...MENU.other
  ];

  window.BI_MENU = MENU;
})();
