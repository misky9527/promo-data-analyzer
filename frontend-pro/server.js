const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5166;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function proxyAPI(req, res) {
  const apiHost = process.env.BACKEND_HOST || 'localhost';
  const apiPort = process.env.BACKEND_PORT || 3003;
  const options = {
    hostname: apiHost,
    port: apiPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${apiHost}:${apiPort}`,
      'x-forwarded-for': req.socket.remoteAddress || req.headers['x-forwarded-for'] || '',
      'x-real-ip': req.socket.remoteAddress || '',
    },
  };
  const proxyReq = http.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(body);
    });
  });
  proxyReq.on('error', () => {
    res.writeHead(502);
    res.end('Bad Gateway');
  });
  req.pipe(proxyReq);
}

function serveStatic(req, res) {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const tryPaths = [filePath + '.html', filePath + '/index.html'];
  for (const p of tryPaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(p).pipe(res);
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(path.join(DIST_DIR, 'index.html')).pipe(res);
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyAPI(req, res);
  } else {
    serveStatic(req, res);
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving dist/ on 0.0.0.0:${PORT} (API → ${process.env.BACKEND_HOST || 'localhost'}:${process.env.BACKEND_PORT || 3003})`);
});
