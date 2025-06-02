import { createSignal } from 'solid-js';
import styles from './MetadataModal.module.scss';

interface MetadataModalProps {
    onSave: (headline: string, standfirst: string) => void;
    onCancel: () => void;
}

export default function MetadataModal(props: MetadataModalProps) {
    const [headline, setHeadline] = createSignal('');
    const [standfirst, setStandfirst] = createSignal('');

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
