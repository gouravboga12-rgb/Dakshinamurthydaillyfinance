/**
 * Unified Dev Proxy Server — Port 8081
 * Uses ONLY Node.js built-in modules (no npm install needed!)
 * 
 * Routes:
 *   localhost:8081/admin/*  →  Admin Panel Vite dev server (port 3000)
 *   localhost:8081/*        →  Customer Mobile Expo web   (port 8082)
 * 
 * Usage:
 *   1. Start admin panel:    npm run dev   (in admin-panel/ — runs on port 3000)
 *   2. Start customer app:   npx expo start --web --port 8082  (in customer-mobile/)
 *   3. Start this proxy:     node proxy-server.js  (in project root)
 *   4. Open browser:
 *      - Customer app:  http://localhost:8081
 *      - Admin panel:   http://localhost:8081/admin/
 */

const http  = require('http');
const https = require('https');
const url   = require('url');

const ADMIN_PORT    = 3000;   // Vite admin dev server port
const CUSTOMER_PORT = 8082;   // Expo web port (we'll move from 8081 → 8082)
const PROXY_PORT    = 8081;   // This unified proxy port

function forwardRequest(req, res, targetPort, pathOverride) {
  const parsedUrl = url.parse(req.url);
  const options = {
    hostname: 'localhost',
    port: targetPort,
    path: pathOverride !== undefined ? pathOverride : parsedUrl.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${targetPort}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Pass status and headers through
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    const serviceName = targetPort === ADMIN_PORT ? 'Admin Panel (port 3000)' : 'Customer App (port 8082)';
    console.error(`[Proxy Error → port ${targetPort}] ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    }
    res.end(`<!DOCTYPE html>
<html>
<head><title>Service Not Ready</title></head>
<body style="font-family:system-ui,sans-serif;background:#0D1B2A;color:#fff;padding:48px;text-align:center">
  <div style="max-width:480px;margin:0 auto">
    <div style="font-size:48px;margin-bottom:16px">⚠️</div>
    <h2 style="color:#D4A017;margin-bottom:8px">Service Not Ready</h2>
    <p style="color:#94a3b8;margin-bottom:24px">
      <strong style="color:#fff">${serviceName}</strong> is not running yet.
    </p>
    <div style="background:#1A2E45;border-radius:12px;padding:20px;text-align:left;font-size:13px;color:#94a3b8;line-height:1.8">
      <strong style="color:#D4A017">Start all servers:</strong><br>
      1. <code style="color:#F0C040">Admin panel:</code> cd admin-panel && npm run dev<br>
      2. <code style="color:#F0C040">Customer app:</code> cd customer-mobile && npx expo start --web --port 8082<br>
      3. <code style="color:#F0C040">Backend:</code> cd backend && npm run dev<br>
      4. <code style="color:#F0C040">This proxy:</code> node proxy-server.js
    </div>
  </div>
</body>
</html>`);
  });

  // Pipe the incoming request body to proxy
  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url || '/';

  if (reqUrl === '/admin' || reqUrl.startsWith('/admin/') || reqUrl.startsWith('/admin?')) {
    // Admin panel: forward to Vite dev server on port 3000
    // The Vite server is configured with base: '/admin/' so paths match directly
    console.log(`\x1b[33m[→ Admin]\x1b[0m    ${req.method} ${reqUrl}`);
    forwardRequest(req, res, ADMIN_PORT);
  } else {
    // Customer mobile web: forward to Expo on port 8082
    console.log(`\x1b[36m[→ Customer]\x1b[0m ${req.method} ${reqUrl}`);
    forwardRequest(req, res, CUSTOMER_PORT);
  }
});

// WebSocket proxy (for Vite HMR and Expo HMR live-reload)
server.on('upgrade', (req, socket, head) => {
  const reqUrl = req.url || '/';
  const targetPort = (reqUrl.startsWith('/admin')) ? ADMIN_PORT : CUSTOMER_PORT;

  const proxySocket = require('net').createConnection(targetPort, 'localhost', () => {
    proxySocket.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    );
    proxySocket.write(head);
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });

  proxySocket.on('error', (err) => {
    console.error(`[WS Proxy Error → port ${targetPort}]`, err.message);
    socket.destroy();
  });
  socket.on('error', () => proxySocket.destroy());
});

server.listen(PROXY_PORT, () => {
  console.log('');
  console.log('\x1b[33m╔══════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  \x1b[1mDakshinamurthy Daily Finance — Dev Proxy\x1b[0m      \x1b[33m║\x1b[0m');
  console.log('\x1b[33m╠══════════════════════════════════════════════════╣\x1b[0m');
  console.log(`\x1b[33m║\x1b[0m  🌐 Customer App  →  \x1b[36mhttp://localhost:${PROXY_PORT}\x1b[0m        \x1b[33m║\x1b[0m`);
  console.log(`\x1b[33m║\x1b[0m  🔧 Admin Panel   →  \x1b[33mhttp://localhost:${PROXY_PORT}/admin/\x1b[0m  \x1b[33m║\x1b[0m`);
  console.log('\x1b[33m╠══════════════════════════════════════════════════╣\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  Prerequisites:                                   \x1b[33m║\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  • Admin  running on port 3000 (Vite)             \x1b[33m║\x1b[0m');
  console.log('\x1b[33m║\x1b[0m  • Expo   running on port 8082                     \x1b[33m║\x1b[0m');
  console.log('\x1b[33m╚══════════════════════════════════════════════════╝\x1b[0m');
  console.log('');
});
