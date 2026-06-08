import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { initDatabase, db } from './config/db';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import customerRoutes from './routes/customerRoutes';

const app = express();
const PORT = process.env.PORT || 8081;

// Initialize database connection for serverless/Vercel before any route processing
let isDbInit = false;
app.use(async (req, res, next) => {
  if (!isDbInit) {
    try {
      await initDatabase();
      isDbInit = true;
    } catch (e) {
      console.error('Failed to initialize database in serverless environment:', e);
    }
  }
  next();
});

// --- Request Logging (Before CORS to capture preflights) ---
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`[Request Log In] ${req.method} ${req.originalUrl || req.url} - Content-Length: ${req.headers['content-length'] || 'N/A'} - Content-Type: ${req.headers['content-type'] || 'N/A'}`);
  
  res.on('finish', () => {
    console.log(`[Request Log Out] ${req.method} ${req.originalUrl || req.url} -> Status: ${res.statusCode} (${Date.now() - startTime}ms)`);
  });
  
  next();
});

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors());

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── File Uploads ─────────────────────────────────────────────────────────────
const uploadDir = process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create uploads root directory:', e);
}
app.use('/uploads', express.static(uploadDir));

// ─── API Routes (must come BEFORE static/proxy serving) ──────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/customer', customerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test-analytics', async (req, res) => {
  try {
    const stats = await db.getDashboardAnalytics();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || err });
  }
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
  //
  // IMPORTANT: On Vercel, @vercel/node bundles via ncc, so __dirname resolves
  // to /var/task (the Lambda root). includeFiles copies admin-panel/dist/** to
  // /var/task/admin-panel/dist/. Locally, __dirname is backend/src/, so we
  // go ../../ up to reach admin-panel/dist.
  const adminDistVercel = path.resolve(process.cwd(), 'admin-panel/dist');
  const adminDistLocal  = path.resolve(__dirname, '../../admin-panel/dist');
  const adminDist = fs.existsSync(adminDistVercel) ? adminDistVercel
                  : fs.existsSync(adminDistLocal)  ? adminDistLocal
                  : adminDistVercel; // fallback so the log message below makes sense

  console.log(`[Paths] __dirname=${__dirname} cwd=${process.cwd()}`);
  console.log(`[Paths] adminDist candidate (Vercel)=${adminDistVercel} exists=${fs.existsSync(adminDistVercel)}`);
  console.log(`[Paths] adminDist candidate (Local) =${adminDistLocal}  exists=${fs.existsSync(adminDistLocal)}`);
  console.log(`[Paths] Using adminDist=${adminDist}`);

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
    console.warn(`⚠️ Admin panel dist not found at ${adminDist}. Run: cd admin-panel && npm run build`);
  }

  // ─── Customer Mobile Web App (/) ──────────────────────────────────────────────
  // Expo exports to customer-mobile/dist or web-build
  const customerDistVercel = path.resolve(process.cwd(), 'customer-mobile/dist');
  const customerDistLocal1 = path.resolve(__dirname, '../../customer-mobile/dist');
  const customerDistLocal2 = path.resolve(__dirname, '../../customer-mobile/web-build');
  let customerDist = fs.existsSync(customerDistVercel) ? customerDistVercel
                   : fs.existsSync(customerDistLocal1)  ? customerDistLocal1
                   : customerDistLocal2;

  if (fs.existsSync(customerDist)) {
    // Serve customer static assets
    app.use('/', express.static(customerDist));

    // SPA fallback: all non-API, non-admin routes serve customer index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(customerDist, 'index.html'));
    });
    console.log(`✅ Customer web build found at ${customerDist} and will be served at /`);
  } else {
    // On Vercel: the customer app is an APK, not a web app.
    // Redirect root to the admin panel, and return a clean status for API pings.
    app.get('/', (_req, res) => {
      res.redirect(301, '/admin');
    });
    app.get('*', (_req, res) => {
      res.redirect(301, '/admin');
    });
    console.log('ℹ️ No customer web build found. Root (/) redirects to /admin on Vercel.');
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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    console.error(`[Body Parser Error] Failed to parse request body for ${req.method} ${req.originalUrl || req.url}`);
    console.error('Raw body fragment:', (err as any).body);
  }
  console.error('Server Error Stack:', err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await initDatabase();
    isDbInit = true;
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

if (!process.env.VERCEL) {
  startServer();
}

export { app, initDatabase };

