import { createSignal } from 'solid-js';
import defatulCatImage from '../default-banner-image';
import { createSyncedPersistedSignal } from './store';

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

export const [ticker, setTicker] = createSyncedPersistedSignal('cap-ticker', 'Click to edit');
export const [banner, setBanner] = createSyncedPersistedSignal('cap-banner', 'Cat News');
export const [bannerImage, setBannerImage] = createSyncedPersistedSignal<string>('cap-banner-image', defatulCatImage);
export const [qrCode, setQrCode] = createSyncedPersistedSignal<string>('cap-qr-code', '');

export const [bannerResetCount, triggerBannerReset] = createSyncedPersistedSignal('cap-banner-reset-count', 0);
export const [streamSource, setStreamSource] = createSignal<string | null>(null);
export const [mediaStream, setMediaStream] = createSignal<MediaStream | null>(null);
export const [error, setError] = createSignal<string | null>(null);

export function initLocalStorage() {
    setQrCode('');
}
