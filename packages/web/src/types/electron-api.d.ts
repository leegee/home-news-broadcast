// electron-api.d.ts
export { };

declare global {
    interface Window {
        electronAPI?: {
            updateStreamUrl?: (url: string) => void;
            // Add other methods as needed
        };
    }
}
