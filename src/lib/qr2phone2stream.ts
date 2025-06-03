import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';
import { setQrCode, setMediaStream, setStreamSource, STREAM_TYPES } from './stores/ui';
import { reportError } from '../components/ErrorDisplay';
import { changeMedia } from './inter-tab-comms';
import { createSilentAudioStream } from './media';

let peer: Peer | null = null;
let reconnectAttempts = 0;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;

const peerId = 'desktop-ok';

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
            port: __RTC_PORT__,
            path: '/',
            config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            },
        });

        console.log('setupQRCodeFlow set peer');

        peer.on('open', (id) => {
            console.log('Desktop peer ID:', id);
            reconnectAttempts = 0; // reset on success

            const url = `${__LOCAL_WEBRTC_ADDRESS__}/#/phone?peerId=${id}`;
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
                reportError('Please check the local server is running.');
            } else {
                reportError(error);
            }

            if (reconnectAttempts < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, reconnectAttempts);
                console.log(`Retrying peer connection in ${delay} ms...`);
                setTimeout(() => {
                    reconnectAttempts++;
                    setupQRCodeFlow();
                }, delay);
            } else {
                reportError(`Unable to connect after ${MAX_RETRIES} attempts.`);
            }
        });

        peer.on('close', () => {
            console.log('PeerJS connection closed');
        });

        peer.on('call', (call: MediaConnection) => {
            console.log('Incoming call from phone:', call.peer);
            call.answer(createSilentAudioStream());

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
                changeMedia({ url: '', type: STREAM_TYPES.NONE });
            });

            call.on('error', (err) => {
                console.error('Call error:', err);
            });
        });

    } catch (e) {
        reportError(e);
    }
}
