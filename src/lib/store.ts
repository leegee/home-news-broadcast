import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage'; // sync doesn't work
import defatulCatImage from './default-banner-image';

const MAX_HISTORY = 30;

export const STREAM_TYPES = {
    LIVE_LOCAL: 'live_local',
    LIVE_EXTERNAL: 'live_external',
    VIDEO: 'video',
    IMAGE: 'image',
    YOUTUBE: 'youtube',
    NONE: '',
} as const;

export type StreamType = (typeof STREAM_TYPES)[keyof typeof STREAM_TYPES];

type HistoryItem = {
    key: string;
    headline: string;
    standfirst: string;
};

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

export const [history, setHistory] = createSyncedPersistedSignal<HistoryItem[]>('cap-history', []);
export const [ticker, setTicker] = createSyncedPersistedSignal('cap-ticker', 'Click to edit');
export const [banner, setBanner] = createSyncedPersistedSignal('cap-banner', 'Cat News');
export const [bannerImage, setBannerImage] = createSyncedPersistedSignal<string>('cap-banner-image', defatulCatImage);
export const [qrCode, setQrCode] = createSyncedPersistedSignal<string>('cap-qr-code', '');
export const [selectedKey, setSelectedKey] = createSyncedPersistedSignal('cap-selected-key', '');

export const [streamSource, setStreamSource] = createSignal<string | null>(null);
export const [mediaStream, setMediaStream] = createSignal<MediaStream | null>(null);
export const [error, setError] = createSignal<string | null>(null);

export function removeFromHistory(itemKey: string) {
    setHistory(history().filter(entry => entry.key !== itemKey));
}

export function saveUrlToHistory(item: HistoryItem) {
    let h = history();
    h = [item, ...h.filter(v => v.key !== item.key)];
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    setHistory(h);
}

export function initLocalStorage() {
    setQrCode('');
    setStreamSource(null);
    setMediaStream(null);
}

export const currentHistoryItem = () => {
    const key = selectedKey();
    return history().find(item => item.key === key);
};
