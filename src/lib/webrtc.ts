const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
];

export function createPeerConnection() {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peer.createDataChannel("test"); // force ICE gathering to start
    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('New ICE candidate:', event.candidate.candidate);
        } else {
            console.log('ICE gathering complete (null candidate)');
        }
    });
    return peer;
}

export function waitForIceGatheringComplete(peer: RTCPeerConnection): Promise<void> {
    return new Promise(resolve => {
        if (peer.iceGatheringState === 'complete') {
            resolve();
            return;
        }

        const checkState = () => {
            if (peer.iceGatheringState === 'complete') {
                cleanup();
                resolve();
            }
        };

        const onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
            if (!event.candidate) {
                cleanup();
                resolve();
            }
        };

        const cleanup = () => {
            peer.removeEventListener('icegatheringstatechange', checkState);
            peer.removeEventListener('icecandidate', onIceCandidate);
        };

        peer.addEventListener('icegatheringstatechange', checkState);
        peer.addEventListener('icecandidate', onIceCandidate);
    });
}

export async function createOffer(peer: RTCPeerConnection) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIceGatheringComplete(peer);
    return peer.localDescription!;
}

export async function createAnswer(peer: RTCPeerConnection, offer: RTCSessionDescriptionInit) {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitForIceGatheringComplete(peer);
    return peer.localDescription!;
}
