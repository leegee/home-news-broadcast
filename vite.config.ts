import os from 'os';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite'
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

function mySignalingPlugin(): Plugin {
  let latestAnswer: any = null;

  return {
    name: 'my-vite-signaling-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/answer') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              latestAnswer = JSON.parse(body).answer;
              console.log('Received answer:', latestAnswer);
              res.statusCode = 200;
              res.end('OK');
            });
            return;
          }

          if (req.method === 'GET') {
            if (latestAnswer) {
              console.log('GET server latest answer:', latestAnswer);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ answer: latestAnswer }));
            return;
          }
        }
        next();
      });
    },
  };
}


export default defineConfig({
  server: {
    port,
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
  },
  plugins: [solid(), mySignalingPlugin(),],
  define: {
    __LOCAL_ADDRESS__: JSON.stringify(`https://${localIp}:${port}`),
  },
})
