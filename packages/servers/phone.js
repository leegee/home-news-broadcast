import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { ExpressPeerServer } from 'peer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PHONE_PORT = 9000;

const certPath = path.join(__dirname, '../certs/cert.pem');
const keyPath = path.join(__dirname, '../certs/key.pem');

function main() {
    const app = express();

    const solidDistPath = path.join(__dirname, '../../web/dist');

    app.use(express.static(solidDistPath));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/peerjs')) {
            return next();
        }
        res.sendFile(path.join(solidDistPath, 'index.html'));
    });

    const server = https.createServer({
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    }, app);

    app.use('/', ExpressPeerServer(server, {
        debug: true,
        path: '/',
    }));

    server.listen(PHONE_PORT, () => {
        console.log(`HTTPS WebRTC & SolidJS Server listening for PeerJS on port ${PHONE_PORT}`);
    });
}

// Run the server if this file is called directly
if (process.argv[1] === __filename) {
    main();
}

export default main;
