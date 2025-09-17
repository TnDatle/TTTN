const express = require('express');
const path = require('path');
const app = express();

// phục vụ file tĩnh từ public và views
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// route trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// route admin (nếu vẫn muốn chạy chung)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'Admin', 'admin_main.html'));
});

// product-detail với query ?id=xxx
app.get('/product-detail', (req, res) => {
  if (req.query.id) {
    console.log(`🔍 Đang lấy thông tin sản phẩm với ID: ${req.query.id}`);
    res.sendFile(path.join(__dirname, 'views', 'Category', 'product-detail.html'));
  } else {
    res.status(400).send('<h1>400 Bad Request: Thiếu ID sản phẩm</h1>');
  }
});

// ❌ KHÔNG dùng app.listen()
// ✅ Export cho Vercel xử lý
module.exports = app;
