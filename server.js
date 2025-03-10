const http = require('http');
const fs = require('fs');
const path = require('path');

// Hàm phục vụ file tĩnh
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

// Tạo server
const server = http.createServer((req, res) => {
    let filePath = '';

    // Kiểm tra route
    if (req.url === '/') {
        filePath = path.join(__dirname, 'views', 'Admin' , 'Loginadmin.html');
    } 
    else if (req.url.startsWith('/public/')) {
        filePath = path.join(__dirname, req.url);
    } else if (req.url.startsWith('/routes/')) {
        filePath = path.join(__dirname, req.url);
    } else if (req.url.startsWith('/views/')) { 
        filePath = path.join(__dirname, req.url);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
        return;
    }

    // Phục vụ file
    serveStaticFile(filePath, res);
});

// Lắng nghe trên cổng
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
