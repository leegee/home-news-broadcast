import styles from './Gallery.module.scss';
import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { playlist, selectedKey, movePlaylistItem, } from '../lib/stores/playlist';
import { getYoutubeThumbnail } from '../lib/youtube';
import { getMimeType, loadFile } from '../lib/stores/file-store';
import ThumbnailControl from './ThumbnailControl';
import Help from './Help';

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
    let galleryWrapperRef!: HTMLElement;
    let galleryInnerRef!: HTMLElement;

    const itemRefs = new Map<string, HTMLLIElement>();

    function updateScrollIndicators() {
        if (!galleryWrapperRef || !galleryInnerRef) return;
        const { scrollLeft, scrollWidth, clientWidth } = galleryInnerRef;
        galleryWrapperRef.classList.toggle(styles['can-scroll-left'], scrollLeft > 0);
        galleryWrapperRef.classList.toggle(styles['can-scroll-right'], scrollLeft + clientWidth < scrollWidth - 10);
    }

    function handleGalleryClick(e: MouseEvent) {
        if (!galleryInnerRef) return;

        const { clientX } = e;
        const { left, right } = galleryInnerRef.getBoundingClientRect();

        const edgeThreshold = 48;
        if (clientX - left < edgeThreshold) {
            galleryInnerRef.scrollBy({ left: -120, behavior: 'smooth' });
        } else if (right - clientX < edgeThreshold) {
            galleryInnerRef.scrollBy({ left: 120, behavior: 'smooth' });
        }
    }

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

    const handleWheel = (e: WheelEvent) => {
        if (!galleryInnerRef) return;
        e.preventDefault();
        galleryInnerRef.scrollLeft += e.deltaY;
    };

    onMount(() => {
        galleryInnerRef.addEventListener('scroll', updateScrollIndicators);
        galleryInnerRef.addEventListener("wheel", handleWheel, { passive: false });

        updateScrollIndicators();

        onCleanup(() => {
            galleryInnerRef?.removeEventListener("wheel", handleWheel);
            galleryInnerRef?.removeEventListener('scroll', updateScrollIndicators)
        });
    });

    createEffect(async () => {
        const keys = playlist();
        const previous = localMedia();
        const newLocalMedia: Record<string, LocalMediaInfo> = { ...previous };

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
        <section class={styles['gallery-component']} ref={(el) => (galleryWrapperRef = el)}
            onClick={handleGalleryClick}
        >

            <h2>Gallery
                <Help>
                    <p>All media that can be shown in the broadcast screen. </p>
                    <p>To add new media, drop it into this browser tab.</p>
                    <p>Hover over a thumbnail to edit the title and subtitle, which if set will appear in the lower third of the broadcast screen.</p>
                    <p>Re-arrange the order with the little arrows at the side of the controls shown when hovering over the thumbnail.</p>
                </Help>
            </h2>

            <nav class={styles['gallery-component-inner']} ref={(el) => (galleryInnerRef = el)}
                tabindex={0} onKeyDown={handleKeyDown}
            >
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
        </section>
    );
}
