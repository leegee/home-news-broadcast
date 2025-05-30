import styles from './ControlScreen.module.scss';
import { onMount } from 'solid-js';
import { history, removeFromHistory, setVideoUrl } from '../lib/store';
import CaptureControls from '../components/CaptureControls';
import { getEmbedUrl, isValidUrl, saveUrlToHistory } from '../lib/hosted-video-utils';
import { saveVideo, loadVideo, deleteVideo } from '../lib/video-files';
import OpenOutputScreen from '../components/OpenOutputScreen';
import { LOCAL_LIVE_VIDEO_FLAG } from './BroadcastScreen';
import { ErrorDisplay } from '../components/ErrorDisplay';
import ShowQRCode from './ShowQRCode';
import Gallery from '../components/Gallery';
import ShowRemoteCamera from './ShowRemoteCamera';

export const showItem = async (keyOrUrl: string) => {
    if (keyOrUrl === LOCAL_LIVE_VIDEO_FLAG) {
        setVideoUrl(LOCAL_LIVE_VIDEO_FLAG);
    }
    else if (keyOrUrl.startsWith('local:')) {
        const blob = await loadVideo(keyOrUrl);
        if (blob) {
            setVideoUrl(URL.createObjectURL(blob));
        }
    }
    else if (isValidUrl(keyOrUrl)) {
        const url = getEmbedUrl(keyOrUrl);
        if (url) {
            setVideoUrl(url);
        }
    }
};

const deleteItem = (keyOrUrl: string) => {
    if (keyOrUrl.startsWith('local:')) {
        deleteVideo(keyOrUrl);
        removeFromHistory(keyOrUrl);
    }
    else if (isValidUrl(keyOrUrl)) {
        removeFromHistory(keyOrUrl);
    }
}

const handleFile = async (file: File) => {
    console.log('file.type', file.type);
    if (!file.type.startsWith("video/")) return;

    const key = `local:${file.name}:${Date.now()}`;
    await saveVideo(key, file);
    saveUrlToHistory(key);
    showItem(key);
};

const processUserSuppliedText = (text: string) => {
    if (text && isValidUrl(text)) {
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
