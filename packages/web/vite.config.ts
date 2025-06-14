import os from 'os';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import { STREAMER_PORT } from '../servers/streamer.js';
import { PHONE_PORT } from '../servers/phone.js';

function getLocalNetworkAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const certsDir = path.resolve(__dirname, '../certs');
const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

// Check if cert files exist; if not, run the setup script
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Cert files missing, generating...');
  try {
    execSync('bun certs/make-certs.js', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to generate certificates:', e);
    process.exit(1);
  }
}

const localIp = getLocalNetworkAddress();
const vite_port = 5173;

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: vite_port,
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '..', 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '..', 'certs/cert.pem')),
    },
  },

  plugins: [
    solid(),
  ],

  define: {
    __DESKTOP_SOLIDJS_ADDRESS__: JSON.stringify(`https://${localIp}:${vite_port}`),
    __LOCAL_IP__: JSON.stringify(localIp),
    __RTC_PORT__: JSON.stringify(PHONE_PORT),
    __DEV_HTTP_PORT__: JSON.stringify(vite_port),
    __WS_IP__: JSON.stringify('localhost'),
    __WS_PORT__: JSON.stringify(STREAMER_PORT),
  },
})
