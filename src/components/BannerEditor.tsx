import styles from './BannerEditor.module.scss';
import { createEffect, createSignal } from 'solid-js';
import { banner, setBanner } from '../lib/stores/ui';
import Help from './Help';

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

    createEffect(() => {
        const b = banner();
        setDraftBanner(b);
        if (inputRef) {
            inputRef.value = b;
        }
    });

    return (
        <section class={styles['banner-editor-component']}>
            <h2>Default Banner
                <Help>
                    <p>The default banner is shown on the broadcast screen when the media has no title. </p>
                    <p>You can edit it here or by clicking on it on the broadcast screen.</p>
                </Help>
            </h2>
            <p>
                <input type="text" ref={inputRef} value={draftBanner()} placeholder='Default banner text' />
                <button class={styles['confirm-button']} onClick={() => confirmEdit()} title='Confirm'>✔</button>
                <button class={styles['cancel-button']} onClick={() => cancelEdit()} title='Reset'>↻</button>
            </p>

        </section>
    );
}