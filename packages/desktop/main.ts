import os from 'os';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let peerJsServer;
let streamServer;

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

function createWindow() {
    app.commandLine.appendSwitch('ignore-certificate-errors');

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
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

app.whenReady().then(async () => {
    const peerJsUrl = pathToFileURL(path.resolve(__dirname, '../../servers/phone.js')).href;
    const streamServerUrl = pathToFileURL(path.resolve(__dirname, '../../servers/streamer.js')).href;

    const { default: startPeerJsServer } = await import(peerJsUrl);
    const { default: startStreamServer } = await import(streamServerUrl);

    peerJsServer = startPeerJsServer();
    streamServer = startStreamServer();
    createWindow();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            peerJsServer?.close?.();
            streamServer?.close?.();
            app.quit();
        }
    });
});

