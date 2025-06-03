import { windowTitle } from "../views/BroadcastScreen";

const DEFAULT_EMIT_RATE = 150;

export async function startScreenCapture(mediaRecorderCallback: Function, emitRate: number = DEFAULT_EMIT_RATE) {
    try {
        alert(`You will be asked to choose which window or tab to share.\n\nChoose "${windowTitle}"`);

        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
        });

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp8,opus'
        });

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
                mediaRecorderCallback(event.data);
            }
        };

        mediaRecorder.start(emitRate);

        return mediaRecorder;
    } catch (err) {
        console.error('Error during screen capture:', err);
    }
}

export function stopScreenCapture(mediaRecorder: MediaRecorder) {
    mediaRecorder.stop();
}
