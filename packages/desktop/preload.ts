const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    updateStreamUrl: (url: string) => ipcRenderer.send('update-stream-url', url),
    openWindow: (route: string) => ipcRenderer.send('open-window', route)
});
