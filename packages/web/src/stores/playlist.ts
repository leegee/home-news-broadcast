import { createSyncedPersistedSignal } from './base';

export type PlaylistItem = {
    key: string;
    headline: string;
    standfirst: string;
};

const MAX_ITEMS = 30;

export const [playlist, setPlaylist] = createSyncedPersistedSignal<PlaylistItem[]>('cap-playlist', []);
export const [selectedKey, setSelectedKey] = createSyncedPersistedSignal<string>('cap-selected-key', '');

export function getPlaylistList(key: string): PlaylistItem {
    const item = playlist().find(item => item.key === key);
    return item || { key, headline: '', standfirst: '' };
}

export function removeFromPlaylist(itemKey: string) {
    setPlaylist(playlist().filter(entry => entry.key !== itemKey));
}

export function savePlaylistItem(item: PlaylistItem) {
    let h = playlist();
    h = [item, ...h.filter(v => v.key !== item.key)];
    if (h.length > MAX_ITEMS) h = h.slice(0, MAX_ITEMS);
    setPlaylist(h);
}

export function updateCurrentPlaylistItem(updates: Partial<Pick<PlaylistItem, 'headline' | 'standfirst'>>) {
    const key = selectedKey();
    if (!key) return;

    const updated = playlist().map(item =>
        item.key === key ? { ...item, ...updates } : item
    );

    setPlaylist(updated);
}

export function movePlaylistItem(current: string, direction: number) {
    const items = playlist();
    const currentIndex = items.findIndex(item => item.key === current);

    if (currentIndex === -1 || items.length < 2) {
        return;
    }

    // Wrap the index
    const newIndex = (currentIndex + direction + items.length) % items.length;

    const updated = [...items];
    [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];

    setPlaylist(updated);
    setSelectedKey(updated[newIndex].key);
}

export const navigatePlaylist = (direction: number) => {
    const items = playlist();
    const currentKey = selectedKey();
    if (items.length === 0) return;

    let index = items.findIndex(item => item.key === currentKey);
    if (index === -1) {
        index = direction > 0 ? -1 : 0;
    }

    const newIndex = (index + direction + items.length) % items.length;
    setSelectedKey(items[newIndex].key);
};


export function initPlaylistStorage() {
    setSelectedKey('');
}