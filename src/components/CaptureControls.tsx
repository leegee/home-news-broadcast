import styles from './CaptureControls.module.scss';
import { createSignal, createEffect, onCleanup } from 'solid-js';
import { startScreenCapture, stopScreenCapture } from './screen-capture';
import { sendToRTMP } from './rtmp-stream';

export default function VideoControls() {
    const [screenVideoRef, setScreenVideoRef] = createSignal<HTMLVideoElement>();
    const [isCapturing, setIsCapturing] = createSignal(false);
    const [isVideoVisible, setIsVideoVisible] = createSignal(true);
    let mediaRecorder: MediaRecorder | undefined = undefined;

    const startCapture = async () => {
        if (!screenVideoRef) return;

        mediaRecorder = await startScreenCapture(screenVideoRef, (videoBlob: any) => {
            sendToRTMP(videoBlob);
        });

        setIsCapturing(true);
    };

    const toggleVideoVisibility = () => {
        setIsVideoVisible(prev => !prev);
    };

    createEffect(() => {
        if (screenVideoRef()) {
            screenVideoRef()!.style.display = isVideoVisible() ? 'block' : 'none';
        }
    });

    onCleanup(() => {
        if (mediaRecorder) stopScreenCapture(mediaRecorder);
    });

    return (
        <>
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

            <video
                ref={setScreenVideoRef}
                class="capture-playback-video"
                muted
            />
        </>
    );
}
