import styles from './BroadcastScreen.module.scss';
import { createEffect, onCleanup } from 'solid-js';
import { videoUrl } from '../lib/store.ts';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner.tsx';
import CaptureControls from '../components/CaptureControls.tsx';

export const LIVE_VIDEO_FLAG = 'LIVE';

export default function BroadcastScreen() {
    let videoRef: HTMLVideoElement | undefined;
    let stream: MediaStream | null = null;

    createEffect(() => {
        const url = videoUrl();
        console.log('video url changed', url);

        if (url === 'LIVE') {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((mediaStream) => {
                    stream = mediaStream;
                    if (videoRef) {
                        videoRef.srcObject = stream;
                        videoRef.play();
                    }
                })
                .catch((e) => {
                    console.error('Error accessing webcam/mic:', e);
                });
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
        }
    });

    onCleanup(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });

    return (
        <main class={styles['broadcast-screen-component']}>
            <CaptureControls />

            <div class={styles["large-video"]}>
                {videoUrl() === LIVE_VIDEO_FLAG ? (
                    <video
                        ref={el => (videoRef = el)}
                        autoplay
                        playsinline
                    // controls 
                    />
                ) : (
                    videoUrl() && (
                        <iframe
                            src={videoUrl()!}
                            width="100%"
                            height="100%"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                        ></iframe>
                    )
                )}

                <div class={styles["large-video-overlay"]}>
                    <Banner />
                    <Ticker />
                </div>
            </div>
        </main>
    );
}
