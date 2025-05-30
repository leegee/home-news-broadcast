import styles from './Gallery.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { history, videoOrImageUrl } from '../lib/store.ts';
import { getEmbedUrl, getThumbnail } from '../lib/hosted-video-utils.ts';
import { loadVideo } from '../lib/file-store.ts';
import ThumbnailControl from './ThumbnailControl.tsx';
import { DISPLAY_FLAGS } from '../views/BroadcastScreen.tsx';

type GalleryProps = {
    onSelect: (url: string) => void;
    onDelete: (url: string) => void;
};

export default function Gallery(props: GalleryProps) {
    const [localVideoUrls, setLocalVideoUrls] = createSignal<Record<string, string>>({});
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
        const urls = history();
        const newLocalUrls: Record<string, string> = {};

        await Promise.all(
            urls.map(async (key) => {
                if (key.startsWith('local:')) {
                    const blob = await loadVideo(key);
                    if (blob) {
                        newLocalUrls[key] = URL.createObjectURL(blob);
                    } else {
                        console.error('Could not retrieve local video', key);
                    }
                }
            })
        );

        if (Object.keys(newLocalUrls).length > 0) {
            console.log('Setting local URLs:', newLocalUrls);
            setLocalVideoUrls(newLocalUrls);
        }
    });

    onCleanup(() => {
        Object.values(localVideoUrls()).forEach(URL.revokeObjectURL);
    });

    return (
        <nav class={styles['thumbnails-component']}>

            <Show when={canAccessCamera() && canAccessMic()}>
                <li>
                    <button onClick={() => props.onSelect(DISPLAY_FLAGS.local_live_video)}>
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
                    const src = () => isLocal ? localVideoUrls()[historyKey] : getThumbnail(historyKey);
                    const isActive = () => {
                        const current = videoOrImageUrl();
                        return isLocal
                            ? current === localVideoUrls()[historyKey]
                            : current === getEmbedUrl(historyKey);
                    };

                    return (
                        <li classList={{ [styles['active-thumb']]: isActive() }}>
                            {isLocal ? (
                                <Show when={src()} fallback={<span>Loading…</span>}>
                                    <video
                                        src={src()}
                                        muted
                                        playsinline
                                        preload="metadata"
                                    />
                                </Show>
                            ) : (
                                <img src={src()} />
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
