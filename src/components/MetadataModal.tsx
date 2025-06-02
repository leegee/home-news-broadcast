import { createSignal, onMount } from 'solid-js';
import styles from './MetadataModal.module.scss';
import { getHistoryItem } from '../lib/stores/history';

interface MetadataModalProps {
    key: string;
    onSave: (headline: string, standfirst: string) => void;
    onCancel: () => void;
}

export default function MetadataModal(props: MetadataModalProps) {
    const [headline, setHeadline] = createSignal('');
    const [standfirst, setStandfirst] = createSignal('');

    onMount(() => {
        const item = getHistoryItem(props.key);
        setHeadline(item.headline || '');
        setStandfirst(item.standfirst || '');
    });

    return (
        <div class={styles.backdrop}>
            <div class={styles.modal}>
                <h2>Edit Metadata</h2>

                <label>
                    Headline:
                    <input value={headline()} onInput={e => setHeadline(e.currentTarget.value)} />
                </label>

                <label>
                    Standfirst:
                    <input value={standfirst()} onInput={e => setStandfirst(e.currentTarget.value)} />
                </label>

                <div class={styles.actions}>
                    <button onClick={() => props.onCancel()}>Cancel</button>
                    <button onClick={() => props.onSave(headline(), standfirst())}>Save</button>
                </div>
            </div>
        </div>
    );
}
