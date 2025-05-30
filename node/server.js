import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { ExpressPeerServer } from 'peer';

const app = express();

const certPath = path.resolve('./certs/cert.pem');
const keyPath = path.resolve('./certs/key.pem');

const server = https.createServer({
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
}, app);

app.use('/', ExpressPeerServer(server, {
    debug: true,
    path: '/',
}));

server.listen(9000, () => {
    console.log('HTTPS Server listening on port 9000');
});
