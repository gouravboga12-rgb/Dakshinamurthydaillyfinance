import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { initDatabase } from './config/db';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import customerRoutes from './routes/customerRoutes';

const app = express();
const PORT = process.env.PORT || 8081;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors());

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── File Uploads ─────────────────────────────────────────────────────────────
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ─── API Routes (must come BEFORE static/proxy serving) ──────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/customer', customerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Development Proxy Logic ─────────────────────────────────────────────────
const IS_DEV = process.env.NODE_ENV !== 'production';

function devProxy(targetPort: number) {
  return (req: express.Request, res: express.Response) => {
    const options = {
      hostname: 'localhost',
      port: targetPort,
      path: req.originalUrl || req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${targetPort}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Dev Proxy Error to port ${targetPort}] ${err.message}`);
      if (!res.headersSent) {
        res.status(502).send(`
          <div style="font-family:system-ui,sans-serif;background:#0F172A;color:#fff;padding:40px;text-align:center;border-radius:12px;max-width:500px;margin:80px auto;border:1px solid #334155">
            <h2 style="color:#F0C040">Service starting...</h2>
            <p style="color:#94a3b8">The frontend server on port ${targetPort} is not responding yet.</p>
            <p style="color:#64748b;font-size:13px">Please wait 5-10 seconds and refresh the page.</p>
          </div>
        `);
      }
    });

    req.pipe(proxyReq, { end: true });
  };
}

if (IS_DEV) {
  console.log('⚡ Running in development mode. Frontends will be proxied:');
  console.log('   - /admin  →  http://localhost:3000');
  console.log('   - /       →  http://localhost:8082');

  // Redirect /admin to /admin/ to satisfy Vite's base path requirement
  app.get('/admin', (req, res, next) => {
    if (req.originalUrl === '/admin') {
      return res.redirect(301, '/admin/');
    }
    next();
  });

  // Proxy admin panel requests (Vite dev server)
  app.use('/admin', devProxy(3000));

  // Proxy customer web requests (Expo packager on port 8082)
  app.use('/', (req, res, next) => {
    // Let API and uploads pass through to express handlers
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    devProxy(8082)(req, res);
  });

} else {
  console.log('🌐 Running in production mode. Static builds will be served.');

  // ─── Admin Panel Static Files (/admin/*) ──────────────────────────────────────
  // Vite builds to admin-panel/dist with base: '/admin/'
  const adminDist = path.resolve(__dirname, '../../admin-panel/dist');
  if (fs.existsSync(adminDist)) {
    // Serve admin static assets
    app.use('/admin', express.static(adminDist));

    // SPA fallback: any /admin/* route that doesn't match a file → serve index.html
    app.get('/admin', (_req, res) => {
      res.sendFile(path.join(adminDist, 'index.html'));
    });
    app.get('/admin/*', (_req, res) => {
      res.sendFile(path.join(adminDist, 'index.html'));
    });
    console.log('✅ Admin panel build found and will be served at /admin');
  } else {
    app.get('/admin', (_req, res) => {
      res.status(503).send(buildNotReadyHtml('Admin Panel', 'admin-panel/', 'npm run build'));
    });
    app.get('/admin/*', (_req, res) => {
      res.status(503).send(buildNotReadyHtml('Admin Panel', 'admin-panel/', 'npm run build'));
    });
    console.warn('⚠️ Admin panel dist not found. Run: cd admin-panel && npm run build');
  }

  // ─── Customer Mobile Web App (/) ──────────────────────────────────────────────
  // Expo exports to customer-mobile/dist or web-build
  let customerDist = path.resolve(__dirname, '../../customer-mobile/dist');
  if (!fs.existsSync(customerDist)) {
    customerDist = path.resolve(__dirname, '../../customer-mobile/web-build');
  }

  if (fs.existsSync(customerDist)) {
    // Serve customer static assets
    app.use('/', express.static(customerDist));

    // SPA fallback: all non-API, non-admin routes serve customer index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(customerDist, 'index.html'));
    });
    console.log(`✅ Customer web build found at ${customerDist} and will be served at /`);
  } else {
    app.get('/', (_req, res) => {
      res.status(503).send(buildNotReadyHtml('Customer Mobile Web App', 'customer-mobile/', 'npx expo export --platform web'));
    });
    console.warn('⚠️ Customer web-build not found. Run: cd customer-mobile && npx expo export --platform web');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildNotReadyHtml(name: string, dir: string, cmd: string): string {
  return `<!DOCTYPE html>
<html>
<head><title>${name} — Not Built</title></head>
<body style="font-family:system-ui,sans-serif;background:#0D1B2A;color:#fff;padding:60px;text-align:center">
  <div style="max-width:500px;margin:0 auto">
    <div style="font-size:52px;margin-bottom:20px">🔨</div>
    <h1 style="color:#D4A017;margin-bottom:8px">${name}</h1>
    <p style="color:#94a3b8;margin-bottom:28px">Not built yet. Run the build command below.</p>
    <div style="background:#1A2E45;border-radius:14px;padding:24px;text-align:left;font-size:14px;line-height:2">
      <div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">Build Command</div>
      <code style="color:#F0C040;font-size:15px">cd ${dir}</code><br>
      <code style="color:#F0C040;font-size:15px">${cmd}</code>
    </div>
    <p style="color:#475569;margin-top:24px;font-size:13px">Then restart the backend server.</p>
  </div>
</body>
</html>`;
}

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err.message || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await initDatabase();
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║     Dakshinamurthy Daily Finance — Unified Server    ║');
      console.log('╠══════════════════════════════════════════════════════╣');
      console.log(`║  🌐 Customer App  →  http://localhost:${PORT}          ║`);
      console.log(`║  🔧 Admin Panel   →  http://localhost:${PORT}/admin    ║`);
      console.log(`║  📡 Backend API   →  http://localhost:${PORT}/api      ║`);
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log('');
    });

    // WebSocket Proxy for HMR (Vite on 3000, Expo on 8082)
    if (IS_DEV) {
      server.on('upgrade', (req: any, socket: any, head: any) => {
        const reqUrl = req.url || '/';
        const targetPort = (reqUrl.startsWith('/admin') || reqUrl.includes('vite')) ? 3000 : 8082;

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

        proxySocket.on('error', () => {
          socket.destroy();
        });
        socket.on('error', () => proxySocket.destroy());
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

