import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage'; // sync doesn't work

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
export const [banner, setBanner] = createSyncedPersistedSignal('cap-banner', 'Click to edit');
export const [videoUrl, setVideoUrl] = createSyncedPersistedSignal('cap-video-url', '');
export const [history, setHistory] = createSyncedPersistedSignal<string[]>('cap-history', []);
export const [bannerImage, setBannerImage] = createSyncedPersistedSignal<string>('', '');
