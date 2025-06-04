import styles from './BannerEditor.module.scss';
import { createSignal } from 'solid-js';
import { banner, setBanner } from '../lib/stores/ui';

export default function BannerEditor() {
    let inputRef: HTMLInputElement | undefined;

    const [draftBanner, setDraftBanner] = createSignal(banner());

    function confirmEdit() {
        if (inputRef) {
            setDraftBanner(inputRef.value);
            setBanner(inputRef.value);
        }
    }

    function cancelEdit() {
        if (inputRef) {
            inputRef.value = banner();
            setDraftBanner(banner());
        }
    }


    return (
        <section class={styles['banner-editor-component']}>
            <h2>Default Banner</h2>
            <p>
                <input type="text" ref={inputRef} value={draftBanner()} placeholder='Default banner text' />
                <button class={styles['confirm-button']} onClick={() => confirmEdit()} title='Confirm'>✔</button>
                <button class={styles['cancel-button']} onClick={() => cancelEdit()} title='Reset'>↻</button>
            </p>

        </section>
    );
}