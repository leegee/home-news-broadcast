import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage'; // sync doesn't work
import defatulCatImage from '../default-banner-image';

export const STREAM_TYPES = {
    LIVE_LOCAL: 'live_local',
    LIVE_EXTERNAL: 'live_external',
    VIDEO: 'video',
    IMAGE: 'image',
    YOUTUBE: 'youtube',
    NONE: '',
} as const;

export type StreamType = (typeof STREAM_TYPES)[keyof typeof STREAM_TYPES];

export interface MediaSource {
    url: string;
    type: StreamType;
}

function createSyncedPersistedSignal<T>(key: string, initial: T): [() => T, (v: T) => void] {
    const [value, setValue] = makePersisted(createSignal<T>(initial), {
        name: key,
        storage: localStorage,
    });

    window.addEventListener('storage', (e: StorageEvent) => {
        try {
            if (e.key === key && e.newValue !== null) {
                const parsed = JSON.parse(e.newValue);
                setValue(parsed);
            }
        } catch (e) {
            console.error('error parsing json', e);
        }
    });

    return [value, setValue];
}

export const [ticker, setTicker] = createSyncedPersistedSignal('cap-ticker', 'Click to edit');
export const [banner, setBanner] = createSyncedPersistedSignal('cap-banner', 'Cat News');
export const [bannerImage, setBannerImage] = createSyncedPersistedSignal<string>('cap-banner-image', defatulCatImage);
export const [qrCode, setQrCode] = createSyncedPersistedSignal<string>('cap-qr-code', '');

export const [streamSource, setStreamSource] = createSignal<string | null>(null);
export const [mediaStream, setMediaStream] = createSignal<MediaStream | null>(null);
export const [error, setError] = createSignal<string | null>(null);

export function initLocalStorage() {
    setQrCode('');
    setStreamSource(null);
    setMediaStream(null);
}

