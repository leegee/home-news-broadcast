import styles from './TickerEditor.module.scss';
import { For, createEffect, createSignal } from 'solid-js';
import { ticker, setTicker } from '../lib/stores/ui';

const DELIMITER = ' · ';
const SPLIT_DELIMITER = /\s+·\s+/;

function parseTicker(t: string) {
    return t ? t.split(SPLIT_DELIMITER).map(part => part.trim()).filter(Boolean) : [];
}

export const TickerEditor = () => {
    const [values, setValues] = createSignal(parseTicker(ticker())); // No trailing empty string here

    // Sync store → local state when store changes externally
    createEffect(() => {
        const parsed = parseTicker(ticker());
        if (parsed.join(DELIMITER) !== values().join(DELIMITER)) {
            setValues(parsed);
        }
    });

    const updateValuesAndStore = (newValues: string[]) => {
        setValues(newValues);
        setTicker(newValues.filter(Boolean).join(DELIMITER));
    };

    const confirm = (index: number, inputEl: HTMLInputElement) => {
        const val = inputEl.value.trim();
        if (!val) return;

        const v = [...values()];
        if (index === v.length) {
            // Confirming the extra empty input at the end → add new item
            v.push(val);
        } else {
            v[index] = val;
        }
        updateValuesAndStore(v);
    };

    const removeAt = (index: number) => {
        const v = [...values()];
        if (index === v.length) {
            // Removing the extra empty input → do nothing
            return;
        }
        v.splice(index, 1);
        updateValuesAndStore(v);
    };

    return (
        <section class={styles['ticker-editor-component']}>
            <h2>Ticker</h2>
            <ul class={styles['ticker-items']}>
                <For each={[...values(), '']}>
                    {(val, i) => {
                        let inputRef: HTMLInputElement | undefined;

                        return (
                            <li>
                                <input
                                    type="text"
                                    value={val}
                                    ref={el => (inputRef = el)}
                                />
                                <button onClick={() => confirm(i(), inputRef!)}>✔</button>
                                <button onClick={() => removeAt(i())}>✖</button>
                            </li>
                        );
                    }}
                </For>
            </ul>
        </section>
    );
};
