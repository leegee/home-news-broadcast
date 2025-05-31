import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage'; // sync doesn't work
import defatulCatimage from './default-banner-image';

export const STREAM_TYPES = {
    LIVE_LOCAL: 'live_local',
    LIVE_EXTERNAL: 'live_external',
    VIDEO: 'video',
    IMAGE: 'image',
    YOUTUBE: 'youtube',
    NONE: '',
} as const;

const MAX_HISTORY = 30;
export type StreamType = 'live_local' | 'live_external' | 'video' | 'image' | 'youtube' | '';

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
export const [history, setHistory] = createSyncedPersistedSignal<string[]>('cap-history', []);
export const [bannerImage, setBannerImage] = createSyncedPersistedSignal<string>('cap-banner-image', defatulCatimage);
export const [qrCode, setQrCode] = createSyncedPersistedSignal<string>('cap-qr-code', '');
export const [selectedKey, setSelectedKey] = createSyncedPersistedSignal('cap-selected-key', '');

export const [videoOrImageSource, setVideoOrImageSource] = createSignal<MediaSource>({ url: '', type: '' });
export const [streamSource, setStreamSource] = createSignal<string | null>(null);
export const [mediaStream, setMediaStream] = createSignal<MediaStream | null>(null);

export function removeFromHistory(item: string) {
    setHistory(history().filter(entry => entry !== item));
}

export function saveUrlToHistory(url: string) {
    let h = history();
    h = [url, ...h.filter(v => v !== url)]; // prepend new URL, remove duplicates
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    setHistory(h);
}

export function initLocalStorage() {
    setQrCode('');
    setStreamSource(null);
    setMediaStream(null);
}

