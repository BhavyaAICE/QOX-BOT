const localtunnel = require('localtunnel');

const PORT = 5173;
const SUBDOMAIN = 'few-readers-burn';

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });
    console.log(`🚀 Tunnel is active at: ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log('⚠️ Tunnel closed, reconnecting in 2 seconds...');
      setTimeout(startTunnel, 2000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
      setTimeout(startTunnel, 2000);
    });
  } catch (err) {
    console.error('Failed to connect tunnel, retrying in 3s...', err.message);
    setTimeout(startTunnel, 3000);
  }
}

startTunnel();

// Keep event loop alive
setInterval(() => {}, 1000 * 60 * 60);
