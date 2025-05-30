import styles from './BroadcastScreen.module.scss';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { setMediaStream, setQrCode, setVideoUrl, videoUrl } from '../lib/store.ts';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner.tsx';
import CaptureControls from '../components/CaptureControls.tsx';
import { setupQRCodeFlow } from '../lib/generate-qr.ts';

export const LOCAL_LIVE_VIDEO_FLAG = 'LIVE';
export const EXT_LIVE_VIDEO_FLAG = 'EXT';

export default function BroadcastScreen() {
    const [stream, setStream] = createSignal<MediaStream | null>(null);
    let videoRef: HTMLVideoElement | undefined;

    createEffect(() => {
        const url = videoUrl();
        console.log('video url changed', url);

        if (url === EXT_LIVE_VIDEO_FLAG) {
            setupQRCodeFlow();
        }
        else if (url === LOCAL_LIVE_VIDEO_FLAG) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((mediaStream) => {
                    setStream(mediaStream);
                    if (videoRef) {
                        videoRef.srcObject = mediaStream;
                        videoRef.play();
                    }
                })
                .catch((e) => {
                    console.error('Error accessing webcam/mic:', e);
                });
        }
        else {
            if (stream() !== null) {
                stream()!.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    });

    onCleanup(() => {
        // setVideoUrl('');
        setQrCode('');
        setMediaStream(null);
        stream()?.getTracks().forEach(t => t.stop());
    });

    return (
        <main class={styles['broadcast-screen-component']}>
            <CaptureControls />

            <div class={styles["large-video"]}>
                {videoUrl() === LOCAL_LIVE_VIDEO_FLAG || EXT_LIVE_VIDEO_FLAG
                    ? (<video ref={el => (videoRef = el)} autoplay playsinline />)
                    : (
                        <Show when={videoUrl() !== ''}>
                            <iframe
                                src={videoUrl()!}
                                width="100%"
                                height="100%"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                        </Show>
                    )
                }

                <div class={styles["large-video-overlay"]}>
                    <Banner />
                    <Ticker />
                </div>
            </div>
        </main>
    );
}
