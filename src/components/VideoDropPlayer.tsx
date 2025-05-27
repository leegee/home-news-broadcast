// VideoDropPlayer.tsx
import { createSignal, onMount, For, JSX, Show } from 'solid-js';
import styles from './VideoDropPlayer.module.scss';

const MAX_HISTORY = 10;
const STORAGE_KEY = "droppedVideoUrls";

function isValidUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return ["youtube.com", "youtu.be"].some(host =>
            url.hostname.includes(host)
        );
    } catch {
        console.log("Don't know what to do with your dropped URL", str)
        return false;
    }
}

function getEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
            const videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
    } catch {
        return null;
    }
    return null;
}

function getHistory(): string[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveUrlToHistory(url: string) {
    let history = getHistory();
    history.unshift(url);
    history = history.filter((v, i, a) => a.indexOf(v) === i).slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function getThumbnail(url: string): string {
    const embedUrl = getEmbedUrl(url);
    if (!embedUrl) return "https://via.placeholder.com/120x90.png?text=Invalid";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = embedUrl.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return "https://via.placeholder.com/120x90.png?text=Unknown";
}

interface IVideoDropPlayerProps {
    children: JSX.Element;
}

export default function VideoDropPlayer(props: IVideoDropPlayerProps) {
    const [history, setHistory] = createSignal<string[]>([]);
    const [currentUrl, setCurrentUrl] = createSignal<string | null>(null);

    const showVideo = (url: string) => {
        const embed = getEmbedUrl(url);
        if (embed) {
            setCurrentUrl(embed);
        }
    };

    const renderThumbnails = () => {
        const h = getHistory();
        setHistory(h);
        if (h.length > 0) {
            showVideo(h[0]);
        }
    };

    const handleUrlDrop = (text: string) => {
        if (isValidUrl(text)) {
            saveUrlToHistory(text);
            setHistory(getHistory());
            showVideo(text);
        }
    };

    onMount(() => {
        renderThumbnails();

        const dropHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = '';
            const text = e.dataTransfer?.getData("text/plain");
            if (text) handleUrlDrop(text);
        };

        const dragOverHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = "2px dashed yellow";
        };

        const dragLeaveHandler = (e: DragEvent) => {
            (e.currentTarget as HTMLElement).style.outline = "";
        };

        const pasteHandler = (e: ClipboardEvent) => {
            const text = (e.clipboardData || (window as any).clipboardData).getData("text");
            if (text) handleUrlDrop(text);
        };

        document.body.addEventListener("drop", dropHandler);
        document.body.addEventListener("dragover", dragOverHandler);
        document.body.addEventListener("dragleave", dragLeaveHandler);
        document.body.addEventListener("paste", pasteHandler);

        return () => {
            document.body.removeEventListener("drop", dropHandler);
            document.body.removeEventListener("dragover", dragOverHandler);
            document.body.removeEventListener("dragleave", dragLeaveHandler);
            document.body.removeEventListener("paste", pasteHandler);
        };
    });

    return (
        <section class={styles['video-drop-player-component']}>
            <div class={styles["large-video"]}>
                {currentUrl() && (
                    <iframe
                        src={currentUrl()!}
                        width="100%"
                        height="360"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                )}
                <div class={styles["large-video-overlay"]}>
                    {props.children}
                </div>
            </div>

            <nav class={styles["video-thumbs"]}>
                <Show when={history().length === 0}>
                    Drop video page URLs into this window.
                </Show>
                <For each={history()}>
                    {(url) => (
                        <li
                            classList={{ [styles.activeThumb]: currentUrl() === getEmbedUrl(url) }}
                            onClick={() => showVideo(url)}
                        >
                            <img src={getThumbnail(url)} alt={url} style={{ width: "100%" }} />
                        </li>
                    )}
                </For>
            </nav>
        </section>
    );
}
