import styles from './BroadcastScreen.module.scss';
import { createEffect, createSignal, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner.tsx';
import CaptureControls from '../components/CaptureControls.tsx';
import { setupQRCodeFlow } from '../lib/qr2phone2stream.ts';
import { isYoutubeUrl } from '../lib/youtube.ts';
import { changeMedia, onMediaChange } from '../lib/broadcast-media';
import {
    history,
    mediaStream,
    setMediaStream,
    setQrCode,
    setStreamSource,
    streamSource,
    selectedKey,
    STREAM_TYPES,
    setSelectedKey
} from '../lib/store.ts';
import { loadFile, getMimeType } from '../lib/file-store.ts';

let peerSetup = false;

export default function BroadcastScreen() {
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const [showPlayButton, setShowPlayButton] = createSignal(false);
    const [mediaSource, setMediaSource] = createSignal<{ url: string; type: string }>({ url: '', type: STREAM_TYPES.NONE });

    createEffect(() => {
        const stream = mediaStream();
        if (!videoRef() || !stream) return;

        console.log('Set video as mediaStream changed', stream);
        videoRef()!.srcObject = stream;

        videoRef()!.onloadedmetadata = () => {
            videoRef()!.play().catch((err) => {
                console.warn('Autoplay prevented or failed:', err);
                setShowPlayButton(true);
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
                changeMedia({ url, type });
            } else {
                console.warn('Unrecognized mime type in Broadcast tab:', mime);
            }
        } else {
            console.warn("No blob or mime found for key in Broadcast tab:", key);
        }
    });

    onMount(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    navigateHistory(-1);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    navigateHistory(1);
                    break;
                case 'Space':
                    event.preventDefault();
                    toggleVideoPlayback();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        const cleanupBroadcastChannel = onMediaChange(async ({ url, type }) => {
            console.log('Media changed to:', url, 'with type:', type);
            console.log('BroadcastScreen Media changed: url =', url, ', type =', type, ', peerSetup =', peerSetup, ", isYoutubeUrl =", isYoutubeUrl(url));

            setMediaSource({ url, type });

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
            cleanupBroadcastChannel();
            window.removeEventListener('keydown', handleKeyDown);
        });
    });

    onCleanup(() => {
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

    const toggleVideoPlayback = () => {
        if (videoRef() === null) return;

        if (videoRef()!.paused) {
            videoRef()!.play().catch(err => {
                console.warn('Play failed:', err);
            });
        } else {
            videoRef()!.pause();
        }
    };

    const tryPlayManually = () => {
        if (videoRef) {
            videoRef()!.play()
                .then(() => setShowPlayButton(false))
                .catch(err => console.warn('Manual play still failed:', err));
        }
    };

    return (
        <main class={styles['broadcast-screen-component']} >
            <CaptureControls />

            <div class={`${styles['broadcast-pane']
                } ${mediaSource().url === '' ? styles['without-media'] : ''
                }`
            }>

                <Show when={mediaSource().url !== ''}>
                    <Switch fallback={<div>No matching stream type for: {mediaSource().type}</div>}>
                        <Match when={mediaSource().type === STREAM_TYPES.LIVE_LOCAL || mediaSource().type === STREAM_TYPES.LIVE_EXTERNAL}>
                            <video class={styles['broadcast-video']}
                                ref={el => setVideoRef(el)}
                                autoplay playsinline
                            />
                            <Show when={showPlayButton()}>
                                <button onClick={tryPlayManually} class={styles["play-button"]}>Click to Start Playback</button>
                            </Show>
                        </Match>

                        <Match when={mediaSource().type === STREAM_TYPES.VIDEO}>
                            <video class={styles['broadcast-video']}
                                ref={el => setVideoRef(el)}
                                src={mediaSource().url}
                                autoplay playsinline controls
                            />
                        </Match>

                        <Match when={mediaSource().type === STREAM_TYPES.IMAGE}>
                            <div class={styles['broadcast-image-wrapper']}>
                                <div class={styles['broadcast-image-background']}
                                    style={{ 'background-image': `url(${mediaSource().url})` }}
                                />
                                <div class={styles['broadcast-image-foreground']}>
                                    <img class={styles['broadcast-image']}
                                        src={mediaSource().url}
                                        alt=""
                                    />
                                </div>
                            </div>
                        </Match>

                        <Match when={mediaSource().type === STREAM_TYPES.YOUTUBE}>
                            <iframe
                                class={styles['broadcast-iframe']}
                                src={mediaSource().url}
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
