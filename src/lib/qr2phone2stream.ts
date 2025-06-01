import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';
import { setQrCode, setMediaStream, setStreamSource } from './store';
import { reportError } from '../components/ErrorDisplay';

let peer: Peer | null = null;
const peerId = 'desktop-' + 'ok'; // Math.floor(Math.random() * 10000);

function createEmptyStream(): MediaStream {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const destination: MediaStreamAudioDestinationNode = ctx.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();
    return destination.stream;
}

export async function setupQRCodeFlow() {
    console.log('setupQRCodeFlow enter');
    if (peer && !peer.destroyed) {
        peer.destroy();
        console.log('setupQRCodeFlow remove prev');
    };

    peer = new Peer(peerId, {
        host: __LOCAL_IP__,
        port: 9000,
        path: '/',
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ]
        }
    });

    console.log('setupQRCodeFlow set peer');

    if (peer) {
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
            if (error.message.includes('Lost connection')) {
                reportError('Please check the local server is running!');
            } else {
                reportError(error);
            }
        });

        peer.on('call', (call: MediaConnection) => {
            console.log('Incoming call from phone:', call.peer);

            // Answer the call without sending a stream (desktop is receiver only)
            // but may need to send something to meet non-spec'd expectations
            call.answer(createEmptyStream());

            call.on('stream', (remoteStream) => {
                console.log('Received remote media stream from phone', remoteStream);
                setMediaStream(remoteStream);
                setStreamSource('peer');
                setQrCode('');
            });

            call.on('close', () => {
                console.log('Call closed');
                setMediaStream(null);
                setStreamSource(null);
            });

            call.on('error', (err) => {
                console.error('Call error:', err);
            });
        });
    }
}
