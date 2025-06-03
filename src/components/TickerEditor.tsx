import styles from './TickerEditor.module.scss';
import { For, createEffect, createSignal } from 'solid-js';
import { ticker, setTicker } from '../lib/stores/ui';

const DELIMITER = ' · ';
const SPLIT_DELIMITER = /\s+·\s+/;

function parseTicker(t: string) {
    return t
        ? t.split(SPLIT_DELIMITER).map(part => part.trim()).filter(Boolean)
        : [''];
}

function ensureTrailingEmpty(arr: string[]) {
    if (arr.length === 0) return [''];
    return arr[arr.length - 1].trim() === '' ? arr : [...arr, ''];
}

export const TickerEditor = () => {
    // Confirmed values synced with the store
    const [values, setValues] = createSignal(parseTicker(ticker()));

    // Draft input values for live editing
    const [draftValues, setDraftValues] = createSignal(parseTicker(ticker()));

    const updateStore = (items: string[]) => {
        setTicker(items.filter(Boolean).join(DELIMITER));
    };

    const onInputChange = (index: number, value: string) => {
        const nextDraft = [...draftValues()];
        nextDraft[index] = value;
        setDraftValues(nextDraft);
    };

    const confirm = (index: number) => {
        const confirmed = [...values()];
        const draft = draftValues();

        // update confirmed at index with draft value
        confirmed[index] = draft[index];

        // if confirming last input and not empty, add a new empty input
        if (confirmed[index].trim() && index === confirmed.length - 1) {
            confirmed.push('');
            setDraftValues([...draft, '']);
        } else {
            setDraftValues(draft);
        }

        setValues(confirmed);
        updateStore(confirmed);
    };

    const removeAt = (index: number) => {
        const confirmed = [...values()];
        const draft = [...draftValues()];

        confirmed.splice(index, 1);
        draft.splice(index, 1);

        if (confirmed.length === 0) {
            confirmed.push('');
            draft.push('');
        }

        setValues(confirmed);
        setDraftValues(draft);
        updateStore(confirmed);
    };

    createEffect(() => {
        const parsed = ensureTrailingEmpty(parseTicker(ticker()));

        // sync confirmed values only if store changed externally
        if (parsed.join(DELIMITER) !== values().join(DELIMITER)) {
            setValues(parsed);
            setDraftValues(parsed);
        }
    });

    return (
        <section class={styles['ticker-editor-component']}>
            <h2>Ticker</h2>
            <ul class={styles['ticker-items']}>
                <For each={draftValues()}>
                    {(val, i) => (
                        <li>
                            <input
                                type="text"
                                value={val}
                                onInput={e => onInputChange(i(), e.currentTarget.value)}
                            />
                            <button onClick={() => confirm(i())}>✔</button>
                            <button onClick={() => removeAt(i())}>✖</button>
                        </li>
                    )}
                </For>
            </ul>
        </section>
    );
};
