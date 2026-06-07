const { spawn } = require('child_process');

function startTunnel() {
  console.log('[Tunnel] Starting localtunnel on port 8081 for subdomain dakshinamurthy-daily-finance-app...');
  
  const child = spawn('npx', ['localtunnel', '--port', '8081', '--subdomain', 'dakshinamurthy-daily-finance-app'], {
    shell: true,
    stdio: 'pipe'
  });

  child.stdout.on('data', (data) => {
    console.log(`[Tunnel Out] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[Tunnel Err] ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    console.log(`[Tunnel] Process exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startTunnel, 5000);
  });

  child.on('error', (err) => {
    console.error('[Tunnel Error]', err);
  });
}

startTunnel();

// Keep process running
setInterval(() => {}, 10000);
