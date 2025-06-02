import styles from './Gallery.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { history, selectedKey, moveHistoryItem, } from '../lib/stores/history.ts';
import { getYoutubeThumbnail } from '../lib/youtube.ts';
import { getMimeType, loadFile } from '../lib/file-store.ts';
import ThumbnailControl from './ThumbnailControl.tsx';

type GalleryProps = {
    onSelect: (keyOrUrl: string) => void;
    onDelete: (keyOrUrl: string) => void;
};

export type LocalMediaInfo = {
    url: string;
    type: string;
};

export default function Gallery(props: GalleryProps) {
    const [localMedia, setLocalMedia] = createSignal<Record<string, LocalMediaInfo>>({});
    const itemRefs = new Map<string, HTMLLIElement>();

    function handleKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                moveThumb(selectedKey(), -1);
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                moveThumb(selectedKey(), 1);
                break;
        }
    }

    function moveThumb(key: string, dir: number) {
        moveHistoryItem(key, dir);

        // Wait until the DOM updates before focusing
        queueMicrotask(() => {
            const el = itemRefs.get(key);
            el?.focus();
        });
    }

    createEffect(async () => {
        const keys = history();
        const previous = localMedia();
        const newLocalMedia: Record<string, LocalMediaInfo> = { ...previous };

        console.log('Gallery loading effect triggered');
        console.log('History keys:', keys);
        console.log('Existing localMedia keys:', Object.keys(previous));

        await Promise.all(
            keys.map(async ({ key }) => {
                const hasKey = previous.hasOwnProperty(key);
                console.log(`Checking key ${key}, already loaded? ${hasKey}`);

                if (key.startsWith('local:') && !hasKey) {
                    try {
                        const [blob, mimeType] = await Promise.all([
                            loadFile(key),
                            getMimeType(key)
                        ]);

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

        if (Object.keys(newLocalMedia).length > Object.keys(previous).length) {
            console.log('Updating localMedia signal');
            setLocalMedia(newLocalMedia);
        }
    });

    onCleanup(() => {
        Object.values(localMedia()).forEach(({ url }) => URL.revokeObjectURL(url));
        itemRefs.clear();
    });

    return (
        <nav class={styles['gallery-component']} tabindex={0} onKeyDown={handleKeyDown}>
            <Show when={history().length === 0}>
                <li>
                    <p>Drop or paste YouTube URLs or local videos into this window.</p>
                </li>
            </Show>

            <For each={history()}>
                {(historyItem, index) => {
                    const isLocal = historyItem.key.startsWith('local:');
                    const mediaInfo = () => isLocal ? localMedia()[historyItem.key] : null;
                    const isActive = () => selectedKey() === historyItem.key;

                    return (
                        <li tabIndex={index() + 1}
                            classList={{ [styles['active-thumb']]: isActive() }}
                            ref={(el) => itemRefs.set(historyItem.key, el)}
                        >
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
                                <img src={getYoutubeThumbnail(historyItem.key)} />
                            )}

                            <ThumbnailControl
                                toDelete={() => props.onDelete(historyItem.key)}
                                toSelect={() => props.onSelect(historyItem.key)}
                                onLeft={() => moveThumb(selectedKey(), -1)}
                                onRight={() => moveThumb(selectedKey(), 1)}
                            />

                            <div class={styles.metadata}>
                                <p class={styles.headline}>{historyItem.headline || ''}</p>
                                <p class={styles.standfirst}>{historyItem.standfirst || ''}</p>
                            </div>
                        </li>
                    );
                }}
            </For>

        </nav>
    );
}
