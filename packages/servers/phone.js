import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { ExpressPeerServer } from 'peer';

const certPath = path.resolve('./packages/certs/cert.pem');
const keyPath = path.resolve('./packages/certs/key.pem');

function main() {
    const app = express();

    const server = https.createServer({
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    }, app);

    app.use('/', ExpressPeerServer(server, {
        debug: true,
        path: '/',
    }));

    server.listen(9000, () => { // __RTC_PORT__
        console.log('HTTPS Server listening on port 9000');
    });
}

// Run the server if this file is called directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[1] === __filename) {
    main();
}

export default main;
