import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';
import { setQrCode, setMediaStream, setStreamSource, STREAM_TYPES } from './store';
import { reportError } from '../components/ErrorDisplay';
import { changeMedia } from './broadcast-media';

let peer: Peer | null = null;
let reconnectAttempts = 0;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second

const peerId = 'desktop-ok';

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

    // Clean up previous peer
    if (peer) {
        peer.destroy();
        peer = null;
    }

    try {
        peer = new Peer(peerId, {
            host: __LOCAL_IP__,
            port: 9000,
            path: '/',
            config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            },
        });

        console.log('setupQRCodeFlow set peer');

        peer.on('open', (id) => {
            console.log('Desktop peer ID:', id);
            reconnectAttempts = 0; // reset on success

            const url = `${__LOCAL_ADDRESS__}/#/phone?peerId=${id}`;
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, url, { width: 400, errorCorrectionLevel: 'L' })
                .then(() => setQrCode(canvas.toDataURL()))
                .catch(err => console.error('QR code error:', err));
        });

        peer.on('error', (error) => {
            console.error('PeerJS error:', error);

            if (error.type === 'unavailable-id') {
                reportError(`Peer ID "${peerId}" is already in use.`);
            } else if (error.message.includes('Lost connection')) {
                reportError('Please check the local server is running!');
            } else {
                reportError(error);
            }

            if (reconnectAttempts < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, reconnectAttempts);
                console.log(`Retrying peer connection in ${delay}ms...`);
                setTimeout(() => {
                    reconnectAttempts++;
                    setupQRCodeFlow();
                }, delay);
            } else {
                reportError('Unable to connect after several attempts.');
            }
        });

        peer.on('close', () => {
            console.log('PeerJS connection closed');
        });

        peer.on('call', (call: MediaConnection) => {
            console.log('Incoming call from phone:', call.peer);
            call.answer(createEmptyStream());

            call.on('stream', (remoteStream) => {
                console.log('Received remote media stream from phone');
                setMediaStream(remoteStream);
                setStreamSource('peer');
                changeMedia({ url: '', type: STREAM_TYPES.LIVE_EXTERNAL });
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

    } catch (e) {
        reportError(e);
    }
}
