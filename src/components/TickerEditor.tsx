import styles from './TickerEditor.module.scss';
import { For, createEffect, createSignal } from 'solid-js';
import { ticker, setTicker } from '../lib/stores/ui';

const DELIMITER = ' · ';
const SPLIT_DELIMITER = /\s+·\s+/;

function parseTicker(t: string) {
    return t ? t.split(SPLIT_DELIMITER).map(part => part.trim()).filter(Boolean) : [];
}

export const TickerEditor = () => {
    const [values, setValues] = createSignal(parseTicker(ticker()));
    const [newValue, setNewValue] = createSignal('');

    // Sync when store changes externally
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

        const current = [...values()];
        if (index === current.length) {
            updateValuesAndStore([...current, val]);
            setNewValue('');
        } else {
            current[index] = val;
            updateValuesAndStore(current);
        }
    };

    const removeAt = (index: number) => {
        if (index === values().length) {
            setNewValue('');
            return;
        }

        const v = [...values()];
        v.splice(index, 1);
        updateValuesAndStore(v);
    };

    return (
        <section class={styles['ticker-editor-component']}>
            <h2>Ticker</h2>
            <ul class={styles['ticker-items']}>
                <For each={values()}>
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
                <li>
                    <input
                        type="text"
                        value={newValue()}
                        onInput={e => setNewValue(e.currentTarget.value)}
                    />
                    <button onClick={e =>
                        confirm(values().length, e.currentTarget.previousElementSibling as HTMLInputElement)
                    }>
                        ✔
                    </button>
                    <button onClick={() => removeAt(values().length)}>✖</button>
                </li>
            </ul>
        </section>
    );
};
