import styles from './CaptureControls.module.scss';
import { createSignal, onCleanup, Show } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from '../lib/screen-capture';
import { initRTMPConnection, sendToRTMP } from '../lib/rtmp-stream';

export default function CaptureControls() {
    const [isCapturing, setIsCapturing] = createSignal(false);
    let mediaRecorderRef: MediaRecorder | undefined;

    const startCapture = async () => {
        try {
            initRTMPConnection(`ws://${__WS_IP__}:${__WS_PORT__}`); // TODO: move to env var

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

    const stopCapture = () => {
        if (mediaRecorderRef) {
            stopScreenCapture(mediaRecorderRef);
            mediaRecorderRef = undefined;
            setIsCapturing(false);
        }
    };

    onCleanup(stopCapture);

    return (
        <Show when={!isCapturing()}>
            <button class={styles["start-capture"]} onClick={startCapture}>Start Capture Broadcast</button>
        </Show>
    );
}
