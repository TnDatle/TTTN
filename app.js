const express = require('express');
const path = require('path');
const app = express();

// Cấu hình Express để phục vụ file tĩnh trong thư mục "public"
app.use('/public', express.static(path.join(__dirname, 'public')));

// Cấu hình Express để phục vụ file tĩnh trong thư mục "routes"
app.use('/routes', express.static(path.join(__dirname, 'routes')));

// Cấu hình Express để phục vụ file tĩnh trong thư mục "views"
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route chính để render trang index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
