export function stopScreenCapture(mediaRecorder: MediaRecorder) {
    mediaRecorder.stop();
}

export async function startScreenCapture(mediaRecorderCallback: Function) {
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

        // Emit data every 250ms — experiment with this
        mediaRecorder.start(250);

        return mediaRecorder;
    } catch (err) {
        console.error('Error during screen capture:', err);
    }
}
