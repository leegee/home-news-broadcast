const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    updateStreamUrl: (url: string) => ipcRenderer.send('update-stream-url', url),
    openBroadcastWindow: (route: string) => ipcRenderer.send('open-broadcast-window', route)
});
