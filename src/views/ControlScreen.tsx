import styles from './ControlScreen.module.scss';
import { createSignal, onMount, Show } from 'solid-js';
import QRCode from 'qrcode';
import { history, removeFromHistory, setVideoUrl } from '../lib/store';
import { createOffer, createPeerConnection } from '../lib/webrtc';
import { compressOffer } from '../lib/compress';
import Gallery from '../components/Gallery';
import CaptureControls from '../components/CaptureControls';
import { getEmbedUrl, isValidUrl, saveUrlToHistory } from '../lib/hosted-video-utils';
import { saveVideo, loadVideo, deleteVideo } from '../lib/video-files';
import OpenOutputScreen from '../components/OpenOutputScreen';
import { LOCAL_LIVE_VIDEO_FLAG } from './BroadcastScreen';
import { ErrorDisplay, reportError } from '../components/ErrorDisplay';

const showItem = async (keyOrUrl: string) => {
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

const pasteHandler = (e: ClipboardEvent) => {
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

const dropHandler = async (e: DragEvent) => {
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

const dragOverHandler = (e: DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = "2px dashed yellow";
};

const dragLeaveHandler = (e: DragEvent) => {
    (e.currentTarget as HTMLElement).style.outline = "";
};


export default function ControlScreen() {
    const [showQR, setShowQR] = createSignal(false);
    let peer: RTCPeerConnection;

    async function handleShowQR() {
        setShowQR(true);
        const offer = await createOffer(peer);
        const compressed = compressOffer(offer);
        const qrData = `${__LOCAL_ADDRESS__}/#/phone?offer=${compressed}`;

        console.log('QR data:', qrData);

        const canvas = document.getElementById("qr") as HTMLCanvasElement;
        await QRCode.toCanvas(canvas, qrData, { width: 400, errorCorrectionLevel: 'L' });

        const answer = await waitForAnswer();
        console.log('QR answer', answer);
        await peer.setRemoteDescription(answer);
    }

    async function waitForAnswer(): Promise<RTCSessionDescriptionInit> {
        while (true) {
            const res = await fetch(`${__LOCAL_ADDRESS__}/answer`);
            console.log('fetched answer', res);
            if (res.ok) {
                const data = await res.json();
                if (data.answer) {
                    return data.answer;
                }
            }
            // wait 1 sec before retry
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    onMount(async () => {
        // todo move to broadcast screen?
        if (history().length > 0) {
            showItem(history()[0]);
        }

        try {
            peer = createPeerConnection();

            peer.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', peer.iceConnectionState);
            };

            peer.onconnectionstatechange = () => {
                console.log('Connection state:', peer.connectionState);
                if (peer.connectionState === 'connected') {
                    console.log("Phone connected!");
                    setShowQR(false);
                }
            };
        } catch (e) {
            reportError(e);
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
                <button onClick={handleShowQR}>Phone</button>
            </nav>


            <Show when={showQR()}>
                <canvas id="qr" />
            </Show>

            <ErrorDisplay />
        </main>
    );
}
