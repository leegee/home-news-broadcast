import styles from './BannerEditor.module.scss';
import { createSignal } from 'solid-js';
import { banner, setBanner } from '../lib/stores/ui';

export default function BannerEditor() {
    const [draftBanner, setDraftBanner] = createSignal(banner());

    function cancelEdit() {
        setDraftBanner(banner());
    }

    function confirmEdit() {
        setBanner(draftBanner());
    }

    return (
        <section class={styles['banner-editor-component']}>
            <h2>Default Banner</h2>
            <p>
                <input type="text" value={draftBanner()} placeholder='Default banner text' />
                <button class={styles['confirm-button']} onClick={() => confirmEdit()}> ✔ </button>
                <button class={styles['cancel-button']} onClick={() => cancelEdit()}>✖</button>
            </p>

        </section>
    );
}