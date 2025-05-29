import { useLocation } from '@solidjs/router';
import { createSignal, Show, onMount } from 'solid-js';
import { decompressOffer } from '../lib/compress';
import { createAnswer, createPeerConnection } from '../lib/webrtc';
import { ErrorDisplay, reportError } from '../components/ErrorDisplay';

export default function PhoneJoin() {
    const location = useLocation();
    const [connected, setConnected] = createSignal(false);
    const [stream, setStream] = createSignal<MediaStream>();
    const [localLog, setLocalLog] = createSignal<string | null>(null);

    onMount(async () => {
        setLocalLog('Hi from local error');

        try {
            const offerEncodedRaw = location.query.offer;

            if (!offerEncodedRaw) {
                setLocalLog('Missing "offer" in URL query:' + JSON.stringify(location.query));
                reportError('Missing "offer" in URL query.');
                return;
            }

            setLocalLog('offerEncodedRaw ' + String(offerEncodedRaw));
            const offerEncoded = Array.isArray(offerEncodedRaw) ? offerEncodedRaw[0] : offerEncodedRaw;
            setLocalLog('offerencoded ' + String(offerEncoded) + ' ' + String(location.query.offer));
            const offer = decompressOffer(offerEncoded);
            setLocalLog('offer ' + String(offer));
            const peer = createPeerConnection();
            setLocalLog('peer' + String(peer));

            const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalLog(String('localStream ' + localStream));
            localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
            setStream(localStream);
            setLocalLog(String('create answer..'));

            await createAnswer(peer, offer);

            await fetch(__LOCAL_ADDRESS__ + '/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: peer.localDescription }),
            });
            reportError('OK');
            setConnected(true);
        }
        catch (e) {
            reportError(e);
        }

        return () => {
            stream()?.getTracks().forEach(track => track.stop());
        };
    });

    return (
        <section>
            <Show when={connected()} fallback={<h2>Connecting...</h2>}>
                <Show when={stream()} fallback={<h2>Waiting for stream...</h2>}>
                    <video autoplay playsinline muted ref={el => el && (el.srcObject = stream()!)} />
                </Show>
            </Show>
            <Show when={localLog()}>
                <div style={{ color: 'green' }}>{localLog()}</div>
            </Show>
            <ErrorDisplay />
        </section>
    );
}
