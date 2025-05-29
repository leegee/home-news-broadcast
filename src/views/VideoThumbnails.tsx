import styles from './VideoThumbnails.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { history, videoUrl } from '../lib/store';
import { getEmbedUrl, getThumbnail } from '../lib/hosted-video-utils.ts';
import { loadVideo } from '../lib/video-files';

export default function VideoThumbnails(props: { onSelect: (url: string) => void }) {
    const [localVideoUrls, setLocalVideoUrls] = createSignal<Record<string, string>>({});

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

    return (
        <nav class={styles['thumbnails-component']}>
            <Show when={history().length === 0}>
                <p>Drop or paste YouTube URLs or local videos into this window.</p>
            </Show>

            <For each={history()}>
                {(item) => {
                    const isLocal = item.startsWith('local:');
                    const src = () => isLocal ? localVideoUrls()[item] : getThumbnail(item);
                    const isActive = () => {
                        const current = videoUrl();
                        return isLocal
                            ? current === localVideoUrls()[item]
                            : current === getEmbedUrl(item);
                    };

                    return (
                        <li
                            classList={{ [styles['active-thumb']]: isActive() }}
                            onClick={() => props.onSelect(item)}
                        >
                            <Show when={isLocal} fallback={<img src={src()} />}>
                                <Show when={src()} fallback={<span>Loading…</span>}>
                                    <video
                                        src={src()}
                                        muted
                                        playsinline
                                        preload="metadata"
                                    />
                                </Show>
                            </Show>
                        </li>
                    );
                }}
            </For>
        </nav>
    );
}
