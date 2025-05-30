import { createSignal, onMount, Show } from "solid-js";
import QRCode from 'qrcode';
import { createOffer, createPeerConnection } from '../lib/webrtc';
import { compressOffer } from '../lib/compress';
import { reportError } from "../components/ErrorDisplay";
import { setQrCode } from "../lib/store";

export default function ShowQRCode() {
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
        setQrCode(canvas.toDataURL());

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

    });

    return (
        <>
            <button onClick={handleShowQR}>Phone</button>
            <Show when={showQR()}>
                <canvas id="qr" />
            </Show>
        </>
    );
}