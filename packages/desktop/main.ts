import os from 'os';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let peerJsProcess;
let streamServerProcess;

function getLocalNetworkAddress() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

function createWindow() {
    app.commandLine.appendSwitch('ignore-certificate-errors');

    let preloadPath = path.join(__dirname, 'preload.js');

    // On Windows, remove leading slash if path looks like '\C:\...'
    if (process.platform === 'win32' && preloadPath.match(/^\\[A-Z]:\\/i)) {
        preloadPath = preloadPath.slice(1);
    }
    console.log('Preload script absolute path:', preloadPath);

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: false,
            nodeIntegration: true,
        },
    });

    win.webContents.openDevTools({ mode: 'detach' });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Page failed to load:', errorCode, errorDescription);
    });

    if (process.env.NODE_ENV === 'development') {
        const url = `https://${getLocalNetworkAddress()}:5173`;
        console.log('Open', url);
        win.loadURL(url);
    } else {
        win.loadFile(path.join(__dirname, '../web/dist/index.html'));
    }
}

function spawnServer(scriptRelativePath, args = []) {
    const scriptPath = path.resolve(__dirname, scriptRelativePath);
    console.log('Spawn', scriptRelativePath, 'ie', scriptPath);

    const child = spawn(process.execPath, [scriptPath, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
        cwd: path.dirname(scriptPath),
        windowsHide: true,
    });

    child.stdout.on('data', (data) => {
        console.log(`[${path.basename(scriptRelativePath)} stdout]: ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[${path.basename(scriptRelativePath)} stderr]: ${data.toString()}`);
    });

    child.on('exit', (code, signal) => {
        console.log(`[${path.basename(scriptRelativePath)} exited] code: ${code} signal: ${signal}`);
    });

    return child;
}

app.whenReady().then(() => {
    peerJsProcess = spawnServer('../../servers/phone.js');
    streamServerProcess = spawnServer('../../servers/streamer.js');

    createWindow();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            peerJsProcess?.kill();
            streamServerProcess?.kill();
            app.quit();
        }
    });
});
