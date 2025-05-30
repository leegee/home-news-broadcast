import QRCode from 'qrcode';
import { createOffer, createPeerConnection } from './webrtc';
import { compressOffer } from './compress';
import { setQrCode, setMediaStream } from './store';

export async function setupQRCodeFlow(): Promise<void> {
    const localAddress = __LOCAL_ADDRESS__;
    const peer = createPeerConnection();

    peer.oniceconnectionstatechange = () => console.log('ICE connection state:', peer.iceConnectionState);

    peer.onconnectionstatechange = () => {
        console.log('Connection state:', peer.connectionState);
        if (peer.connectionState === 'connected') {
            console.info("Phone connected!");
            setQrCode(''); // Clear the QR code when connected
        }
        else if (peer.connectionState === 'disconnected') {
            console.error('Disconnected WebRTC'); // todo
            setMediaStream(null);
        }
        else if (peer.connectionState === 'failed') {
            console.error('Failed to connect WebRTC'); // todo
        }
    };

    peer.ontrack = (event) => setMediaStream(event.streams[0]);

    const offer = await createOffer(peer);
    const compressed = compressOffer(offer);
    const qrData = `${localAddress}/#/phone?offer=${compressed}`;

    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, qrData, { width: 400, errorCorrectionLevel: 'L' });

    setQrCode(canvas.toDataURL());

    // Wait for phone to send an answer
    const answer = await waitForAnswer(localAddress);
    console.log('QR answer', answer);
    await peer.setRemoteDescription(answer);
}

async function waitForAnswer(localAddress: string): Promise<RTCSessionDescriptionInit> {
    while (true) {
        const res = await fetch(`${localAddress}/answer`);
        if (res.ok) {
            const data = await res.json();
            if (data.answer) return data.answer;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}
