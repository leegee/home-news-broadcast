let ws: WebSocket | null = null;

export function initRTMPConnection(serverUrl: string) {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(serverUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        console.log('WebSocket connected to RTMP backend');
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
        console.log('WebSocket closed');
    };
}

export function sendToRTMP(blob: Blob) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, skipping blob');
        return;
    }

    ws.send(blob);
}
