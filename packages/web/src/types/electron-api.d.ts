// electron-api.d.ts
export { };

declare global {
    interface Window {
        electronAPI?: {
            openWindow?: (url: string) => void;
            updateStreamUrl?: (url: string) => void;
        };
    }
}
