/**
 * Dakshinamurthy Daily Finance — Unified Build & Start Script
 * 
 * Builds admin panel and customer web app, then starts the unified backend.
 * 
 * Usage:
 *   node start-all.js          → Build everything + start server
 *   node start-all.js --dev    → Skip builds, start backend in dev mode
 *   node start-all.js --build  → Only build, don't start server
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT    = __dirname;
const BACKEND = path.join(ROOT, 'backend');
const ADMIN   = path.join(ROOT, 'admin-panel');
const MOBILE  = path.join(ROOT, 'customer-mobile');

const args    = process.argv.slice(2);
const DEV_MODE   = args.includes('--dev');
const BUILD_ONLY = args.includes('--build');

const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const GOLD  = '\x1b[33m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

function log(color, icon, msg) {
  console.log(`${color}${icon} ${msg}${RESET}`);
}

function run(cmd, cwd, label) {
  log(CYAN, '⚙', `[${label}] ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
    log(GREEN, '✓', `[${label}] Done`);
  } catch (e) {
    log(RED, '✗', `[${label}] FAILED: ${e.message}`);
    process.exit(1);
  }
}

console.log('');
console.log(`${GOLD}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
console.log(`${GOLD}${BOLD}║    Dakshinamurthy Daily Finance — Unified Launcher   ║${RESET}`);
console.log(`${GOLD}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
console.log('');

if (DEV_MODE) {
  // ── Dev mode: run backend, Vite, and Expo concurrently ──
  log(GOLD, '⚡', 'Starting dev servers concurrently on a unified port (8081)...');
  console.log('');

  let adminProcess, mobileProcess, backendProcess;

  function killProcess(child) {
    if (!child) return;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {
      // Process is already dead or couldn't be killed
    }
  }

  let cleaningUp = false;
  const cleanup = () => {
    if (cleaningUp) return;
    cleaningUp = true;
    console.log(`\n${GOLD}Stopping all dev services...${RESET}`);
    killProcess(adminProcess);
    killProcess(mobileProcess);
    killProcess(backendProcess);
    process.exit(0);
  };

  function spawnService(cmd, args, cwd, label, color) {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${color}[${label}]${RESET} ${line.trim()}`);
        }
      });
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.error(`${RED}[${label} ERR]${RESET} ${line.trim()}`);
        }
      });
    });

    child.on('exit', (code) => {
      if (code === 0 || code === null) {
        log(GOLD, 'ℹ', `${label} service stopped.`);
      } else {
        log(RED, '✗', `${label} service exited with code ${code}`);
      }
      cleanup();
    });

    return child;
  }

  // Start frontends & backend dev servers
  adminProcess = spawnService('npm', ['run', 'dev'], ADMIN, 'Admin', GOLD);
  mobileProcess = spawnService('npm', ['run', 'web'], MOBILE, 'Customer', CYAN);
  backendProcess = spawnService('npm', ['run', 'dev'], BACKEND, 'Backend', GREEN);

  // Print helpful welcome guide
  setTimeout(() => {
    console.log('');
    console.log(`${GOLD}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${GOLD}${BOLD}║            🌐  App is Ready in Dev Mode!             ║${RESET}`);
    console.log(`${GOLD}${BOLD}╠══════════════════════════════════════════════════════╣${RESET}`);
    console.log(`${GOLD}║${RESET}  Unified Port  →  ${CYAN}http://localhost:8081${RESET}            ${GOLD}║${RESET}`);
    console.log(`${GOLD}║${RESET}  Admin Panel   →  ${GOLD}http://localhost:8081/admin/${RESET}     ${GOLD}║${RESET}`);
    console.log(`${GOLD}║${RESET}  Backend API   →  ${CYAN}http://localhost:8081/api${RESET}        ${GOLD}║${RESET}`);
    console.log(`${GOLD}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
    console.log('');
  }, 5000);

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

} else {
  // ── Production mode: build everything then start ──

  // 1. Build Admin Panel
  log(GOLD, '🔨', 'Building Admin Panel (Vite)...');
  run('npm run build', ADMIN, 'Admin Panel');

  // 2. Build Customer Mobile Web
  log(GOLD, '🔨', 'Building Customer Web App (Expo)...');
  run('npx expo export --platform web', MOBILE, 'Customer App');

  if (BUILD_ONLY) {
    log(GREEN, '✅', 'All builds complete!');
    log(CYAN, '📌', 'To start the server run:  cd backend && npm run dev');
    process.exit(0);
  }

  // 3. Start Backend (serves everything on port 8081)
  console.log('');
  log(GOLD, '🚀', 'Starting unified backend server...');
  console.log('');

  const backend = spawn('npm', ['run', 'dev'], {
    cwd: BACKEND,
    stdio: 'inherit',
    shell: true,
  });

  backend.on('exit', (code) => {
    log(RED, '✗', `Backend exited with code ${code}`);
    process.exit(code);
  });

  // Print access URLs after a short delay
  setTimeout(() => {
    console.log('');
    console.log(`${GOLD}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${GOLD}${BOLD}║             🌐  App is Ready!                        ║${RESET}`);
    console.log(`${GOLD}${BOLD}╠══════════════════════════════════════════════════════╣${RESET}`);
    console.log(`${GOLD}║${RESET}  Customer App  →  ${CYAN}http://localhost:8081${RESET}            ${GOLD}║${RESET}`);
    console.log(`${GOLD}║${RESET}  Admin Panel   →  ${GOLD}http://localhost:8081/admin/${RESET}     ${GOLD}║${RESET}`);
    console.log(`${GOLD}║${RESET}  Backend API   →  ${CYAN}http://localhost:8081/api${RESET}        ${GOLD}║${RESET}`);
    console.log(`${GOLD}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
    console.log('');
  }, 4000);
}
