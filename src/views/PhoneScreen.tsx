import Peer, { MediaConnection } from 'peerjs';
import { useLocation } from '@solidjs/router';
import { createSignal, onCleanup, Show } from 'solid-js';
import { ErrorDisplay, reportError } from '../components/ErrorDisplay';

let audioCtx: AudioContext | null = null;

function createSilentAudioStream(): MediaStream {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const dst = audioCtx.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.01);
    return dst.stream;
}

export default function PhoneScreen() {
    const location = useLocation();

    const [connected, setConnected] = createSignal(false);
    const [stream, setStream] = createSignal<MediaStream>();
    const [localLog, setLocalLog] = createSignal<string | null>(null);

    let peer: Peer | null = null;
    let call: MediaConnection | null = null;

    async function startCall() {
        try {
            const desktopPeerIdRaw = location.query.peerId;
            if (!desktopPeerIdRaw) {
                setLocalLog('Missing "peerId" (desktop peer ID) in URL query.');
                reportError('Missing "peerId" (desktop peer ID) in URL query.');
                return;
            }

            const desktopPeerId = Array.isArray(desktopPeerIdRaw) ? desktopPeerIdRaw[0] : desktopPeerIdRaw;
            setLocalLog(`Desktop Peer ID from peerId param: ${desktopPeerId}`);

            let localStream: MediaStream | undefined;

            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (e) {
                setLocalLog('No video');
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                } catch (e) {
                    setLocalLog('No audio, using silent audio stream');
                    localStream = createSilentAudioStream();
                }
            }

            setStream(localStream);
            setLocalLog('Got local media stream');

            if (peer && !peer.destroyed) {
                peer?.destroy();
            }

            peer = new Peer('phone-ok', { host: __LOCAL_IP__, port: 9000, path: '/' });

            if (!peer) {
                throw new Error('no peer')
            }

            peer.on('open', (id) => {
                setLocalLog(`Phone peer ID: ${id}`);

                if (!localStream) {
                    setLocalLog('Nothing to stream');
                    throw new Error('Nothing to stream');
                }

                call = peer!.call(desktopPeerId, localStream);

                call.on('close', () => {
                    setLocalLog('Call closed');
                    setConnected(false);
                    setStream(undefined);
                });

                call.on('error', (err) => {
                    setLocalLog('Call error: ' + err);
                    reportError(err);
                });
            });

            peer.on('error', (err) => {
                setLocalLog('Peer error: ' + err);
                reportError(err);
            });

            setConnected(true);
        } catch (e) {
            reportError(e);
            setLocalLog(`Error: ${String(e)}`);
        }
    }

    onCleanup(() => {
        stream()?.getTracks().forEach((track) => track.stop());
        call?.close();
        if (peer && !peer.destroyed) {
            peer?.destroy();
        }
    });

    return (
        <section>
            <Show when={connected()} fallback={
                <>
                    <h2>Not connected</h2>
                    <button onClick={startCall}>Start Call</button>
                    <Show when={localLog()}>
                        <div style={{ color: 'green' }}>{localLog()}</div>
                    </Show>
                </>
            }>
                <Show when={stream()} fallback={<h2>Waiting for media stream...</h2>}>
                    {/* <video autoplay playsinline muted ref={el => el && (el.srcObject = stream()!)} /> */}
                    <div>Call active — OK</div>
                </Show>
                <Show when={localLog()}>
                    <div style={{ color: 'green' }}>{localLog()}</div>
                </Show>
            </Show>
            <ErrorDisplay />
        </section>
    );
}
