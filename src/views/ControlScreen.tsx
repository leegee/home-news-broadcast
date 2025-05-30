import styles from './ControlScreen.module.scss';
import { onMount } from 'solid-js';
import { history, removeFromHistory, setVideoOrImageUrl, saveUrlToHistory } from '../lib/store';
import CaptureControls from '../components/CaptureControls';
import { getYoutubeEmbedUrl, isYoutubeUrl } from '../lib/youtube';
import { saveFile, loadFile, deleteFile } from '../lib/file-store';
import OpenOutputScreen from '../components/OpenOutputScreen';
import { DISPLAY_FLAGS } from './BroadcastScreen';
import { ErrorDisplay } from '../components/ErrorDisplay';
import ShowQRCode from './ShowQRCode';
import Gallery from '../components/Gallery';
import ShowRemoteCamera from './ShowRemoteCamera';

export const showItem = async (keyOrUrl: string) => {
    if (keyOrUrl === DISPLAY_FLAGS.local_live_video) {
        setVideoOrImageUrl(DISPLAY_FLAGS.local_live_video);
    }
    else if (keyOrUrl.startsWith('local:')) {
        const blob = await loadFile(keyOrUrl);
        if (blob) {
            setVideoOrImageUrl(URL.createObjectURL(blob));
        }
    }
    else if (isYoutubeUrl(keyOrUrl)) {
        const url = getYoutubeEmbedUrl(keyOrUrl);
        if (url) {
            setVideoOrImageUrl(url);
        }
    }
};

const deleteItem = (keyOrUrl: string) => {
    if (keyOrUrl.startsWith('local:')) {
        deleteFile(keyOrUrl);
        removeFromHistory(keyOrUrl);
    }
    else if (isYoutubeUrl(keyOrUrl)) {
        removeFromHistory(keyOrUrl);
    }
}

const handleFile = async (file: File) => {
    console.log('file.type', file.type);
    if (!file.type.startsWith("video/")) return;

    const key = `local:${file.name}:${Date.now()}`;
    await saveFile(key, file);
    saveUrlToHistory(key);
    showItem(key);
};

const processUserSuppliedText = (text: string) => {
    if (text && isYoutubeUrl(text)) {
        saveUrlToHistory(text);
        showItem(text);
    }
};

export const pasteHandler = (e: ClipboardEvent) => {
    const text = (e.clipboardData || (window as any).clipboardData).getData("text");
    if (text) {
        processUserSuppliedText(text);
        return;
    }

    for (const item of e.clipboardData?.items || []) {
        const file = item.getAsFile?.();
        if (file) handleFile(file);
    }
};

export const dropHandler = async (e: DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = '';

    const text = e.dataTransfer?.getData("text/plain");
    if (text) {
        processUserSuppliedText(text);
        return;
    }

    for (const file of e.dataTransfer?.files || []) {
        handleFile(file);
    }
};

export const dragOverHandler = (e: DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = "2px dashed yellow";
};

export const dragLeaveHandler = (e: DragEvent) => {
    (e.currentTarget as HTMLElement).style.outline = "";
};


export default function ControlScreen() {

    onMount(async () => {
        // todo move to broadcast screen?
        if (history().length > 0) {
            showItem(history()[0]);
        }

        document.body.addEventListener("paste", pasteHandler);
        document.body.addEventListener("drop", dropHandler);
        document.body.addEventListener("dragover", dragOverHandler);
        document.body.addEventListener("dragleave", dragLeaveHandler);

        return () => {
            document.body.removeEventListener("paste", pasteHandler);
            document.body.removeEventListener("drop", dropHandler);
            document.body.removeEventListener("dragover", dragOverHandler);
            document.body.removeEventListener("dragleave", dragLeaveHandler);
        };
    });

    return (
        <main class={styles['control-screen-component']}>

            <Gallery
                onSelect={showItem}
                onDelete={deleteItem}
            />

            <nav class={styles['button-strip']}>
                <OpenOutputScreen />
                <CaptureControls />
                <ShowRemoteCamera />
            </nav>

            <ShowQRCode />
            <ErrorDisplay />
        </main>
    );
}
