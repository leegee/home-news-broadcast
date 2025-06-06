let sharedAudioContext: AudioContext | null = null;

function createAudioContext(): AudioContext {
    if (!sharedAudioContext) {
        sharedAudioContext = new AudioContext();
    }

    if (sharedAudioContext.state === 'suspended') {
        void sharedAudioContext.resume(); // Fire and forget
    }

    return sharedAudioContext;
}

export function createSilentAudioStream(): MediaStream {
    if (!sharedAudioContext) {
        sharedAudioContext = createAudioContext();
    }
    const oscillator = sharedAudioContext.createOscillator();
    const dst = sharedAudioContext.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    oscillator.stop(sharedAudioContext.currentTime + 0.01);
    return dst.stream;
}
