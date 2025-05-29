import { execSync } from 'child_process';
import { networkInterfaces } from 'os';
import { mkdirSync } from 'fs';
import { join } from 'path';

function getLocalIPv4() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    // Fallback to localhost
    return '127.0.0.1';
}

function makeCerts() {
    const ip = getLocalIPv4();
    console.log(`Detected local IP: ${ip}`);

    const setupDir = join(process.cwd(), 'setup');
    mkdirSync(setupDir, { recursive: true });

    const certFile = join(setupDir, 'cert.pem');
    const keyFile = join(setupDir, 'key.pem');

    const cmd = `mkcert -cert-file "${certFile}" -key-file "${keyFile}" ${ip} localhost 127.0.0.1`;
    console.log(`Running: ${cmd}`);

    try {
        const output = execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error('Failed to run mkcert:', e);
        process.exit(1);
    }

    console.log(`Certificates generated in ${setupDir}`);
}

makeCerts();
