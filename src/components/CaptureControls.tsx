import { createSignal, onCleanup } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from '../lib/screen-capture';
import { initRTMPConnection, sendToRTMP } from '../lib/rtmp-stream';

export default function CaptureControls() {
    const [isCapturing, setIsCapturing] = createSignal(false);
    let mediaRecorderRef: MediaRecorder | undefined;

    const startCapture = async () => {
        try {
            initRTMPConnection('ws://localhost:3000'); // TODO: move to env var

            const recorder = await startScreenCapture((videoBlob: Blob) => {
                sendToRTMP(videoBlob);
            });

            if (recorder) {
                mediaRecorderRef = recorder;
                setIsCapturing(true);
            }
        } catch (err: any) {
            console.error("Screen capture cancelled or failed:", err?.message || err);
        }
    };

    onCleanup(() => {
        if (mediaRecorderRef) {
            stopScreenCapture(mediaRecorderRef);
        }
    });

    return !isCapturing() ? (
        <button class="start-capture" onClick={startCapture}>Start Capture Broadcast</button>
    ) : null;
}
