import os from 'os';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

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

const localIp = getLocalNetworkAddress();
const port = 5173;

export default defineConfig({
  server: {
    port,
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
  },
  plugins: [solid(),],
  define: {
    __LOCAL_WEBRTC_ADDRESS__: JSON.stringify(`https://${localIp}:${port}`),
    __LOCAL_IP__: JSON.stringify(localIp),
    __RTC_PORT__: JSON.stringify(9000),
    __WS_PORT__: JSON.stringify(localIp),
    __WS_IP__: JSON.stringify(3000)
  },
})
