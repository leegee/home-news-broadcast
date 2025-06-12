import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';
import { setQrCode, setMediaStream, setCurrentMediaType, MEDIA_TYPES, mediaStream } from '../stores/ui';
import { reportError } from '../components/ErrorDisplay';
import { changeMedia } from './inter-tab-comms';
import { createSilentAudioStream } from './media';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;

const peerId = 'desktop-ok';
let peer: Peer | null = null;
let currentCall: MediaConnection | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;


export async function setupQRCodeFlow() {
    console.log('setupQRCodeFlow enter');

    // Clean up previous peer
    if (peer) {
        if (currentCall) {
            currentCall.close();
            currentCall = null;
        }
        peer.destroy();
        peer = null;
    }

    try {
        peer = new Peer(peerId, {
            secure: true,
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

            const url = 'https://' + __LOCAL_IP__ + ':'
                + (window.electronAPI ? __DEV_HTTP_PORT__ : __RTC_PORT__)
                + `/#/phone?peerId=${id}`;

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
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(() => {
                    reconnectAttempts++;
                    setupQRCodeFlow();
                }, delay);
            } else {
                reportError(`Unable to connect after ${MAX_RETRIES} attempts. Is this WebRTC phone service running?`);
            }
        });

        peer.on('close', () => {
            console.log('PeerJS connection closed');
            if (currentCall) {
                currentCall.close();
                currentCall = null;
            }
        });

        peer.on('call', (call: MediaConnection) => {
            console.log('Incoming call from phone:', call.peer);

            if (currentCall) {
                currentCall.close(); // Close the previous call if still active
                console.log('Closed previous call');
            }

            currentCall = call;
            call.answer(createSilentAudioStream());

            call.on('stream', (remoteStream) => {
                console.log('Received remote media stream from phone');
                setMediaStream(remoteStream);
                setCurrentMediaType('peer');
                changeMedia({ url: '', type: MEDIA_TYPES.LIVE_REMOTE_CAMERA });
                setQrCode('');
            });

            call.on('close', () => {
                console.log('Call closed');
                currentCall = null;
                setMediaStream(null);
                setCurrentMediaType(null);
                changeMedia({ url: '', type: MEDIA_TYPES.NONE });
            });

            call.on('error', (err) => {
                console.error('Call error:', err);
            });
        });


    } catch (e) {
        reportError(e);
    }
}

export function endCurrentCall() {
    console.log('Enter endCurrentCall')
    if (currentCall) {
        console.log('endCurrentCall has current call')
        currentCall.close();
        currentCall = null;
        mediaStream()?.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setCurrentMediaType(MEDIA_TYPES.NONE);
        changeMedia({ url: '', type: MEDIA_TYPES.NONE });
        setQrCode('');

    } else {
        console.warn('endCurrentCall found no current call');
    }
}
