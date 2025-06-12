import styles from './BroadcastScreen.module.scss';
import { createEffect, createMemo, createSignal, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { getFileAndType } from '../stores/file-store';
import { endCurrentCall, setupQRCodeFlow } from '../lib/qr2phone2stream';
import { MediaChangeParams, registerOnEndCallHandler, onMediaChange } from '../lib/inter-tab-comms';
import {
    mediaStream,
    setMediaStream,
    setQrCode,
    setCurrentMediaType,
    currentMediaType,
    MEDIA_TYPES,
    setError,
} from '../stores/ui';
import { navigatePlaylist, playlist, playlistSelectedKey, setPlaylistSelectedKey } from '../stores/playlist';

let peerSetup = false;
let previousObjectUrl: string | null = null;

export const windowTitle = "Broadcast Window";

export default function BroadcastScreen() {
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const [showPlayButton, setShowPlayButton] = createSignal(false);
    const [mediaSource, setMediaSource] = createSignal<{ url: string; type: string }>({ url: '', type: MEDIA_TYPES.NONE });

    const setMedia = async ({ url, type }: MediaChangeParams) => {
        console.log('Media changed to:', url, 'with type:', type);
        console.log('Playlist', playlist());
        setShowPlayButton(false);
        setMediaSource({ url, type });

        if (mediaStream() && currentMediaType() === MEDIA_TYPES.LIVE_REMOTE_CAMERA) {
            endCurrentCall();
        }

        switch (type) {
            case MEDIA_TYPES.LIVE_LOCAL_CAMERA: {
                try {
                    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setMediaStream(localStream);
                    setCurrentMediaType(MEDIA_TYPES.LIVE_LOCAL_CAMERA);
                } catch (err) {
                    console.error('Failed to get local media stream:', err);
                    setError('Camera/mic access failed.');
                }
                break;
            }

            case MEDIA_TYPES.LIVE_REMOTE_CAMERA: {
                if (!peerSetup) {
                    peerSetup = true;
                    setupQRCodeFlow();
                }
                break;
            }

            case MEDIA_TYPES.IMAGE:
            case MEDIA_TYPES.VIDEO:
            case MEDIA_TYPES.YOUTUBE: {
                setMediaStream(null);
                setCurrentMediaType(type);
                setQrCode('');
                break;
            }

            case MEDIA_TYPES.NONE:
            default: {
                setMediaStream(null);
                setCurrentMediaType(null);
                setQrCode('');
                break;
            }
        }
    };

    const reset = () => {
        const video = videoRef();
        if (video && !video.paused) {
            video.pause();
        }
        setPlaylistSelectedKey('');
        setMedia({ url: '', type: MEDIA_TYPES.NONE });
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

    const getPlayButtonLabel = () => mediaSource().type === MEDIA_TYPES.LIVE_LOCAL_CAMERA ? "Click To Connect Camera" : "Click To Play Video";

    const tryPlayManually = () => {
        const video = videoRef();
        if (!video) return;

        video.play()
            .then(() => setShowPlayButton(false))
            .catch(err => console.warn('Manual play still failed:', err));
    };

    const showLiveStream = createMemo(() =>
        (mediaSource().type === MEDIA_TYPES.LIVE_LOCAL_CAMERA || mediaSource().type === MEDIA_TYPES.LIVE_REMOTE_CAMERA)
        && mediaStream() !== null
    );

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
                reset();
                break;
        }
    };

    createEffect(() => {
        const stream = mediaStream();
        const video = videoRef();
        if (!video) return;

        if (stream) {
            video.srcObject = stream;
            video.play().catch(err => {
                console.warn('Autoplay prevented/failed:', err);
                setShowPlayButton(true);
            });
        } else {
            video.pause();
            video.srcObject = null;
        }
    });

    createEffect(async () => {
        const key = playlistSelectedKey();
        if (!key || !key.startsWith("local:")) return;

        const [blob, mime] = await getFileAndType(key);

        // Cleanup old ObjectURL if it exists
        if (previousObjectUrl) {
            URL.revokeObjectURL(previousObjectUrl);
            previousObjectUrl = null;
        }

        if (blob && mime) {
            const url = URL.createObjectURL(blob);
            previousObjectUrl = url;

            const type = mime.startsWith("image/")
                ? MEDIA_TYPES.IMAGE
                : mime.startsWith("video/") ? MEDIA_TYPES.VIDEO : '';

            if (type) {
                console.log('Loaded local file from file-store:', key, type);
                setMedia({ url, type });
            } else {
                console.warn('Unrecognized mime type in Broadcast screen:', mime);
            }
        } else {
            console.warn("No blob or mime found for key in Broadcast screen:", key);
        }
    });

    onMount(() => {
        document.title = windowTitle;
        window.addEventListener('keydown', handleKeyDown);
        registerOnEndCallHandler();
        const cleanupOnMediaChange = onMediaChange(async ({ url, type }) => setMedia({ url, type }));
        onCleanup(() => cleanupOnMediaChange());
    });

    onCleanup(() => {
        window.removeEventListener('keydown', handleKeyDown);
        setQrCode('');
        if (videoRef() !== null) {
            videoRef()!.srcObject = null
        };
        if (mediaStream() && (currentMediaType() === MEDIA_TYPES.LIVE_LOCAL_CAMERA || currentMediaType() === MEDIA_TYPES.LIVE_REMOTE_CAMERA)) {
            mediaStream()?.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }
    });

    return (
        <main class={styles['broadcast-screen-component']} >
            <ErrorDisplay />

            <div data-testid="broadcast-pane" class={`${styles['broadcast-pane']} ${(mediaSource().type === MEDIA_TYPES.NONE || mediaStream() === null) ? styles['without-media'] : ''}`}>
                <Show when={mediaSource().type !== MEDIA_TYPES.NONE}>

                    <Switch fallback={<div>No matching stream type for: {mediaSource().type}</div>}>

                        <Match when={showLiveStream()}>

                            <video
                                class={styles['broadcast-video']}
                                ref={el => setVideoRef(el)}
                                autoplay
                                playsinline
                            />
                            <Show when={showPlayButton()}>
                                <button onClick={tryPlayManually} class={styles["play-button"]}>{getPlayButtonLabel()}</button>
                            </Show>
                        </Match>

                        <Match when={mediaSource().type === MEDIA_TYPES.VIDEO || mediaSource().type === MEDIA_TYPES.LIVE_REMOTE_CAMERA || mediaSource().type === MEDIA_TYPES.LIVE_LOCAL_CAMERA}>
                            <video
                                class={styles['broadcast-video']}
                                ref={el => setVideoRef(el)}
                                src={mediaSource().url}
                                autoplay
                                playsinline
                                controls
                            />
                        </Match>

                        <Match when={mediaSource().type === MEDIA_TYPES.IMAGE}>
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

                        <Match when={mediaSource().type === MEDIA_TYPES.YOUTUBE}>
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
