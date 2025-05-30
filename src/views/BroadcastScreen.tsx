import styles from './BroadcastScreen.module.scss';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { mediaStream, setMediaStream, setQrCode, setStreamSource, setVideoUrl, streamSource, videoUrl } from '../lib/store.ts';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner.tsx';
import CaptureControls from '../components/CaptureControls.tsx';
import { setupQRCodeFlow } from '../lib/qr2phone2stream.ts';

export const LOCAL_LIVE_VIDEO_FLAG = 'LIVE';
export const EXT_LIVE_VIDEO_FLAG = 'EXT';

let peerSetup = false;

export default function BroadcastScreen() {
    let videoRef: HTMLVideoElement | undefined;
    const [showPlayButton, setShowPlayButton] = createSignal(false);

    createEffect(() => {
        const stream = mediaStream();
        if (!videoRef || !stream) return;

        console.log('Set video as mediaStream changed', stream);
        videoRef.srcObject = stream;

        videoRef.onloadedmetadata = () => {
            videoRef?.play().catch((err) => {
                console.warn('Autoplay prevented or failed:', err);
                setShowPlayButton(true); // Require user interaction
            });
        };
    });

    createEffect(async () => {
        const url = videoUrl();
        console.log('URL change', url, ' - peerSetup =', peerSetup);
        if (url === EXT_LIVE_VIDEO_FLAG && !peerSetup) {
            peerSetup = true;
            setupQRCodeFlow();
        }
        else if (url === LOCAL_LIVE_VIDEO_FLAG && !mediaStream()) {
            const localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setMediaStream(localMediaStream);
            setStreamSource('local');
        }
        else if (mediaStream() && streamSource() === 'local') {
            mediaStream()!.getTracks().forEach(track => track.stop());
            setMediaStream(null);
            setStreamSource(null);
        }
    });

    onCleanup(() => {
        setVideoUrl('');
        setQrCode('');
        mediaStream()?.getTracks().forEach(t => t.stop());
        setMediaStream(null);
    });

    const tryPlayManually = () => {
        if (videoRef) {
            videoRef.play()
                .then(() => setShowPlayButton(false))
                .catch(err => console.warn('Manual play still failed:', err));
        }
    };

    return (
        <main class={styles['broadcast-screen-component']}>
            <CaptureControls />

            <div class={styles["large-video"]}>
                {(videoUrl() === LOCAL_LIVE_VIDEO_FLAG || videoUrl() === EXT_LIVE_VIDEO_FLAG)
                    ? (
                        <>
                            <video ref={el => (videoRef = el)} autoplay playsinline />

                            <Show when={showPlayButton()}>
                                <button
                                    onClick={tryPlayManually}
                                    class={styles["play-button"]}
                                >
                                    Click to Start Playback
                                </button>
                            </Show>
                        </>
                    )
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
