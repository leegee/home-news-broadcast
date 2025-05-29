import { createSignal } from 'solid-js';

const [error, setError] = createSignal<string | null>(null);

export function ErrorDisplay() {
    return error() && (
        <div style={{
            background: 'rgba(255,0,0,0.8)',
            color: 'white',
            padding: '1em',
            position: 'fixed',
            bottom: '0',
            width: '100%',
            'z-index': '9999',
            'font-size': '0.9em',
            'text-align': 'center'
        }}>
            ⚠️ {error()}
        </div>
    );
}

export function reportError(e: any) {
    const msg = typeof e === 'string' ? e : e?.message || 'Unknown error';
    console.error(e);
    setError(msg);
}
