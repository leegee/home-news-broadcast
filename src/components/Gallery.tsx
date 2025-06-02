import styles from './Gallery.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { setHistory, history, setSelectedKey, selectedKey, } from '../lib/store.ts';
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
                moveThumb(-1);
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                moveThumb(1);
                break;
        }
    }

    function moveThumb(dir: number) {
        const keys = [...history()];

        if (keys.length === 0) return;

        const current = selectedKey();
        const currentIndex = keys.indexOf(current);

        if (currentIndex === -1 && keys.length > 0) {
            setSelectedKey(keys[0]);
            return;
        }

        if (currentIndex === -1) return;

        let newIndex = currentIndex;

        if (dir < 0) {
            newIndex = (currentIndex - 1 + keys.length) % keys.length;
        } else if (dir > 0) {
            newIndex = (currentIndex + 1) % keys.length;
        } else {
            return;
        }

        if (newIndex !== currentIndex) {
            const updated = [...keys];
            [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
            setHistory(updated);
            setSelectedKey(updated[newIndex]);

            // After DOM is updated:
            queueMicrotask(() => {
                const newKey = updated[newIndex];
                const el = itemRefs.get(newKey);
                el?.focus();
            });
        }

    }

    createEffect(async () => {
        const keys = history();
        const previous = localMedia();
        const newLocalMedia: Record<string, LocalMediaInfo> = { ...previous };

        console.log('Gallery loading effect triggered');
        console.log('History keys:', keys);
        console.log('Existing localMedia keys:', Object.keys(previous));

        await Promise.all(
            keys.map(async (key) => {
                const hasKey = previous.hasOwnProperty(key);
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
                {(historyKey, index) => {
                    const isLocal = historyKey.startsWith('local:');
                    const mediaInfo = () => isLocal ? localMedia()[historyKey] : null;
                    const isActive = () => selectedKey() === historyKey;

                    console.log('history:', historyKey, isLocal, mediaInfo())
                    console.log('localMedia', localMedia());

                    return (
                        <li tabIndex={index() + 1}
                            classList={{ [styles['active-thumb']]: isActive() }}
                            ref={(el) => itemRefs.set(historyKey, el)}
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
                                <img src={getYoutubeThumbnail(historyKey)} />
                            )}

                            <ThumbnailControl
                                toDelete={() => props.onDelete(historyKey)}
                                toSelect={() => props.onSelect(historyKey)}
                                onLeft={() => moveThumb(-1)}
                                onRight={() => moveThumb(1)}
                            />
                        </li>
                    );
                }}
            </For>

        </nav>
    );
}
