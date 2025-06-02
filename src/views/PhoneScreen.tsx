import styles from './PhoneScreen.module.scss';
import Peer, { MediaConnection } from 'peerjs';
import { useLocation } from '@solidjs/router';
import { createSignal, onCleanup, Show } from 'solid-js';
import { ErrorDisplay, reportError } from '../components/ErrorDisplay';
import { createSilentAudioStream } from '../lib/media';

async function getMediaStream(facing: 'user' | 'environment'): Promise<MediaStream> {
    try {
        return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: true
        });
    } catch (e) {
        try {
            return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (e) {
            return createSilentAudioStream();
        }
    }
}

export default function PhoneScreen() {
    const location = useLocation();
    const [facingMode, setFacingMode] = createSignal<'user' | 'environment'>('user');
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
                localStream = await getMediaStream(facingMode());
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

    async function switchCamera() {
        const newFacing = facingMode() === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);

        const newStream = await getMediaStream(newFacing);
        setStream(newStream);

        if (call) {
            // Replace tracks in call
            const sender = (call as any)._pc?.getSenders?.().find((s: any) => s.track?.kind === 'video');
            if (sender && sender.replaceTrack) {
                const newVideoTrack = newStream.getVideoTracks()[0];
                sender.replaceTrack(newVideoTrack);
            } else {
                // Restart if replaceTrack is not supported or fails
                call.close();
                startCall();
            }
        }
    }

    function endCall() {
        call?.close();
        stream()?.getTracks().forEach((track) => track.stop());
        if (peer && !peer.destroyed) {
            peer.destroy();
        }
        setConnected(false);
        setStream(undefined);
    }

    return (
        <section class={styles['phone-view']}>
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
                    <video class={styles['preview']}
                        autoplay playsinline muted ref={el => el && (el.srcObject = stream()!)} />
                    <div>Call active</div>

                    <button onClick={() => switchCamera()}> Switch Camera </button>

                    <Show when={connected()}>
                        <button onClick={() => endCall()} > End Call </button>
                    </Show>
                </Show>

                <Show when={localLog()}>
                    <div class={styles['local-log']}>{localLog()}</div>
                </Show>
            </Show>

            <ErrorDisplay />
        </section >
    );
}
