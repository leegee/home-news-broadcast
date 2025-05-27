// CaptureControls.tsx
import { createSignal, createEffect, onCleanup } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from './screen-capture';
import { sendToRTMP } from './rtmp-stream';
import styles from './CaptureControls.module.scss';

type Props = {
    screenVideoRef: HTMLVideoElement | undefined;
};

export default function VideoControls(props: Props) {
    const [isCapturing, setIsCapturing] = createSignal(false);
    const [isVideoVisible, setIsVideoVisible] = createSignal(true);
    let mediaRecorder: MediaRecorder | undefined = undefined;

    const startCapture = async () => {
        if (!props.screenVideoRef) return;

        mediaRecorder = await startScreenCapture(props.screenVideoRef, (videoBlob: any) => {
            sendToRTMP(videoBlob);
        });

        setIsCapturing(true);
    };

    const toggleVideoVisibility = () => {
        setIsVideoVisible(prev => !prev);
    };

    createEffect(() => {
        if (props.screenVideoRef) {
            props.screenVideoRef.style.display = isVideoVisible() ? 'block' : 'none';
        }
    });

    onCleanup(() => {
        if (mediaRecorder) stopScreenCapture(mediaRecorder);
    });

    return (
        <div class={styles["capture-controls"]}>
            {!isCapturing() && (
                <button onClick={startCapture}>Start Capture Broadcast</button>
            )}
            {isCapturing() && (
                <button onClick={toggleVideoVisibility}>
                    {isVideoVisible() ? 'Hide Video Capture' : 'Show Video Capture'}
                </button>
            )}
        </div>
    );
}
