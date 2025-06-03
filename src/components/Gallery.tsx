import styles from './Gallery.module.scss';
import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { playlist, selectedKey, movePlaylistItem, } from '../lib/stores/playlist.ts';
import { getYoutubeThumbnail } from '../lib/youtube.ts';
import { getMimeType, loadFile } from '../lib/file-store.ts';
import ThumbnailControl from './ThumbnailControl.tsx';

type GalleryProps = {
    onSelect: (keyOrUrl: string) => void;
    onDelete: (keyOrUrl: string) => void;
    onEdit: (keyOrUrl: string) => void;
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
        if (!key) {
            throw new Error('No key to moveThumb')
        }

        movePlaylistItem(key, dir);

        // Wait until the DOM updates before focusing
        queueMicrotask(() => {
            const el = itemRefs.get(key);
            el?.focus();
        });
    }

    createEffect(async () => {
        const keys = playlist();
        const previous = localMedia();
        const newLocalMedia: Record<string, LocalMediaInfo> = { ...previous };

        console.log('Gallery loading effect triggered');
        console.log('Playlist keys:', keys);
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
            <Show when={playlist().length === 0}>
                <li>
                    <p>Drop or paste YouTube URLs or local videos into this window.</p>
                </li>
            </Show>

            <For each={playlist()}>
                {(playlistItem, index) => {
                    const isLocal = playlistItem.key.startsWith('local:');
                    const mediaInfo = () => isLocal ? localMedia()[playlistItem.key] : null;
                    const isActive = () => selectedKey() === playlistItem.key;

                    return (
                        <li tabIndex={index() + 1}
                            classList={{ [styles['active-thumb']]: isActive() }}
                            ref={(el) => itemRefs.set(playlistItem.key, el)}
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
                                <img src={getYoutubeThumbnail(playlistItem.key)} />
                            )}

                            <ThumbnailControl
                                onDelete={() => props.onDelete(playlistItem.key)}
                                onSelect={() => props.onSelect(playlistItem.key)}
                                onEdit={() => props.onEdit(playlistItem.key)}
                                onLeft={() => moveThumb(playlistItem.key, -1)}
                                onRight={() => moveThumb(playlistItem.key, 1)}
                            />

                            <div class={styles.metadata} onclick={() => alert(1)}>
                                <p class={styles.headline}>{playlistItem.headline || ''}</p>
                                <p class={styles.standfirst}>{playlistItem.standfirst || ''}</p>
                            </div>
                        </li>
                    );
                }}
            </For>

        </nav>
    );
}
