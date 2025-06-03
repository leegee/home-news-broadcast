import styles from './CaptureControls.module.scss';
import { onCleanup, onMount, Show } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from '../lib/screen-capture';
import { initRTMPConnection, sendToRTMP } from '../lib/rtmp-stream';
import { isCapturing, setIsCapturing, STREAM_TYPES } from '../lib/stores/ui';
import { onMediaChange } from '../lib/inter-tab-comms';

export default function CaptureControls() {
    let mediaRecorderRef: MediaRecorder | undefined;

    const startCapture = async () => {
        try {
            initRTMPConnection(`ws://${__WS_IP__}:${__WS_PORT__}`);

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

    onMount(() => {
        const cleanupOnMediaChange = onMediaChange(async ({ url, type }) => {
            if (type === STREAM_TYPES.NONE) {
                stopCapture();
            }
        });

        onCleanup(cleanupOnMediaChange);
    })

    onCleanup(stopCapture);

    return (
        <Show when={!isCapturing()}>
            <button
                title="Begins the screen capture for broadcast"
                class={styles["start-capture"]}
                onClick={startCapture}
            >Start Capture Broadcast</button>
        </Show>
    );
}
