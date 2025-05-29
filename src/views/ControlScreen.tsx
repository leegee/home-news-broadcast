import styles from './ControlScreen.module.scss';
import { onMount } from 'solid-js';
import { history, setVideoUrl } from '../lib/store';
import CaptureControls from '../components/CaptureControls';
import { getEmbedUrl, isValidUrl, saveUrlToHistory } from '../lib/hosted-video-utils';
import VideoThumbnails from './VideoThumbnails';

function openOutputTab() {
    window.open('/#output', '_blank');
}

export default function ControlScreen() {
    const showVideo = (url: string) => {
        const embed = getEmbedUrl(url);
        if (embed) {
            setVideoUrl(embed)
        }
    };

    onMount(() => {
        // todo move to broadcast screen?
        if (history().length > 0) {
            showVideo(history()[0]);
        }

        const processUserSuppliedText = (text: string) => {
            if (text && isValidUrl(text)) {
                saveUrlToHistory(text);
                showVideo(text);
            }
        };

        const pasteHandler = (e: ClipboardEvent) => {
            const text = (e.clipboardData || (window as any).clipboardData).getData("text");
            if (text) processUserSuppliedText(text);
        };

        const dropHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = '';
            const text = e.dataTransfer?.getData("text/plain");
            if (text) processUserSuppliedText(text);
        };

        const dragOverHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = "2px dashed yellow";
        };

        const dragLeaveHandler = (e: DragEvent) => {
            (e.currentTarget as HTMLElement).style.outline = "";
        };

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

            <VideoThumbnails onSelect={showVideo} />

            <nav class={styles['button-strip']}>
                <button onClick={openOutputTab}>Open Output Display</button>
                <CaptureControls />
            </nav>

        </main>
    );
}
