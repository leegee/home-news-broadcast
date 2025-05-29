import styles from './VideoThumbnails.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { history, videoUrl } from '../lib/store';
import { getEmbedUrl, getThumbnail } from '../lib/hosted-video-utils.ts';
import { loadVideo } from '../lib/video-files';

export default function VideoThumbnails(props: { onSelect: (url: string) => void }) {
    // Map of local keys to object URLs
    const [localVideoUrls, setLocalVideoUrls] = createSignal<Record<string, string>>({});

    createEffect(async () => {
        const urls = history();
        const newLocalUrls: Record<string, string> = {};

        await Promise.all(
            urls.map(async (key) => {
                if (key.startsWith('local:')) {
                    console.log('loading', key);
                    const blob = await loadVideo(key);
                    if (blob) {
                        newLocalUrls[key] = URL.createObjectURL(blob);
                    } else {
                        console.error('could not retrieve local video', key);
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

    function isLocalVideo(item: string) {
        return item.startsWith('local:');
    }

    return (
        <nav class={styles['thumbnails-component']}>
            <Show when={history().length === 0}>
                <p>Drop video page URLs or local videos into this window.</p>
            </Show>

            <For each={history()}>
                {(item) => {
                    if (isLocalVideo(item)) {
                        // Local video
                        const objectUrl = () => localVideoUrls()[item];
                        return (
                            <li
                                classList={{ [styles['active-thumb']]: videoUrl() === objectUrl() }}
                                onClick={() => props.onSelect(objectUrl())}
                            >
                                <Show when={objectUrl} fallback={<span>Loading…</span>}>
                                    <video
                                        src={objectUrl()}
                                        muted
                                        playsinline
                                        preload="metadata"
                                    />
                                </Show>
                            </li>
                        );
                    } else {
                        // Remote video URL
                        return (
                            <li
                                classList={{ [styles['active-thumb']]: videoUrl() === getEmbedUrl(item) }}
                                onClick={() => props.onSelect(item)}
                            >
                                <img src={getThumbnail(item)} />
                            </li>
                        );
                    }
                }}
            </For>
        </nav>
    );
}
