import os from 'os';
import path from 'path';
import { app, BrowserWindow, ipcMain, session } from 'electron';
import { fork } from 'child_process';
import { spawn } from 'child_process';

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

async function main() {
    const serversPath = path.resolve(__dirname, '../../servers');
    const { PHONE_PORT } = await import(path.join(serversPath, 'phone.js'));
    const { STREAMER_PORT } = await import(path.join(serversPath, 'streamer.js'));

    const isDev = !app.isPackaged;
    let peerJsProcess: ReturnType<typeof spawnServer>;
    let streamServerProcess: ReturnType<typeof forkServer>;
    let broadcastWindow: BrowserWindow;
    let controlWindow: BrowserWindow;

    const url = process.env.NODE_ENV === 'development'
        ? `https://${getLocalNetworkAddress()}:5173`
        : path.join(__dirname, '..', '..', 'web/dist/index.html');

    const ip = getLocalNetworkAddress();
    const wsUrls = `ws://${ip}:${PHONE_PORT} wss://${ip}:${PHONE_PORT}`;
    const streamUrl = `https://localhost:${STREAMER_PORT}`;

    const cspHeader = `
  default-src 'self'; 
  media-src 'self' data: blob:; 
  img-src 'self' data: blob:; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  connect-src 'self' ${wsUrls} ${streamUrl};
`.replace(/\s+/g, ' ').trim();

    function openBroadcastWindow(route: string) {
        if (broadcastWindow && !broadcastWindow.isDestroyed()) {
            // broadcastWindow.focus();
            return;
        }

        broadcastWindow = new BrowserWindow({
            width: 1024,
            height: 576,
            autoHideMenuBar: true,
            fullscreen: true,
            show: false,               // create hidden; we’ll reveal later
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        broadcastWindow.on('closed', () => {
            console.log('Broadcast window closed');
            if (controlWindow && !controlWindow.isDestroyed()) {
                openBroadcastWindow(route);
            }
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('load url  in dev mode', url + route)
            broadcastWindow.loadURL(url + route);
        } else {
            console.log('load  file  in prod mode', url + route)
            broadcastWindow.loadFile(url).then(() => {
                broadcastWindow.webContents.executeJavaScript(`location.hash = "${route}"`);
            });
        }

        broadcastWindow.once('ready-to-show', () => {
            broadcastWindow.showInactive(); // Shows behind the current active window
            controlWindow.focus();          // Re-focus parent
        });
    }
    function createWControlWindow() {
        app.commandLine.appendSwitch('ignore-certificate-errors');

        let preloadPath = isDev ? path.join(__dirname, 'preload.js') : path.join(__dirname, 'preload.js');

        if (process.platform === 'win32' && preloadPath.match(/^\\[A-Z]:\\/i)) {
            preloadPath = preloadPath.slice(1);
        }
        console.log('Preload script absolute path:', preloadPath);

        controlWindow = new BrowserWindow({
            width: 1000,
            height: 800,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: true,
                preload: preloadPath,
            },
        });

        // win.webContents.openDevTools({ mode: 'detach' });

        controlWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Page failed to load:', errorCode, errorDescription, event);
        });

        controlWindow.on('closed', () => {
            broadcastWindow?.close();
        });

        if (process.env.NODE_ENV === 'development') {
            controlWindow.loadURL(url);
        } else {
            controlWindow.loadFile(url);
        }
    }

    ipcMain.on('open-broadcast-window', (_event, route) => {
        if (route.match('phone')) {
            console.warn('***** Request for phone window should be made to the phone server')
        } else {
            openBroadcastWindow(route);
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

        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const headers = details.responseHeaders || {};
            headers['Content-Security-Policy'] = [cspHeader];
            callback({ responseHeaders: headers });
        });

        createWControlWindow();
        openBroadcastWindow('#output');

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                peerJsProcess?.kill();
                streamServerProcess?.kill();
                app.quit();
            }
        });
    });
}

main();
