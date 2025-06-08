// electron-api.d.ts
export { };

declare global {
    interface Window {
        electronAPI?: {
            openBroadcastWindow?: (url: string) => void;
            updateStreamUrl?: (url: string) => void;
        };
    }
}
