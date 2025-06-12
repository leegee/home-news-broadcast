import { createSignal } from 'solid-js';
import defatulCatImage from '../lib/default-banner-image';
import { createSyncedPersistedSignal } from './base';

export const MEDIA_TYPES = {
    LIVE_LOCAL_CAMERA: 'LIVE_LOCAL_CAMERA',
    LIVE_REMOTE_CAMERA: 'LIVE_REMOTE_CAMERA',
    VIDEO: 'video',
    IMAGE: 'image',
    YOUTUBE: 'youtube',
    NONE: '',
} as const;

export type StreamType = (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES];

export interface MediaSource {
    url: string;
    type: StreamType;
}

export const [ticker, setTicker] = createSyncedPersistedSignal('cap-ticker', 'Click to edit');
export const [banner, setBanner] = createSyncedPersistedSignal('cap-banner', 'News From The Cat House');
export const [bannerImage, setBannerImage] = createSyncedPersistedSignal<string>('cap-banner-image', defatulCatImage);
export const [qrCode, setQrCode] = createSyncedPersistedSignal<string>('cap-qr-code', '');
export const [currentMediaType, setCurrentMediaType] = createSyncedPersistedSignal<string | null>('cap-stream-source', null);

export const [mediaStream, setMediaStream] = createSignal<MediaStream | null>(null);
export const [error, setError] = createSignal<string | null>(null);
export const [isCapturing, setIsCapturing] = createSignal(false);

export function initUiStorage() {
    setQrCode('');
    setCurrentMediaType(MEDIA_TYPES.NONE);
}
