const localtunnel = require('localtunnel');

const targetSubdomain = 'dakshinamurthy-daily-finance-app';

async function startTunnel() {
  console.log(`[Tunnel] Starting localtunnel on port 8081 for subdomain ${targetSubdomain}...`);
  try {
    const tunnel = await localtunnel({ port: 8081, subdomain: targetSubdomain });
    
    console.log(`[Tunnel Success] Leased URL: ${tunnel.url}`);
    
    if (tunnel.url.includes(targetSubdomain)) {
      console.log(`[Tunnel Verified] Connected to ${targetSubdomain} successfully!`);
    } else {
      console.warn(`[Tunnel Warning] Leased wrong URL: ${tunnel.url}. Closing and retrying in 15 seconds...`);
      tunnel.close();
      setTimeout(startTunnel, 15000);
      return;
    }
    
    tunnel.on('close', () => {
      console.log('[Tunnel] Tunnel closed. Reconnecting in 10 seconds...');
      setTimeout(startTunnel, 10000);
    });

    tunnel.on('error', (err) => {
      console.error('[Tunnel Error]', err);
      tunnel.close();
    });
  } catch (err) {
    console.error('[Tunnel Connect Error] Failed to connect:', err.message || err);
    console.log('[Tunnel] Retrying in 15 seconds...');
    setTimeout(startTunnel, 15000);
  }
}

startTunnel();

// Keep process running
setInterval(() => {}, 10000);
