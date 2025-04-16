// videoControls.js

import { startScreenCapture, stopScreenCapture } from './screenCapture.js';
import { sendToRTMP } from './rtmpStream.js';

export function setupVideoControls({ startCaptureButton, toggleCaptureButton, screenVideoElement }) {
    startCaptureButton.addEventListener('click', async () => {
        // This will start the screen capture
        const mediaRecorder = await startScreenCapture(screenVideoElement, (videoBlob) => {
            sendToRTMP(videoBlob);
        });

        toggleCaptureButton.style.display = 'block';
        startCaptureButton.style.display = 'none';

        setTimeout(() => {
            stopScreenCapture(mediaRecorder);
        }, 10000);
    });

    toggleCaptureButton.addEventListener('click', () => {
        screenVideoElement.style.display = screenVideoElement.style.display === 'none' ? 'block' : 'none';
        toggleCaptureButton.textContent = screenVideoElement.style.display === 'none' ? 'Show Video Capture' : 'Hide Video Capture';
    });
}
