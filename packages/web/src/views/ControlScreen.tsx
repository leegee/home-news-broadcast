import styles from './ControlScreen.module.scss';
import { createSignal, onMount, Show } from 'solid-js';
import { getYoutubeEmbedUrl, isYoutubeUrl } from '../lib/youtube';
import { MEDIA_TYPES } from '../stores/ui';
import { removeFromPlaylist, savePlaylistItem, playlistSelectedKey, setPlaylistSelectedKey, } from '../stores/playlist';
import { saveFile, deleteFile, getFileAndType } from '../stores/file-store';
import { changeMedia } from '../lib/inter-tab-comms';
import { ErrorDisplay } from '../components/ErrorDisplay';
import StreamUrl from '../components/StreamUrl';
import CaptureControls from '../components/CaptureControls';
import OpenBroadcastScreen from '../components/OpenBroadcastScreen';
import ShowQRCode from '../components/ShowQRCode';
import Gallery from '../components/Gallery';
import ShowRemoteCamera from '../components/ShowRemoteCamera';
import MetadataModal from '../components/MetadataModal';
import ShowLocalCamera from '../components/LocalCamera';
import TickerEditor from '../components/TickerEditor';
import BannerEditor from '../components/BannerEditor';

let lastUrl: string | null = null;

export const showItem = async (keyOrUrl: string) => {
    console.log('showItem called with:', keyOrUrl);

    if (keyOrUrl === playlistSelectedKey()) return;

    setPlaylistSelectedKey(keyOrUrl);

    if (lastUrl) {
        URL.revokeObjectURL(lastUrl);
        lastUrl = null;
    }

    if (keyOrUrl === MEDIA_TYPES.LIVE_LOCAL_CAMERA) {
        changeMedia({ url: '', type: MEDIA_TYPES.LIVE_LOCAL_CAMERA });
    }
    else if (keyOrUrl.startsWith('local:')) {
        const key = keyOrUrl.slice(6); // remove 'local:' prefix
        try {
            const [blob, mime] = await getFileAndType(key);
            if (blob) {
                const url = URL.createObjectURL(blob);
                lastUrl = url;
                const type = mime?.startsWith('image/') ? MEDIA_TYPES.IMAGE : MEDIA_TYPES.VIDEO;
                changeMedia({ url, type });
            } else {
                console.warn('Blob load failed for', keyOrUrl);
            }
        } catch (error) {
            console.error('Error loading local file', keyOrUrl, error);
        }
    }
    else if (isYoutubeUrl(keyOrUrl)) {
        const embed = getYoutubeEmbedUrl(keyOrUrl);
        if (embed) {
            changeMedia({ url: embed, type: MEDIA_TYPES.YOUTUBE });
        }
    }
    else if (keyOrUrl === MEDIA_TYPES.NONE) {
        changeMedia({ url: '', type: keyOrUrl });
    }
    else {
        const type = /\.(jpe?g|png|gif|webp|bmp|ico|avif|svg)$/i.test(keyOrUrl) ? MEDIA_TYPES.IMAGE : MEDIA_TYPES.VIDEO;
        changeMedia({ url: keyOrUrl, type });
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

export default function ControlScreen() {
    const [showMetadataModal, setShowMetadataModal] = createSignal(false);
    const [pendingKey, setPendingKey] = createSignal<string | null>(null);
    let componentRef: HTMLElement | null = null;

    const editItem = (key: string) => {
        setPendingKey(key);
        setShowMetadataModal(true);
    };

    const dragOverHandler = (e: DragEvent) => {
        componentRef?.classList.add(styles['dragged-over']);
        e.preventDefault();
    };

    const dragLeaveHandler = () => {
        componentRef?.classList.remove(styles['dragged-over']);
    };

    const pasteHandler = (e: ClipboardEvent) => {
        dragLeaveHandler();
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
        dragLeaveHandler();
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
        if (playlistSelectedKey()) {
            console.info('First media', playlistSelectedKey())
            showItem(playlistSelectedKey()).catch(console.error);
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
        <main class={styles['control-screen-component']} ref={el => componentRef = el}>

            <nav class={styles['button-strip']}>
                <OpenBroadcastScreen />
                <StreamUrl />
                <CaptureControls />
                <ShowLocalCamera />
                <ShowRemoteCamera />
            </nav>

            <Gallery
                onSelect={showItem}
                onDelete={deleteItem}
                onEdit={editItem}
            />

            <BannerEditor />
            <TickerEditor />

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

            <div class={styles['drop-message']}>
                Drop an image, video, or YouTube link into this window.
            </div>
        </main >
    );
}
