import { createMemo } from 'solid-js';
import { createSyncedPersistedSignal } from './store';

export type HistoryItem = {
    key: string;
    headline: string;
    standfirst: string;
};

const MAX_HISTORY = 30;

export const [history, setHistory] = createSyncedPersistedSignal<HistoryItem[]>('cap-history', []);
export const [selectedKey, setSelectedKey] = createSyncedPersistedSignal<string>('cap-selected-key', '');

export function removeFromHistory(itemKey: string) {
    setHistory(history().filter(entry => entry.key !== itemKey));
}

export function saveHistoryItem(item: HistoryItem) {
    let h = history();
    h = [item, ...h.filter(v => v.key !== item.key)];
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    setHistory(h);
}

export const currentHistoryItem = createMemo(() => {
    const key = selectedKey();
    return history().find(item => item.key === key);
});

export function moveHistoryItem(current: string, direction: number) {
    const items = history();
    const currentIndex = items.findIndex(item => item.key === current);

    if (currentIndex === -1 || items.length < 2) return;

    const newIndex = (currentIndex + direction + items.length) % items.length;

    if (newIndex === currentIndex) return;

    const updated = [...items];
    [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
    setHistory(updated);
    setSelectedKey(updated[newIndex].key);
}
