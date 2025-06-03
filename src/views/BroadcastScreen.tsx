import styles from './BroadcastScreen.module.scss';
import { createEffect, createSignal, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { loadFile, getMimeType } from '../lib/stores/file-store.ts';
import { setupQRCodeFlow } from '../lib/qr2phone2stream';
import { MediaChangeParams, onMediaChange } from '../lib/inter-tab-comms.ts';
import {
    mediaStream,
    setMediaStream,
    setQrCode,
    setStreamSource,
    streamSource,
    STREAM_TYPES,
    setError,
} from '../lib/stores/ui.ts';
import { playlist, selectedKey, setSelectedKey } from '../lib/stores/playlist.ts';

let peerSetup = false;
let previousObjectUrl: string | null = null;

export const windowTitle = "Broadcast Window";

export default function BroadcastScreen() {
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const [showPlayButton, setShowPlayButton] = createSignal(false);
    const [mediaSource, setMediaSource] = createSignal<{ url: string; type: string }>({ url: '', type: STREAM_TYPES.NONE });

    let triedAutoPlay = false;

    createEffect(() => {
        const stream = mediaStream();
        const video = videoRef();

        if (!stream) {
            if (video) {
                video.pause();
                video.srcObject = null;
            }
            return;
        }

        if (!video) return;

        console.log('Set video as mediaStream changed', stream);
        video.srcObject = stream;

        if (stream === null) {
            console.debug('null stream')
            setMediaSource({ url: '', type: STREAM_TYPES.NONE });
        }

        video.onloadedmetadata = () => {
            if (!triedAutoPlay && mediaStream()) {
                triedAutoPlay = true;
                video.play().catch((err) => {
                    console.warn('Autoplay prevented or failed:', err);
                    setShowPlayButton(true);
                });
            }
        };
    });

    createEffect(() => {
        const stream = mediaStream();
        if (stream) {
            console.log('Stream tracks:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
        }
    });

    createEffect(async () => {
        const key = selectedKey();
        if (!key || !key.startsWith("local:")) return;

        const blob = await loadFile(key);
        const mime = await getMimeType(key);

        // Cleanup old ObjectURL if it exists
        if (previousObjectUrl) {
            URL.revokeObjectURL(previousObjectUrl);
            previousObjectUrl = null;
        }

        if (blob && mime) {
            const url = URL.createObjectURL(blob);
            previousObjectUrl = url;

            const type = mime.startsWith("image/")
                ? STREAM_TYPES.IMAGE
                : mime.startsWith("video/") ? STREAM_TYPES.VIDEO : '';

            if (type) {
                console.log('Loaded local file from file-store:', key, type);
                setMedia({ url, type });
            } else {
                console.warn('Unrecognized mime type in Broadcast tab:', mime);
            }
        } else {
            console.warn("No blob or mime found for key in Broadcast tab:", key);
        }
    });

    createEffect(() => {
        console.log('[DEBUG] mediaSource:', mediaSource());
        console.log('[DEBUG] mediaStream:', mediaStream());
    });

    onMount(() => {
        document.title = windowTitle;

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    navigatePlaylist(-1);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    navigatePlaylist(1);
                    break;
                case 'Space':
                    event.preventDefault();
                    toggleVideoPlayback();
                    break;
                case 'Escape':
                    escape();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        const cleanupOnMediaChange = onMediaChange(async ({ url, type }) => {
            setMedia({ url, type });
        });

        onCleanup(() => {
            cleanupOnMediaChange();
            window.removeEventListener('keydown', handleKeyDown);
        });
    });

    onCleanup(() => {
        setQrCode('');
        mediaStream()?.getTracks().forEach(t => t.stop());
        setMediaStream(null);
    });

    const setMedia = async ({ url, type }: MediaChangeParams) => {
        console.log('Media changed to:', url, 'with type:', type);
        console.log('Playlist', playlist());
        triedAutoPlay = false;
        setShowPlayButton(false);
        setMediaSource({ url, type });

        // Stop and reset previous local stream if applicable
        if (mediaStream() && streamSource() === STREAM_TYPES.LIVE_LOCAL) {
            mediaStream()!.getTracks().forEach(track => track.stop());
            setMediaStream(null);
            setStreamSource(null);
            setQrCode('');
        }

        // Handle each stream type individually
        switch (type) {
            case STREAM_TYPES.LIVE_LOCAL: {
                try {
                    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setMediaStream(localStream);
                    setStreamSource(STREAM_TYPES.LIVE_LOCAL);
                } catch (err) {
                    console.error('Failed to get local media stream:', err);
                    setError('Camera/mic access failed.');
                }
                break;
            }

            case STREAM_TYPES.LIVE_EXTERNAL: {
                if (!peerSetup) {
                    peerSetup = true;
                    setupQRCodeFlow();
                }
                break;
            }

            case STREAM_TYPES.IMAGE:
            case STREAM_TYPES.VIDEO:
            case STREAM_TYPES.YOUTUBE: {
                setMediaStream(null);
                setStreamSource(type);
                setQrCode('');
                break;
            }

            case STREAM_TYPES.NONE:
            default: {
                setMediaStream(null);
                setStreamSource(null);
                setQrCode('');
                break;
            }
        }
    };

    const navigatePlaylist = (direction: number) => {
        const items = playlist();
        const currentKey = selectedKey();
        if (items.length === 0) return;

        let index = items.findIndex(item => item.key === currentKey);
        if (index === -1) {
            index = direction > 0 ? -1 : 0;
        }

        const newIndex = (index + direction + items.length) % items.length;
        setSelectedKey(items[newIndex].key);
    };

    const escape = () => {
        const video = videoRef();
        if (video && !video.paused) {
            video.pause();
        }
        setMedia({ url: '', type: STREAM_TYPES.NONE });
        setError('');
    };

    const toggleVideoPlayback = () => {
        const video = videoRef();
        if (!video) return;

        if (video.paused) {
            video.play().catch(err => {
                console.warn('Play failed:', err);
            });
        } else {
            video.pause();
        }
    };

    const tryPlayManually = () => {
        const video = videoRef();
        if (!video) return;

        video.play()
            .then(() => setShowPlayButton(false))
            .catch(err => console.warn('Manual play still failed:', err));
    };

    return (
        <main class={styles['broadcast-screen-component']} >
            <ErrorDisplay />

            <div class={`${styles['broadcast-pane']} ${(mediaSource().type === STREAM_TYPES.NONE || mediaStream() === null)
                ? styles['without-media']
                : ''
                }`}>
                <Show when={mediaSource().type !== STREAM_TYPES.NONE}>
                    <Switch fallback={<div>No matching stream type for: {mediaSource().type}</div>}>
                        <Match when={
                            (mediaSource().type === STREAM_TYPES.LIVE_LOCAL || mediaSource().type === STREAM_TYPES.LIVE_EXTERNAL)
                            && mediaStream() !== null
                        }>
                            <video
                                class={styles['broadcast-video']}
                                ref={el => setVideoRef(el)}
                                autoplay
                                playsinline
                            />
                            <Show when={showPlayButton()}>
                                <button onClick={tryPlayManually} class={styles["play-button"]}>Click To Connect Camera</button>
                            </Show>
                        </Match>

                        <Match when={mediaSource().type === STREAM_TYPES.VIDEO}>
                            <video
                                class={styles['broadcast-video']}
                                ref={el => setVideoRef(el)}
                                src={mediaSource().url}
                                autoplay
                                playsinline
                                controls
                            />
                        </Match>

                        <Match when={mediaSource().type === STREAM_TYPES.IMAGE}>
                            <div class={styles['broadcast-image-wrapper']}>
                                <div
                                    class={styles['broadcast-image-background']}
                                    style={{ 'background-image': `url(${mediaSource().url})` }}
                                />
                                <div class={styles['broadcast-image-foreground']}>
                                    <img
                                        class={styles['broadcast-image']}
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
