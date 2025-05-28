const DEFAULT_EMIT_RATE = 250;

export async function startScreenCapture(mediaRecorderCallback: Function, emitRate: number = DEFAULT_EMIT_RATE) {
    try {
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
