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

const url = process.env.NODE_ENV === 'development'
    ? `https://${getLocalNetworkAddress()}:5173`
    : path.join(__dirname, '..', '..', 'web/dist/index.html');

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

function createWControlWindow() {
    app.commandLine.appendSwitch('ignore-certificate-errors');

    let preloadPath = isDev ? path.join(__dirname, 'preload.js') : path.join(__dirname, 'preload.js');

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

    // win.webContents.openDevTools({ mode: 'detach' });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Page failed to load:', errorCode, errorDescription, event);
    });

    if (process.env.NODE_ENV === 'development') {
        win.loadURL(url);
    } else {
        win.loadFile(url);
    }
}

// @ts-ignore: for now
function createWBroadcastWindow() {
    app.commandLine.appendSwitch('ignore-certificate-errors');

    let preloadPath = isDev ? path.join(__dirname, 'preload.js') : path.join(__dirname, 'preload.js');

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
        win.loadURL(url);
    } else {
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

ipcMain.on('open-window', (event, route) => {
    console.log(event);
    const newWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // newWin.loadURL(`file://${__dirname}/index.html${route}`);
    if (process.env.NODE_ENV === 'development') {
        console.log('load url  in dev mode', url + route)
        newWin.loadURL(url + route);
    } else {
        console.log('load  file  in prod mode', url + route)
        newWin.loadFile(url).then(() => {
            newWin.webContents.executeJavaScript(`location.hash = "${route}"`);
        });
    }
});

ipcMain.on('update-stream-url', (_event, newUrl) => {
    if (streamServerProcess && streamServerProcess.connected) {
        streamServerProcess.send({ type: 'updateStreamUrl', url: newUrl });
    }
});

app.whenReady().then(() => {
    peerJsProcess = spawnServer('../../servers/phone.js');
    streamServerProcess = forkServer('../../servers/streamer.js');

    createWControlWindow();
    // createWBroadcastWindow();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            peerJsProcess?.kill();
            streamServerProcess?.kill();
            app.quit();
        }
    });
});
