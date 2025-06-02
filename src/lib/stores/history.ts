import { createMemo, createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

export type HistoryItem = {
    key: string;
    headline: string;
    standfirst: string;
};

const MAX_HISTORY = 30;

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

export const [selectedKey, setSelectedKey] = makePersisted(createSignal(''), {
    name: 'cap-selected-key',
    storage: localStorage,
});

export function removeFromHistory(itemKey: string) {
    setHistory(history().filter(entry => entry.key !== itemKey));
}

export function saveUrlToHistory(item: HistoryItem) {
    let h = history();
    h = [item, ...h.filter(v => v.key !== item.key)];
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    setHistory(h);
}

export const currentHistoryItem = createMemo(() => {
    const key = selectedKey();
    return history().find(item => item.key === key);
});

export function moveHistoryItem(direction: number) {
    const items = history();
    const current = selectedKey();
    const currentIndex = items.findIndex(item => item.key === current);

    if (currentIndex === -1 || items.length < 2) return;

    let newIndex = (currentIndex + direction + items.length) % items.length;

    if (newIndex === currentIndex) return;

    const updated = [...items];
    [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
    setHistory(updated);
    setSelectedKey(updated[newIndex].key);
}
