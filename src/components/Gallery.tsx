import styles from './Gallery.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { history, selectedKey, STREAM_TYPES } from '../lib/store.ts';
import { getYoutubeThumbnail } from '../lib/youtube.ts';
import { getMimeType, loadFile } from '../lib/file-store.ts';
import ThumbnailControl from './ThumbnailControl.tsx';

type GalleryProps = {
    onSelect: (keyOrUrl: string) => void;
    onDelete: (keyOrUrl: string) => void;
};

type LocalMediaInfo = {
    url: string;
    type: string;
};


export default function Gallery(props: GalleryProps) {
    const [localMedia, setLocalMedia] = createSignal<Record<string, LocalMediaInfo>>({});
    const [canAccessCamera, setCanAccessCamera] = createSignal(false);
    const [canAccessMic, setCanAccessMic] = createSignal(false);

    createEffect(() => {
        navigator.permissions?.query({ name: 'camera' as PermissionName }).then((status) => {
            setCanAccessCamera(status.state === 'granted' || status.state === 'prompt');
        }).catch(() => setCanAccessCamera(false));

        navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((status) => {
            setCanAccessMic(status.state === 'granted' || status.state === 'prompt');
        }).catch(() => setCanAccessMic(false));
    });

    createEffect(async () => {
        const keys = history();
        const previous = localMedia();
        const newLocalMedia: Record<string, LocalMediaInfo> = { ...previous };

        console.log('Gallery loading effect triggered');
        console.log('History keys:', keys);
        console.log('Existing localMedia keys:', Object.keys(previous));

        await Promise.all(
            keys.map(async (key) => {
                const hasKey = !!previous[key];
                console.log(`Checking key ${key}, already loaded? ${hasKey}`);

                if (key.startsWith('local:') && !hasKey) {
                    try {
                        const [blob, mimeType] = await Promise.all([loadFile(key), getMimeType(key)]);
                        if (blob && mimeType) {
                            newLocalMedia[key] = {
                                url: URL.createObjectURL(blob),
                                type: mimeType,
                            };
                            console.log(`Loaded local media for ${key}`, mimeType);
                        } else {
                            console.error('Failed to load local file or mime type', key, blob, mimeType);
                        }
                    } catch (e) {
                        console.error('Error loading local media for', key, e);
                    }
                }
            })
        );

        // Only update if new keys added
        if (Object.keys(newLocalMedia).length > Object.keys(previous).length) {
            console.log('Updating localMedia signal');
            setLocalMedia(newLocalMedia);
        }
    });

    onCleanup(() => {
        Object.values(localMedia()).forEach(({ url }) => URL.revokeObjectURL(url));
    });

    return (
        <nav class={styles['thumbnails-component']}>

            <Show when={canAccessCamera() && canAccessMic()}>
                <li>
                    <button onClick={() => props.onSelect(STREAM_TYPES.LIVE_LOCAL)}>
                        Local Camera
                    </button>
                </li>
            </Show>

            <Show when={history().length === 0}>
                <li>
                    <p>Drop or paste YouTube URLs or local videos into this window.</p>
                </li>
            </Show>

            <For each={history()}>
                {(historyKey) => {
                    const isLocal = historyKey.startsWith('local:');
                    const mediaInfo = () => isLocal ? localMedia()[historyKey] : null;
                    const isActive = () => selectedKey() === historyKey;

                    console.log('history:', historyKey, isLocal, mediaInfo())
                    console.log('localMedia', localMedia());

                    return (
                        <li classList={{ [styles['active-thumb']]: isActive() }}>
                            {isLocal ? (
                                <Show when={mediaInfo()} fallback={<span>Loading…</span>}>
                                    {mediaInfo()?.type.startsWith('video/') ? (
                                        <video
                                            src={mediaInfo()?.url}
                                            muted
                                            playsinline
                                            preload="metadata"
                                        />
                                    ) : mediaInfo()?.type.startsWith('image/') ? (
                                        <img src={mediaInfo()?.url} />
                                    ) : (
                                        <span>Unsupported media type</span>
                                    )}
                                </Show>
                            ) : (
                                <img src={getYoutubeThumbnail(historyKey)} />
                            )}

                            <ThumbnailControl
                                toDelete={() => props.onDelete(historyKey)}
                                toSelect={() => props.onSelect(historyKey)}
                            />
                        </li>
                    );
                }}
            </For>

        </nav>
    );
}
