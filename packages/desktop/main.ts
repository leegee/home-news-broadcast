import os from 'os';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { fork } from 'child_process';
import { spawn } from 'child_process';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let peerJsProcess: ReturnType<typeof spawnServer>;
let streamServerProcess: ReturnType<typeof forkServer>;

function getLocalNetworkAddress() {
    const nets = os.networkInterfaces();
    if (nets) {
        for (const name of Object.keys(nets)) {
            if (nets[name]) {
                for (const net of nets[name]!) {
                    if (net.family === 'IPv4' && !net.internal) {
                        return net.address;
                    }
                }
            }
        }
    }
    return 'localhost';
}

function createWindow() {
    app.commandLine.appendSwitch('ignore-certificate-errors');

    let preloadPath = isDev ? path.join(__dirname, 'preload.js') : path.join(__dirname, 'preload.js');

    // On Windows, remove leading slash if path looks like '\C:\...'
    if (process.platform === 'win32' && preloadPath.match(/^\\[A-Z]:\\/i)) {
        preloadPath = preloadPath.slice(1);
    }
    console.log('Preload script absolute path:', preloadPath);

    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: preloadPath,
        },
    });

    win.webContents.openDevTools({ mode: 'detach' });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Page failed to load:', errorCode, errorDescription, event);
    });

    if (process.env.NODE_ENV === 'development') {
        const controlWindowUrl = `https://${getLocalNetworkAddress()}:5173`;
        console.log('Running in dev mode at', controlWindowUrl);
        win.loadURL(controlWindowUrl);
    } else {
        const url = path.join(__dirname, '..', '..', 'web/dist/index.html');
        console.log('Running in production mode at', url);
        win.loadFile(url);
    }
}

function forkServer(scriptRelativePath: string, args = []) {
    const scriptPath = path.resolve(__dirname, scriptRelativePath);
    console.log('Forking', scriptRelativePath, 'at', scriptPath);

    const child = fork(scriptPath, args, {
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'], // important for IPC
    });

    if (child) {
        child.stdout?.on('data', (data) => {
            console.log(`[${scriptRelativePath} stdout]: ${data}`);
        });

        child.stderr?.on('data', (data) => {
            console.error(`[${scriptRelativePath} stderr]: ${data}`);
        });

        child.on('exit', (code, signal) => {
            console.log(`[${scriptRelativePath}] exited with code ${code} and signal ${signal}`);
        });
    }

    return child;
}

function spawnServer(scriptRelativePath: string, args = []) {
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

ipcMain.on('update-stream-url', (_event, newUrl) => {
    if (streamServerProcess && streamServerProcess.connected) {
        streamServerProcess.send({ type: 'updateStreamUrl', url: newUrl });
    }
});

app.whenReady().then(() => {
    peerJsProcess = spawnServer('../../servers/phone.js');
    // streamServerProcess = spawnServer('../../servers/streamer.js');
    streamServerProcess = forkServer('../../servers/streamer.js');

    createWindow();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            peerJsProcess?.kill();
            streamServerProcess?.kill();
            app.quit();
        }
    });
});
