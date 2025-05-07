export async function startScreenCapture(streamElement, mediaRecorderCallback) {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
        });

        // Show the screen capture in the video element
        streamElement.srcObject = stream;

        const mediaRecorder = new MediaRecorder(stream);
        let chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            mediaRecorderCallback(videoBlob);
        };

        mediaRecorder.start();
        return mediaRecorder;
    } catch (err) {
        console.error('Error during screen capture:', err);
    }
}

export function stopScreenCapture(mediaRecorder) {
    mediaRecorder.stop();
}
