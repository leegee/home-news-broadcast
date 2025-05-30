import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';
import { setQrCode, setMediaStream } from './store';

export async function setupQRCodeFlow() {
    const peerId = 'desktop-' + 'ok'; // Math.floor(Math.random() * 10000);
    const peer = new Peer(peerId, {
        host: __LOCAL_IP__,
        port: 9000,
        path: '/',
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ]
        }
    });

    peer.on('open', (id) => {
        console.log('Desktop peer ID:', id);

        const url = `${__LOCAL_ADDRESS__}/#/phone?peerId=${id}`;

        console.log('QR Code is for', url);

        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, url, { width: 400, errorCorrectionLevel: 'L' })
            .then(() => setQrCode(canvas.toDataURL()))
            .catch(err => console.error('QR code error:', err));
    });

    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        reportError(error);
    });

    peer.on('call', (call: MediaConnection) => {
        console.log('Incoming call from phone:', call.peer);

        // Answer the call without sending a stream (desktop is receiver only)
        // but may need to send something to meet non-spec'd expectations
        call.answer();

        call.on('stream', (remoteStream) => {
            console.log('Received remote media stream from phone', remoteStream);
            setMediaStream(remoteStream);
            setQrCode('');
        });

        call.on('close', () => {
            console.log('Call closed');
            setMediaStream(null);
        });

        call.on('error', (err) => {
            console.error('Call error:', err);
        });
    });
}
