import styles from './ControlScreen.module.scss';
import { createSignal, onMount, Show } from 'solid-js';
import { getYoutubeEmbedUrl, isYoutubeUrl } from '../lib/youtube';
import { STREAM_TYPES } from '../lib/stores/ui';
import { removeFromPlaylist, savePlaylistItem, selectedKey, setSelectedKey, } from '../lib/stores/playlist';
import { saveFile, loadFile, deleteFile } from '../lib/stores/file-store';
import { changeMedia } from '../lib/inter-tab-comms';
import { ErrorDisplay } from '../components/ErrorDisplay';
import CaptureControls from '../components/CaptureControls';
import OpenBroadcastScreen from '../components/OpenBroadcastScreen';
import ShowQRCode from '../components/ShowQRCode';
import Gallery from '../components/Gallery';
import ShowRemoteCamera from '../components/ShowRemoteCamera';
import MetadataModal from '../components/MetadataModal';
import ShowLocalCamera from '../components/LocalCamera';

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
    if (confirm('Really delete this item?')) {
        if (keyOrUrl.startsWith('local:')) {
            deleteFile(keyOrUrl);
            removeFromPlaylist(keyOrUrl);
        }
        else if (isYoutubeUrl(keyOrUrl)) {
            removeFromPlaylist(keyOrUrl);
        }
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
    const [showMetadataModal, setShowMetadataModal] = createSignal(false);
    const [pendingKey, setPendingKey] = createSignal<string | null>(null);

    const editItem = (key: string) => {
        setPendingKey(key);
        setShowMetadataModal(true);
    };

    const pasteHandler = (e: ClipboardEvent) => {
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

    const dropHandler = async (e: DragEvent) => {
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

    const handleDroppedFile = async (file: File) => {
        console.log('file.type', file.type);
        if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
            const key = `local:${file.name}:${Date.now()}`;
            await saveFile(key, file);
            savePlaylistItem({ key, headline: '', standfirst: '' });
            setPendingKey(key);
            setShowMetadataModal(true);
            showItem(key);
        }
    };

    const handleDroppedText = (text: string) => {
        if (text && isYoutubeUrl(text)) {
            savePlaylistItem({ key: text, headline: '', standfirst: '' });
            setPendingKey(text);
            setShowMetadataModal(true);
            showItem(text);
        }
    };

    onMount(async () => {
        document.title = "Control Window";
        if (selectedKey()) {
            showItem(selectedKey()).catch(console.error);
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

            <nav class={styles['button-strip']}>
                <CaptureControls />
                <OpenBroadcastScreen />
                <ShowLocalCamera />
                <ShowRemoteCamera />
            </nav>

            <Gallery
                onSelect={showItem}
                onDelete={deleteItem}
                onEdit={editItem}
            />

            <ShowQRCode />
            <ErrorDisplay />

            <Show when={showMetadataModal() && pendingKey()}>
                <MetadataModal
                    key={pendingKey()!}
                    onSave={(headline, standfirst) => {
                        savePlaylistItem({ key: pendingKey()!, headline, standfirst });
                        setShowMetadataModal(false);
                        setPendingKey(null);
                    }}
                    onCancel={() => {
                        setShowMetadataModal(false);
                        setPendingKey(null);
                    }}
                />
            </Show>
        </main>
    );
}
