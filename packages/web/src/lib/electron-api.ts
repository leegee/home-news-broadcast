export function updateStreamUrl(newUrl: string) {
    if (window?.electronAPI?.updateStreamUrl) {
        window.electronAPI.updateStreamUrl(newUrl);
    } else {
        console.warn('Electron API not available');
    }
}
