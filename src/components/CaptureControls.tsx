import styles from './CaptureControls.module.scss';
import { createSignal, onCleanup } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from './screen-capture';
import { initRTMPConnection, sendToRTMP } from './rtmp-stream';

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
            setIsCapturing(true);
        } catch (err) {
            console.error("Failed to start screen capture:", err);
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

