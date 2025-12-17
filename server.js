/**
 * 简单的本地测试服务器
 * 使用 Node.js 运行: node server.js
 */

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 8080;

var mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

var server = http.createServer(function(req, res) {
    console.log('Request:', req.method, req.url);
    
    var filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    var extname = String(path.extname(filePath)).toLowerCase();
    var contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, function() {
    console.log('Server running at http://localhost:' + PORT + '/');
    console.log('Press Ctrl+C to stop the server');
});
