const { contextBridge, ipcRenderer } = require('electron');
// import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    updateStreamUrl: (url: string) => ipcRenderer.send('update-stream-url', url)
});
