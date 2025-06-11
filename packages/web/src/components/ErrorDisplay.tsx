import './ErrorDisplay.css';
import { Show } from 'solid-js';
import { error, setError } from '../stores/ui';

export function ErrorDisplay() {
    return (
        <Show when={error()}>
            <aside class='error' onClick={() => setError(null)}>
                ⚠️ {error()}
            </aside>
        </Show>
    );
}

export function reportError(e: any) {
    const msg = typeof e === 'string' ? e : e?.message || 'Unknown error';
    setError(msg);
}
