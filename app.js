const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const express = require('express');
const app = express();

// ✅ Cho phép serve static ở mọi môi trường (local & Vercel)
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/routes', express.static(path.join(__dirname, 'routes')));

// Hàm phục vụ file tĩnh (HTML, CSS, JS…)
function serveStaticFile(filePath, res) {
    const extname = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    }[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// ✅ Tạo server chung
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    let filePath = '';

    if (pathname === '/') {
        filePath = path.join(__dirname, 'views', 'home.html');
    } else if (pathname === '/admin') {
        filePath = path.join(__dirname, 'views', 'Admin', 'admin_main.html');
    } else if (pathname.startsWith('/public/')) {
        filePath = path.join(__dirname, pathname);
    } else if (pathname.startsWith('/routes/')) {
        filePath = path.join(__dirname, pathname);
    } else if (pathname.startsWith('/views/')) {
        filePath = path.join(__dirname, pathname);
    } else if (pathname === '/product-detail') {
        if (query.id) {
            console.log(`🔍 Đang lấy thông tin sản phẩm với ID: ${query.id}`);
            filePath = path.join(__dirname, 'views', 'Category', 'product-detail.html');
        } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>400 Bad Request: Thiếu ID sản phẩm</h1>');
            return;
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
        return;
    }

    serveStaticFile(filePath, res);
});

// ✅ Export cho Vercel
module.exports = server;

// ✅ Nếu chạy local thì listen
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
}
