import styles from './CaptureControls.module.scss';
import { createSignal, onCleanup } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from '../lib/screen-capture';
import { initRTMPConnection, sendToRTMP } from '../lib/rtmp-stream';

export default function VideoControls() {
    const [isCapturing, setIsCapturing] = createSignal(false);
    const [isVideoVisible, setIsVideoVisible] = createSignal(true);
    let mediaRecorder: MediaRecorder | undefined = undefined;

    const startCapture = async () => {
        try {
            initRTMPConnection('ws://localhost:3000'); // todo switch to env var

            mediaRecorder = await startScreenCapture((videoBlob: any) => {
                sendToRTMP(videoBlob);
            });

            if (mediaRecorder) {
                setIsCapturing(true);
            }
        } catch (err: any) {
            console.error("Screen capture cancelled or failed:", err?.message || err);
        }
    };

    const toggleVideoVisibility = () => {
        setIsVideoVisible(prev => !prev);
    };

    onCleanup(() => {
        if (mediaRecorder) stopScreenCapture(mediaRecorder);
    });

    return (
        <>
            <li class={styles["capture-controls"]}>
                {!isCapturing() && (
                    <button onClick={startCapture}>Start Capture Broadcast</button>
                )}
                {isCapturing() && (
                    <button onClick={toggleVideoVisibility}>
                        {isVideoVisible() ? 'Hide Video Capture' : 'Show Video Capture'}
                    </button>
                )}
            </li>
        </>
    );
}

