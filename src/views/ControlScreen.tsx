import styles from './ControlScreen.module.scss';
import { onMount } from 'solid-js';
import { getYoutubeEmbedUrl, isYoutubeUrl } from '../lib/youtube';
import { saveFile, loadFile, deleteFile } from '../lib/file-store';
import OpenOutputScreen from '../components/OpenOutputScreen';
import { ErrorDisplay } from '../components/ErrorDisplay';
import ShowQRCode from '../components/ShowQRCode';
import Gallery from '../components/Gallery';
import ShowRemoteCamera from '../components/ShowRemoteCamera';
import { changeMedia } from '../lib/broadcast-media';

import {
    removeFromHistory,
    saveUrlToHistory,
    selectedKey,
    setSelectedKey,
    STREAM_TYPES
} from '../lib/store';

let lastUrl: string | null = null;

export const showItem = async (keyOrUrl: string) => {
    console.log('showItem called with:', keyOrUrl);
    setSelectedKey(keyOrUrl);

    if (lastUrl) {
        URL.revokeObjectURL(lastUrl);
        lastUrl = null;
    }

    if (keyOrUrl === STREAM_TYPES.LIVE_LOCAL) {
        changeMedia({ url: '', type: STREAM_TYPES.LIVE_LOCAL });
        console.log('Set live_local source');
    }
    else if (keyOrUrl.startsWith('local:')) {
        const blob = await loadFile(keyOrUrl);
        console.log('Loaded blob:', blob);
        if (blob) {
            const url = URL.createObjectURL(blob);
            lastUrl = url;
            const type = blob.type.startsWith('image/') ? STREAM_TYPES.IMAGE : STREAM_TYPES.VIDEO;
            changeMedia({ url, type });
            console.log('Set local media source:', url, type);
        } else {
            console.warn('Blob load failed for', keyOrUrl);
        }
    }
    else if (isYoutubeUrl(keyOrUrl)) {
        const embed = getYoutubeEmbedUrl(keyOrUrl);
        if (embed) {
            changeMedia({ url: embed, type: STREAM_TYPES.YOUTUBE });
            console.log('Set YouTube source:', embed);
        }
    }
    else {
        const type = keyOrUrl.endsWith('.jpg') ? STREAM_TYPES.IMAGE : STREAM_TYPES.VIDEO;
        changeMedia({ url: keyOrUrl, type });
        console.log('Set fallback source:', keyOrUrl, type);
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
};

const handleDroppedFile = async (file: File) => {
    console.log('file.type', file.type);
    if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
        const key = `local:${file.name}:${Date.now()}`;
        await saveFile(key, file);
        saveUrlToHistory(key);
        showItem(key);
    }
};

const handleDroppedText = (text: string) => {
    if (text && isYoutubeUrl(text)) {
        saveUrlToHistory(text);
        showItem(text);
    }
};

export const pasteHandler = (e: ClipboardEvent) => {
    const text = (e.clipboardData || (window as any).clipboardData).getData("text");
    if (text) {
        handleDroppedText(text);
        return;
    }

    for (const item of e.clipboardData?.items || []) {
        const file = item.getAsFile?.();
        if (file) handleDroppedFile(file);
    }
};

export const dropHandler = async (e: DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = '';

    const text = e.dataTransfer?.getData("text/plain");
    if (text) {
        handleDroppedText(text);
        return;
    }

    for (const file of e.dataTransfer?.files || []) {
        handleDroppedFile(file);
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
        if (selectedKey()) showItem(selectedKey());

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
                <ShowRemoteCamera />
            </nav>

            <ShowQRCode />
            <ErrorDisplay />
        </main>
    );
}
