import styles from './BroadcastScreen.module.scss';
import { createEffect, createSignal, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner.tsx';
import CaptureControls from '../components/CaptureControls.tsx';
import { setupQRCodeFlow } from '../lib/qr2phone2stream.ts';
import { isYoutubeUrl } from '../lib/youtube.ts';
import {
    history,
    mediaStream,
    setMediaStream,
    setQrCode,
    setStreamSource,
    streamSource,
    videoOrImageSource,
    setVideoOrImageSource,
    selectedKey,
    STREAM_TYPES,
    setSelectedKey
} from '../lib/store.ts';
import { loadFile, getMimeType } from '../lib/file-store.ts';

let peerSetup = false;

export default function BroadcastScreen() {
    let videoRef: HTMLVideoElement | undefined;
    const [showPlayButton, setShowPlayButton] = createSignal(false);

    onMount(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    navigateHistory(-1);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    navigateHistory(1);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
    })

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
        const key = selectedKey();
        if (!key || !key.startsWith("local:")) return;

        const blob = await loadFile(key);
        const mime = await getMimeType(key);

        if (blob && mime) {
            const url = URL.createObjectURL(blob);

            const type = mime.startsWith("image/")
                ? STREAM_TYPES.IMAGE
                : mime.startsWith("video/") ? STREAM_TYPES.VIDEO : '';

            if (type) {
                console.log('Loaded local file from file-store:', key, type);
                setVideoOrImageSource({ url, type });
            } else {
                console.warn('Unrecognized mime type in Broadcast tab:', mime);
            }
        } else {
            console.warn("No blob or mime found for key in Broadcast tab:", key);
        }
    });

    createEffect(async () => {
        const { url, type } = videoOrImageSource();

        console.log('BroadcastScreen URL:', url, 'type:', type, ' - peerSetup =', peerSetup, "isYoutubeUrl", isYoutubeUrl(url));

        if (type !== STREAM_TYPES.LIVE_LOCAL) {
            peerSetup = false;
        }

        if (type === STREAM_TYPES.LIVE_LOCAL && !peerSetup) {
            peerSetup = true;
            setupQRCodeFlow();
        }
        else if (type === STREAM_TYPES.LIVE_EXTERNAL && !mediaStream()) {
            const localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setMediaStream(localMediaStream);
            setStreamSource('local');
        }
        else if (mediaStream() && streamSource() === STREAM_TYPES.LIVE_LOCAL) {
            mediaStream()!.getTracks().forEach(track => track.stop());
            setMediaStream(null);
            setStreamSource(null);
        }
    });

    onCleanup(() => {
        setVideoOrImageSource({ url: '', type: '' });
        setQrCode('');
        mediaStream()?.getTracks().forEach(t => t.stop());
        setMediaStream(null);
    });

    const navigateHistory = (direction: number) => {
        const keys = history();
        const current = selectedKey();
        if (keys.length === 0) return;

        let index = keys.indexOf(current);
        if (index === -1) {
            index = direction > 0 ? -1 : 0;
        }

        const newIndex = (index + direction + keys.length) % keys.length;

        setSelectedKey(keys[newIndex]);
    };

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

            <div class={styles["broadcast-pane"]}>

                <Show when={videoOrImageSource().url !== ''}>
                    <Switch fallback={<div>No matching stream type for: {videoOrImageSource().type}</div>}>
                        <Match when={videoOrImageSource().type === STREAM_TYPES.LIVE_LOCAL || videoOrImageSource().type === STREAM_TYPES.LIVE_EXTERNAL}>
                            <video class={styles['broadcast-video']} ref={el => (videoRef = el)} autoplay playsinline />
                            <Show when={showPlayButton()}>
                                <button onClick={tryPlayManually} class={styles["play-button"]}>Click to Start Playback</button>
                            </Show>
                        </Match>

                        <Match when={videoOrImageSource().type === STREAM_TYPES.IMAGE}>
                            <div class={styles['broadcast-image-wrapper']}>
                                <div
                                    class={styles['broadcast-image-background']}
                                    style={{ 'background-image': `url(${videoOrImageSource().url})` }}
                                />
                                <div class={styles['broadcast-image-foreground']}>
                                    <img
                                        class={styles['broadcast-image']}
                                        src={videoOrImageSource().url}
                                        alt=""
                                    />
                                </div>
                            </div>
                        </Match>

                        <Match when={videoOrImageSource().type === STREAM_TYPES.VIDEO || videoOrImageSource().type === STREAM_TYPES.YOUTUBE}>
                            <iframe
                                class={styles['broadcast-iframe']}
                                src={videoOrImageSource().url}
                                width="100%"
                                height="100%"
                                allow="autoplay; encrypted-media"
                            />
                        </Match>
                    </Switch>
                </Show>

                <div class={styles["lower-third"]}>
                    <Banner />
                    <Ticker />
                </div>
            </div>
        </main >
    );
}
