// import { contextBridge, ipcRenderer } from 'electron';

// contextBridge.exposeInMainWorld('myAPI', {
//     send: (channel: string, data: any) => ipcRenderer.send(channel, data),
//     on: (channel: string, callback: (...args: any[]) => void) => {
//         ipcRenderer.on(channel, (event, ...args) => callback(...args));
//     },
// })
//  ;