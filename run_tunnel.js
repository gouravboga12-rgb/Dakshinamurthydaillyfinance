const { spawn } = require('child_process');

const targetSubdomain = 'dakshinamurthy-daily-finance-app';
const targetUrl = `https://${targetSubdomain}.loca.lt`;

function startTunnel() {
  console.log(`[Tunnel] Starting localtunnel on port 8081 for subdomain ${targetSubdomain}...`);
  
  const child = spawn('npx', ['localtunnel', '--port', '8081', '--subdomain', targetSubdomain], {
    shell: true,
    stdio: 'pipe'
  });

  let hasTargetUrl = false;

  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[Tunnel Out] ${output}`);
    
    if (output.includes('your url is:')) {
      if (output.includes(targetUrl)) {
        hasTargetUrl = true;
        console.log(`[Tunnel Success] Leased target subdomain URL: ${targetUrl}`);
      } else {
        console.warn(`[Tunnel Warning] Leased wrong subdomain URL: ${output}. Retrying in 15 seconds to regain target subdomain...`);
        child.kill();
      }
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`[Tunnel Err] ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    const delay = hasTargetUrl ? 5000 : 15000;
    console.log(`[Tunnel] Process exited with code ${code}. Restarting in ${delay / 1000} seconds...`);
    setTimeout(startTunnel, delay);
  });

  child.on('error', (err) => {
    console.error('[Tunnel Error]', err);
  });
}

startTunnel();

// Keep process running
setInterval(() => {}, 10000);
