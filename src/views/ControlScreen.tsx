import styles from './ControlScreen.module.scss';
import { onMount, For, Show } from 'solid-js';
import { history, setHistory, setVideoUrl, videoUrl } from '../lib/store';
import CaptureControls from '../components/CaptureControls';

const MAX_HISTORY = 10;

function openOutputTab() {
    window.open('/#output', '_blank');
}

function isValidUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return ["youtube.com", "youtu.be"].some(host => url.hostname.includes(host));
    } catch {
        console.log("Don't know what to do with your dropped URL", str);
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

function saveUrlToHistory(url: string) {
    let h = history();
    h = [url, ...h.filter(v => v !== url)]; // prepend new URL, remove duplicates
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    setHistory(h);
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

export default function ControlScreen() {
    const showVideo = (url: string) => {
        const embed = getEmbedUrl(url);
        if (embed) {
            setVideoUrl(embed)
            console.log('set')
        } else {
            console.log('did not set')
        }
    };

    onMount(() => {
        if (history().length > 0) {
            showVideo(history()[0]);
        }

        const dropHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = '';
            const text = e.dataTransfer?.getData("text/plain");
            if (text && isValidUrl(text)) {
                saveUrlToHistory(text);
                showVideo(text);
            }
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
            if (text && isValidUrl(text)) {
                saveUrlToHistory(text);
                showVideo(text);
            }
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
        <main class={styles['control-screen-component']}>

            <nav class={styles["video-thumbs"]}>
                <Show when={history().length === 0}>
                    <p>Drop video page URLs into this window. Press ESCAPE to toggle the thumbnail display.</p>
                </Show>

                <For each={history()}>
                    {(url) => (
                        <li
                            classList={{ [styles["active-thumb"]]: videoUrl() === getEmbedUrl(url) }}
                            onClick={() => showVideo(url)}
                        >
                            <img src={getThumbnail(url)} alt={url} style={{ width: "100%" }} />
                        </li>
                    )}
                </For>
            </nav>

            <nav>
                <button class={styles['open-output']} onClick={openOutputTab}>Open Output Display</button>
                <CaptureControls />
            </nav>

        </main>
    );
}
